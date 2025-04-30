import { useState,useContext } from 'react'
import axios from "axios"
import Routes from "./routes"



function App() {

  axios.defaults.baseURL = 'http://localhost:4040';
  axios.defaults.withCredentials = true;  
  

  return (
    <>
   
        <Routes />
     
    </>
  )
}

export default App 
