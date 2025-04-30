
import { useState,useContext,useRef } from "react"
import axios from "axios"
import { UserContext } from "./UserContext.jsx";
import { toast, ToastContainer } from "react-toastify"
import 'react-toastify/dist/ReactToastify.css';


export default function Register(){

    const inputRef = useRef(null);
    const [ error,setError ] = useState('');
    const [username,setUsername] = useState('');
    const [password,setPassword] = useState('');
    const [isLoginOrRegister,setIsLoginOrRegister] = useState('Register');
    const {setUsername:setLoggedInUsername,setId,setReceiverId } = useContext(UserContext);
   

     
    async function handleSubmit(e){
        e.preventDefault();
        const submitName = inputRef.current.value;

        const portionName = submitName.trim().split(' ');

        if( portionName[0] !== submitName){

            const url = isLoginOrRegister === 'Register' ? '/register':'/login';
            try {
            const { data } = await axios.post(url , {username,password}, { withCredentials: true});
            setLoggedInUsername(username);
            setId(data.id);
           }catch(error){
             if(error.response){
              const messageErr = error.response.data.error;
              toast.error(messageErr);
             }
            }
           
            
        }else {
            const msg = 'Only two names are allowed'; 
            setError(msg);
            toast.error(msg);

        }

    }

    function handleChange(e){
        let input = e.target.value;
    
        
        input = input
          .split(' ')
          .map((word) => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
          .join(' ');
    
        const words = input.trim().split(/\s+/);
    
        if (words.length > 2) {
          const msg = 'Only two names are allowed';
          setError(msg);
          toast.error(msg);
          return;
        } else if (words.some((w) => w.length > 9)) {
            const msg = 'No name above 9 characters';
            setError(msg);
            toast.error(msg);
            return;
        } else {
          setError('');
        }
    
        setUsername(input);
      };


    return(
    <>
    
     <div className="registerDiv">
        <h1 className="h1"> BeastMode</h1>
        <form method='post' onSubmit={handleSubmit} >
            <input type="text" value ={username} onChange={e=> {handleChange(e)}} placeholder="Name" name="username" ref={inputRef} className="inputReg" /><br /><br /><br />
            <input type="password" placeholder="Password" value ={password} onChange={e=>setPassword(e.target.value)} name="password" className="inputReg" /><br /><br /><br />
            <button type="submit" className="buttonSubmit"> { isLoginOrRegister === 'Register' ? 'Register': 'Login' } </button>
        </form>

        { isLoginOrRegister === 'Register' && (
             <div className="loginOrRegister">Already had an account? <button className="togglePurpose" onClick ={() => setIsLoginOrRegister('Login')}>Login here</button></div>
        )}
        { isLoginOrRegister !== 'Register' && (
             <div className="loginOrRegister">Don't have an account? <button className="togglePurpose" onClick ={() => setIsLoginOrRegister('Register')}>Create one</button></div>
        )}
     </div>
     <ToastContainer position="top-center" autoClose={3000} />  
     
    </>
)

}