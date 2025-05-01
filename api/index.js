const express = require('express');
const { createProxyMiddleware } = require('http-proxy-middleware');
const app = express();
const http = require('http');
const cors = require('cors');
const mongoose = require('mongoose');
const cookieParser= require('cookie-parser');
const bcrypt = require('bcryptjs');
const server = http.createServer(app);
const ws = require('ws');
const { MongoClient, ObjectId } = require('mongodb');

require("dotenv").config();
const uri = process.env.URI;


app.use(express.json());
app.use(cookieParser());


const wss = new ws.WebSocket.Server({ server });

const client = new MongoClient(uri);
const dbName = 'test';
const cloudinary = require('cloudinary').v2;
const multer = require('multer');
const upload = multer({ dest: 'upload/'});
cloudinary.config({
    
    cloud_name:process.env.CLOUD_NAME,
    api_key:process.env.API_KEY,
    api_secret:process.env.API_SECRET
})


app.use(cors({
    credentials: true,
    origin: process.env.CLIENT_URL,
}));

app.use('signaling', createProxyMiddleware({
  target:'https://beastmode-signaling.onrender.com',
  changeOrigin: true,
  pathRewrite: { '^/signaling': '' },

}))

const User = require('./models/user');
const Message = require('./models/message');
const jwt = require('jsonwebtoken');
const jwtSecret = process.env.JWT_SECRET;
const bcryptSalt = bcrypt.genSaltSync(10);


app.post('/register',async (req,res)=>{
    const { username,password } = req.body;
    const hashedPassword = bcrypt.hashSync(password,bcryptSalt);

    try {
        const createdUser = await User.create({ 
            username:username,
            password:hashedPassword
            
        })
        const userId = createdUser._id;
        jwt.sign({userId,username}, jwtSecret,{} , (err,token)=>{ 
            if(err) throw err;
          
            res.cookie('token',token , { sameSite:'none', secure:true }).status(201).json({
                id: createdUser._id,

            });         
    
        })
    } 
    catch(err){
        return res.status(401).json({ error: "This user already exist"});
    }

})

app.post('/login', async(req,res)=>{
    const {username,password } = req.body;
    const foundUser = await User.findOne({username});
    if(foundUser){
        const passOk = bcrypt.compareSync(password,foundUser.password);

        if(passOk){
            jwt.sign({ userId:foundUser._id , username }, jwtSecret, {}, (err,token)=>{
                if(err) throw err;
                res.cookie('token',token, { sameSite:'none',secure:true }).status(201).json({
                    id: foundUser._id,
                })
            }) 
                 
        }else {
          res.status(401).json({ error: "Wrong password for this user"});
        }
    } else {
      return res.status(401).json({ error: " No user found"});
    }
}) 


