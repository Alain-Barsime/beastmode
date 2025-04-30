import React, { useContext } from "react";
import { UserContext } from "./UserContext";

export default function UserSelected(){
    const { receiverId,users,selectedUser,setSelectedUser } = useContext(UserContext);
    setSelectedUser(users.find(u => u._id === receiverId));


    return(
        <>
           <div className="userProfile">
            <div className="photoHolder">{selectedUser?.profilePic !== null ? (
                <img src={selectedUser?.profilePic} className="profile-pic" />
                ) : (
                <span className="user-initials">{selectedUser?.username?.charAt(0).toUpperCase()}</span>
            )}</div> 
              <p>{ selectedUser ? selectedUser?.username : 'Loading...'}</p>
           </div> 
        </>
    )
}