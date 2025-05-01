import { useState,useEffect,useContext } from 'react'
import { UserContext } from './UserContext';




const UserList = ()=>{
    
    const { users,setUsers,receiverId,setReceiverId,id } = useContext(UserContext);
   
    const { onlineUsers,setOnlineUsers } = useContext(UserContext);
    const userId = id;

    useEffect(()=>{
        const socket = new WebSocket(`wss://beastmode-main.onrender.com?userId=${id}`);
        socket.onopen = () => {
            socket.send(JSON.stringify({ type:'connect',userId})); 
        }

        socket.onmessage = (e) =>{
            const data = JSON.parse(e.data);
            if(data.type === 'online-users'){
                setOnlineUsers(data.onlineUsers);
            }
        }

        socket.onclose = ()=>{
            console.log('web sockets closed');
        }
        
        return () => {
            if (socket.readyState === WebSocket.OPEN || socket.readyState === WebSocket.CONNECTING) {
              socket.close();
            }
          };
          
          
    },[userId]);



    useEffect(() => {
        fetch(`https://beastmode-main.onrender.com/data?userId=${id}`)
            .then(res => res.json())
            .then(data => setUsers(data))
            .catch(err => console.log(err)); 
    }, [id]);

    return(
    <> 
        {users.map(user => ( 
       
           <div
                className="userMain"
                key={user._id}
                onClick={() => setReceiverId(user._id)}
                style={
                    receiverId === user._id
                    ? { borderLeftWidth: '1vh', borderLeftColor: 'blue', borderLeftStyle: 'solid' } 
                    : {}
                }
           >
     
           <div className='profile'>{user.profilePic !== null ? (
                <img src={user.profilePic} className="profile-pic" />
                ) : (
                <span className="user-initials">{user.username?.charAt(0).toUpperCase()}</span>
                )}
           </div> 
           <div className='nameStatus'>
              <p className='userName'>{user.username}</p>
              <div
                className={
                    onlineUsers.includes(user._id)
                    ? 'user-online'
                    : 'user-offline'
                }
              />          
           </div>
           
       </div>
    
    )      

)} 
</>
    )
}
export default UserList




   