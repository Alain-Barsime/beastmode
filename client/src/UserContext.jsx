import { createContext, useState ,useEffect, useRef} from "react";
import axios from "axios";

export const UserContext = createContext({});

export function UserContextProvider({ children }) {
  const [username, setUsername] = useState(null); 
  const [id, setId] = useState(null);       
  const [typing,setTyping ] = useState(false);
  const [ loading, setLoading ] = useState(true);
  const [ users,setUsers ] = useState([]);
  const [profilePic, setProfilePic] = useState(null);
  const [selectedUser,setSelectedUser ] = useState(null);
  const [callerId, setCallerId] = useState(null); 
  const [ accept,setAccept ] = useState(false);
  const [ offer,setOffer ] = useState(false);
  const [ offerHandler,setOfferHandler ] = useState(null);
 

  const [receiverId, setReceiverId] = useState(() => {
    const stored = localStorage.getItem('receiverId');
    if (stored === null) {
      localStorage.setItem('receiverId', '');
      return null;
    }
    return stored; 
  });
  const [callTime,setCallTime ]= useState(false);
  const [onlineUsers,setOnlineUsers ] = useState([]);

  const [isDarkMode, setIsDarkMode] = useState(() => {
     return localStorage.getItem('theme') === 'dark';
  });
  
  
  useEffect(()=>{
    axios.get('/verify',{ withCredentials: true }).then(response =>{
      setUsername(response.data.username); 
      setId(response.data._id);
      
    })

    .catch(()=>{
      setUsername(null);
      setId(null)
    })

    .finally(()=> setLoading(false));

  },[])



  const fetchAndSetProfilePic = async (id, setProfilePic) => {
    try {
      const res = await fetch(`http://localhost:4040/user/${id}`);
      if (res.ok) {
        const data = await res.json();
        setProfilePic(data.profilePic);
      } else {
        console.error('Failed to fetch profile picture');
      }
    } catch (err) {
      console.error('Error fetching profile picture:', err);
    }
  };
  




  useEffect(() => {
  if (id) {
    fetchAndSetProfilePic(id, setProfilePic);
  }
}, [id]);


  fetchAndSetProfilePic(id, setProfilePic);


  

  return (
    <UserContext.Provider value={{ offerHandler,setOfferHandler,setOffer,offer,accept,setAccept,setCallerId,callerId,setOnlineUsers,onlineUsers,setCallTime,callTime,fetchAndSetProfilePic,setSelectedUser,selectedUser,profilePic,setProfilePic,users,setUsers,isDarkMode,setIsDarkMode,username, setUsername, id, setId, loading, setReceiverId , receiverId,typing,setTyping }}>
      {children}
    </UserContext.Provider>
  );
}

