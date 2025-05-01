import { useState,useContext } from 'react'
import axios from "axios"
import Routes from "./routes"



function App() {

  axios.defaults.baseURL = 'https://beastmode-main.onrender.com';
  axios.defaults.withCredentials = true;  
  

  return (
    <>
   
        <Routes />
     
    </>
  )
}

export default App 
