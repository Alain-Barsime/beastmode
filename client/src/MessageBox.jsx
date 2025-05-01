import { useRef,useContext,useState,useEffect } from "react"
import Profile from './assets/profile.jpg'
import axios from "axios"
import { UserContext } from "./UserContext"


  const AllMessages = () => {
    const [ messages,setMessages ] = useState([]);
    const { selectedUser,receiverId,id,typing,setTyping } = useContext(UserContext);
    const socketRef= useRef(null);

    

  useEffect(()=>{
    if(receiverId !== null){
      fetch(`https://beastmode-main.onrender.com/messages?receiverId=${receiverId}&senderId=${id}`) 
      .then(res => res.json())
      .then(data => setMessages(data))
      .catch(err => console.log(err)) 

    }  
    },[receiverId,id]) 


  useEffect(()=>{
    socketRef.current = new WebSocket(`wss://beastmode-main.onrender.com?userId=${id}`);
    socketRef.current.onopen =()=>{
      console.log('Websocket connection established');
    }

    socketRef.current.onmessage =(e)=>{ 
      const data = JSON.parse(e.data);
    if(data.type === 'message'){
      if(
        (data.sender === id && data.receiver === receiverId)||
        (data.sender === receiverId && data.receiver === id)
      ){
        setMessages(prevMessages => [...prevMessages,data]);

      }
    }else if(data.type === 'typing'){
       setTyping(true);
       
    }

    }

    socketRef.current.onerror = (err)=>{
      console.dir(event);
    }
    
    return () => {
      socketRef.current.close();
    }

  },[receiverId,id]) 

 
    return(
        <>

      
{messages.map((message) => (
  message.sender !== id ? (
    <div key={message._id} className="whole-you">
      <div className="senderProf">
        {selectedUser?.profilePic !== null ? (
          <img src={selectedUser?.profilePic} className="profile-pic" />
        ) : (
          <span className="user-initials">
            {selectedUser?.username?.charAt(0).toUpperCase()}
          </span>
        )}
      </div>
      <div className="you-sent">
        <div className="message">
          {message.message.startsWith('http') ? (
            <a href={message.message} target="_blank" rel="noopener noreferrer">
              {message.message}
            </a>
          ) : (
            <p>{message.message}</p>
          )}
        </div>
      </div>
    </div>
  ) : (
    <div key={message._id} className="me-sent">
      <div className="message">
        {message.message.startsWith('http') ? (
          <a href={message.message} target="_blank" rel="noopener noreferrer">
            {message.message}
          </a>
        ) : (
          <p>{message.message}</p>
        )}
      </div>
    </div>
  )
))}



        </>
    )
}


export default AllMessages 