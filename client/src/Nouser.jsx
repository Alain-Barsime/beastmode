
import Start from './assets/start.png'



export default function Nouser(){

    return(
  <div className="selectUser">
    <img src={Start} className="select-user" />
    <p className="chat-now">To start chats, choose someone</p>
  </div>
  )
}