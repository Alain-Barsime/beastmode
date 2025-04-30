import logo from './assets/logo.png'
import UserList from './UserList'
import { React,useState,useRef,useEffect,useContext } from 'react'
import axios from "axios"
import { UserContext } from './UserContext'
import AllMessages from './MessageBox'
import UserSelected from './UserSelected'
import Send from './assets/send.png'
import Emoji from './assets/emoji.png'
import Import from './assets/addFile.png' 
import Nouser from './Nouser'
import Dark from './assets/dark.png'
import White from  './assets/white.png'
import Logout from  './assets/logout.png'
import Person from  './assets/person.png'
import Video from './assets/call.png'
import Notification from './assets/notification.png'
import { toast, ToastContainer } from "react-toastify"
import 'react-toastify/dist/ReactToastify.css';
import { io } from 'socket.io-client'
import { useSocket } from "./useSocket";


export default function Chat(){
  const { setOfferHandler,setOffer,setAccept,setCallTime,callerId,setCallerId ,users,fetchAndSetProfilePic,setProfilePic,username,profilePic,id,receiverId,setReceiverId,typing,setTyping,isDarkMode,setIsDarkMode } = useContext(UserContext);
  const [showDropdown, setShowDropdown] = useState(false);
  const [showEmojis, setShowEmojis] = useState(false);
  const [notifications, setNotifications] = useState([]);
  const [showNotifications, setShowNotifications] = useState(false);
  const [incomingCall, setIncomingCall] = useState(false);


  const socket = useRef(null);
  const messageRef= useRef(null);
  

  const emojis = ['😀', '😂', '😍', '😎', '😢', '🤔', '🎉','😱','🙌','🙏','🚀','🎮'];
  const emojiRef = useRef(null);

  const toggleEmojis = () => {
    setShowEmojis(prev => !prev);
  };

  const handleEmojiClick = (emoji) => {
    if (messageRef.current) {
      messageRef.current.value += emoji; 
      messageRef.current.focus();
    }

    setShowEmojis(false);
  };
  

      useEffect(() => {
        function handleClickOutside(event) {
          if (emojiRef.current && !emojiRef.current.contains(event.target)) {
            setShowEmojis(false);
          }
        }

        document.addEventListener('mousedown', handleClickOutside);

        return () => {
          document.removeEventListener('mousedown', handleClickOutside);
        };
      }, []);


 
  const fileInputRef = useRef(null); 
  const dropdownRef = useRef(null);

       
      const toggleDropdown = () => setShowDropdown(prev => !prev);

      useEffect(()=>{
          fetchAndSetProfilePic(id,setProfilePic);
      },[])
      useEffect(() => {
        document.body.classList.toggle('dark-mode', isDarkMode);
      }, [isDarkMode]);
      
      const handleDarkMode = () => {
        setIsDarkMode(prev => {
          const newMode = !prev;
          localStorage.setItem('theme', newMode ? 'dark' : 'light');
          document.body.classList.toggle('dark-mode', newMode);
          return newMode;
        });
      };
      

      const handleLogout = async () => {
        try {
          const response = await fetch('http://localhost:4040/logout', {
            method: 'GET',
            credentials: 'include', 
          });
 
          if (response.ok) {
        
            setReceiverId(''); 
    
            window.location.href = '/register'; 
          } else {
            console.error('Logout failed', response.status);
          }
        } catch (err) {
          console.error('Logout failed', err);
        }
      };
      

      const handleFileChange = async (e) => {
        const file = e.target.files[0];
        if (file) {
  
          const formData = new FormData();
          formData.append("photo", file);
          formData.append("userId", id); 
      
       
          const newProfilePicUrl = URL.createObjectURL(file);
          setProfilePic(newProfilePicUrl);  
      
          try {
        
            const response = await fetch(`http://localhost:4040/upload?userId=${id}`, {
              method: "POST",
              body: formData,
            });
      
            console.log("Response status:", response.status);
      
            if (response.ok) {
       
              const data = await response.json();
         
              setProfilePic(data.url); 

            } else {
              console.error("Upload failed, status:", response.status);
     
            }
          } catch (error) {
            console.error("Error uploading file:", error);
       
          }
        }
      };
      


      const handleChangePic = () => {
        fileInputRef.current.click();
      };
     

      useEffect(() => {
        function handleClickOutside(event) {
          if ((dropdownRef.current && !dropdownRef.current.contains(event.target))) {
            setShowDropdown(false);
            setShowNotifications(false);
          }
        }
    
        document.addEventListener("mousedown", handleClickOutside);
        
        return () => {
          document.removeEventListener("mousedown", handleClickOutside);
        };
      }, []);


     useEffect(()=>{

      if(receiverId !==null){
        localStorage.setItem('receiverId',receiverId)
      }

     },[receiverId])

      async function sendMessage(e){
        e.preventDefault();
        const supposedSent = messageRef.current.value.trim();
        if(supposedSent !== ''){
            const messageSent = messageRef.current.value;
            messageRef.current.value = '';  
            await axios.post('/sendMessage',{receiverId,senderId: id ,messageSent, seen:false }, { withCredentials: true}) 
      } else {
        const msg = 'You cant send empty message';
        toast.error(msg);

      }
      }

      function handleLogo(){
        setReceiverId('');
        localStorage.removeItem('receiverId');
      }





      const handleFileSend = async (event) => {
        const file = event.target.files[0];
        if (!file) return;
      
        const formData = new FormData();
        formData.append("file", file);
        formData.append("senderId", id); 
        formData.append("receiverId", receiverId);  
      
        try {
          const res = await fetch("http://localhost:4040/send-file", {
            method: "POST",
            body: formData,
          });
          const data = await res.json();
          messageRef.current.value = data.url;
          
        } catch (err) {
          console.error("Failed to send file:", err);
        }
      };
     

      useEffect(() => {
        if (receiverId) {
          axios.put('/messages/seen', {
            sender: receiverId,
            receiver: id
          });
        }
      }, [receiverId]);




      useEffect(() => {
        axios.get(`/notifications/${id}`).then(res => {
          setNotifications(res.data);
        });
      }, []);
      

      const toggleDropdownNotification = () => {
        setShowNotifications(prev => !prev);
      };
      


      useEffect(() => {
        setNotifications((prevNotifications) => {
          return prevNotifications
            .map((note) => {
              if (note.sender === receiverId && note.receiver === id && note.seen === false) {
                return { ...note, seen: true };
              }
              return note; 
            })
            .filter((note) => {
            
              return !(note.sender === receiverId && note.receiver === id && note.seen === true);
            });
        });
      }, [receiverId, id]);


    
      useSocket(id);    




      useEffect(() => {
        socket.current = io("http://localhost:5000"); 

        socket.current.emit("register", id);
      
        socket.current.on("connect", () => {
          console.log("Connected to socket server with id:", socket.current.id);
        });
      
        





        socket.current.on("offer", async ({ offer,from}) => {
          setOfferHandler(offer);
          setOffer(true);
          setIncomingCall(true);
          setCallerId(from);
        });


      

        socket.current.on("hangup", () => {
          console.log("[Chat.jsx] Call ended");
          setIncomingCall(false);
          setCallerId(null);
        });
      }, [id]);


      
     const acceptCall = async () => {
            console.log("[Chat.jsx] Accepting call");

            setIncomingCall(false); 
            console.log(callerId);
            setCallTime(true);  
            setAccept(true);
          };


      



    
      const declineCall = () => {
        console.log("[Chat.jsx] Declining call");
        if (socket.current && callerId) {
          socket.current.emit("hangup", callerId);
        }
        setIncomingCall(false);
        setCallerId(null);
        toast.info("Call declined");
      };
      
   
    return(
        <>

        
          <div className="right-div">
            <div className="app">
              <img src={logo} className='logo' onClick={handleLogo} />
            </div>
            <div className="userDiv">
              <UserList />
            </div>
          </div>
          <div className="left-div"> 
            <div className='navHolder'>
              <div className='navigator'>
 


   { /* video calls are here in this section */}

           { receiverId != ''? (<button className='videoDiv' onClick={()=> setCallTime(true)}><img src={Video} /></button>):''} 
              


              <div className="notificationWrapper" ref={dropdownRef}>
                <button className="notificationBtn" onClick={toggleDropdownNotification}>
                  <img src={Notification} alt="notifications" />
                  {notifications.length > 0 && (
                    <div className="notificationCount">{notifications.length}</div>
                  )}
                </button>

                {showNotifications && (
                  <div className="notificationDropdown">
                    {notifications.length === 0 ? (
                      <p className="noNotifications">No new <br /> Notifications</p>
                    ) : (
                      notifications.map((note, index) => (
                        <div key={index} className="notificationItem">
                          <p><strong>From:</strong> {(users.find(user => user._id == note.sender) ? (users.find(user => user._id === note.sender))?.username : 'Unknown')}
                          </p> 
                          <p>{note.message}</p>
                        </div>
                      ))
                    )}
                  </div>
                )}
              </div>


            

              <div className="profileWrapper">

      <button className="profilePic" onClick={toggleDropdown}> 
        <p>You</p>
        <div className="profilePicHeader">
          {profilePic !== null ? ( 
                <img src={profilePic} className="profile-pic" />
                ) : (
                <span className="user-initials">{username.charAt(0).toUpperCase()}</span>
            )}



          <div className="activeIdentify"></div>
        </div>
        
      </button>
 
      {showDropdown && (
        <div className="dropdownMenu" ref={dropdownRef}>
          <div className="loggedInDiv">
            <p>{username}</p>
            <div></div>
          </div>
          
          
          <button onClick={handleDarkMode}>
            <img
              src={isDarkMode ? Dark : White}
              className="menuIcon"
            />
            Dark/Light
          </button>
          <button onClick={handleChangePic}>
        <img src={Person} className="menuIcon" alt="Avatar" />
        Change Avatar
      </button>
    
      <input
        type="file"
        ref={fileInputRef}
        onChange={handleFileChange}
        style={{ display: "none" }} 
      />

          <button onClick={handleLogout}>
            <img src={Logout} className="menuIcon" />
            Logout
          </button>
        </div>
      )}
    </div>


              </div>






              {incomingCall && (
                  <div className="incomingCallPopup">
                    <div className="popupButtons">
                      <button onClick={acceptCall} className="acceptButton">Accept</button>
                      <button onClick={declineCall} className="declineButton">Decline</button>
                    </div>
                  </div>
                )}











            </div>
 
            <div className='messageArea'> 
            {receiverId !== '' ? <><UserSelected /><AllMessages /></> : <Nouser />} 
            </div>
              
         {receiverId !== '' ? <>
              <div className="sendMessage"> 

              <button onClick={toggleEmojis}>
                  <img src={Emoji} alt="emoji button" />
             </button>

      {showEmojis && (
        <div className="emoji-dropup" ref={emojiRef}>
          {emojis.map((emoji, index) => (
            <span
              key={index}
              className="emoji"
              onClick={() => handleEmojiClick(emoji)}
            >
              {emoji}
            </span>
          ))}
          </div>
      )}

                  <input type='text' className='compose' placeholder="Write a message..." ref={messageRef} />
                  
                  <input
                    type="file"
                    onChange={handleFileSend}
                    ref={fileInputRef}
                    style={{ display: 'none' }}
                  />
                  <button onClick={() => fileInputRef.current.click()}> <img src={Import}/></button>



                  <button type="submit" onClick={e => sendMessage(e)} ><img src={Send}/></button>
              </div>
         </> : '' } 
         
         
         </div>
         <ToastContainer />
        </>
    )
} 


    
