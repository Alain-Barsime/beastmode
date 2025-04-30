import Register from './register'
import { useContext, useState } from 'react'
import { UserContext } from './UserContext'
import Chat from './Chat'
import Loader from './Loading'
import Video from './video'

export default function Routes(){
    const {callTime,username, loading } = useContext(UserContext);
    
    if(loading){
       return(
        <Loader />
       )
    }

    if(username && callTime){
        return (
            <Video />
        )
    }

    if(username){
        return (
            <Chat />
        );
    }
      
    return(
        <>
          <Register />
        </>
    )
}  