app.post('/upload', upload.single('photo'), async (req, res) => {
    try {
      const result = await cloudinary.uploader.upload(req.file.path);  
      const userId = req.body.userId; 
      if (!userId) {
        return res.status(400).json({ error: 'User ID is required' });
      }

      const updatedUser = await User.findByIdAndUpdate(
        userId,
        { profilePic: result.secure_url },
        { new: true }
      );
  
      if (!updatedUser) {
        return res.status(404).json({ error: 'User not found' });
      }
  
      console.log('User profile updated:', updatedUser); 
 
      res.json({ url: result.secure_url });
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  });
  
  
  



app.get('/verify',(req,res)=>{

    const token = req.cookies?.token;

    if(!token){
        console.log('No token found');
    }

    try {
        const decode = jwt.verify(token,jwtSecret);
        res.json({
            username: decode.username,
            _id: decode.userId
        });
    }catch (err) {
        res.status(401).json({ error: "Invalid token" });
      }

}) 


app.post('/sendMessage',async (req,res) => {
    const { senderId, messageSent, receiverId} = req.body;
     
    try {
        const sentMessage = await Message.create({
            receiver:receiverId,
            sender:senderId,
            message:messageSent,
            
        }) 

        const msgToSend = {
            type:'message',
            sender:senderId,
            receiver:receiverId,
            message:messageSent,
            createdAt: new Date()
        }


        wss.clients.forEach(client=>{
            if(client.readyState === ws.WebSocket.OPEN){
                client.send(JSON.stringify(msgToSend));
            }
        })


    }
    catch(error){
        console.log('Error:'+ error);
    }
  
}) 


app.get('/data', async (req, res) => {
    try {

      const loggedInUser = req.query.userId;
      await client.connect(); 
      const db = client.db(dbName); 
      const usersCollection = db.collection('users'); 
  
      const users = await usersCollection.find({ _id: {$ne: new ObjectId(loggedInUser)}}).toArray();
      res.json(users);
    } catch (err) {
      console.error(err);
      res.status(500).json({ error: 'Server error' });
    }
  });


  app.get('/messages', async (req,res) => {  
    try { 
        await client.connect();
        const db = client.db(dbName);
        const messagesCollection = db.collection('messages');
        const selectedUserId = req.query.receiverId;
        const loggedInUserId = req.query.senderId;

        if (!loggedInUserId || !selectedUserId) {
            return res.status(400).json({ error: 'Missing user IDs' });
          }

        const messages = await messagesCollection.find({
            $or: [
                { sender:loggedInUserId,receiver:selectedUserId },
                { sender:selectedUserId,receiver:loggedInUserId }
            ] 

         }).toArray();
        res.json(messages);     
        console.log('logged In: '+ loggedInUserId + 'and selectedUser: ' + selectedUserId);                                    
    }catch (err) {
        console.error(err);
        res.status(500).json({ error: 'server error'})
    }
     
  })

  app.get('/logout', (req, res) => {
  
    res.clearCookie('token', {
      httpOnly: true,     
      sameSite: 'none',   
      secure: true,       
    });
  
    console.log('Logout endpoint called');
    res.json({ message: 'Logged out successfully' });  
  });
  



  const onlineUsers = {};
  wss.on('connection',(ws)=>{
      let userId;

      ws.on('message',(message) =>{
        const data = JSON.parse(message);

        if(data.type ==='connect'){
            userId = data.userId;
            onlineUsers[userId] = ws;
            sendOnlineUsersToClients();
        }
      })

      ws.on('close',()=>{
        if(userId){
            delete onlineUsers[userId];
            sendOnlineUsersToClients();
        }
      })


  })


    function sendOnlineUsersToClients(){
        const onlineUserIds = Object.keys(onlineUsers);

        wss.clients.forEach((client)=>{
            if(client.readyState === ws.WebSocket.OPEN){
                client.send(
                    JSON.stringify({
                        type: 'online-users',
                        onlineUsers:onlineUserIds

                    })
                )
            }
        })
    }


    app.get('/user/:id', async (req, res) => {
        const { id } = req.params;

        if (!mongoose.Types.ObjectId.isValid(id)) {
          return res.status(400).json({ error: 'Invalid user ID format' });
        }
      
        try {
          const user = await User.findById(id).select('profilePic');
          if (!user) {
            return res.status(404).json({ error: 'User not found' });
          }
      
          res.json(user);
        } catch (err) {
          console.error('Error fetching user:', err.message);
          res.status(500).json({ error: 'Server error' });
        }
      });
      
      
      app.post('/send-file', upload.single('file'), async (req, res) => {
        try {
          const filePath = req.file.path;
      
        
          const result = await cloudinary.uploader.upload(filePath, {
            resource_type: "auto", 
          });
    
          res.json({ url: result.secure_url });
        } catch (err) {
          res.status(500).json({ error: err.message });
        }
      });
      



      app.get('/notifications/:userId', async (req, res) => {
        const unseenMessages = await Message.find({
          receiver: req.params.userId,
          seen: false
        })

        .populate('sender','receiver');
      
        res.json(unseenMessages);
      });
      


      app.put('/messages/seen', async (req, res) => {
        const { sender, receiver } = req.body;
        await Message.updateMany(
          { sender, receiver, seen: false },
          { $set: { seen: true } }
        );
        res.json({ success: true });
      });
      
  
mongoose 
   .connect(process.env.URI)
   .then(console.log('Mongodb connected,Hhhh alain you are doing it'))

   .catch((error) => console.log(error));

   

server.listen(4040, console.log('app running on port 4040'));

wss.on('listening',()=>{
    console.log('web sockets are doing well too');
})