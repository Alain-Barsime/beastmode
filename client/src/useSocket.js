import { useEffect, useRef } from "react";
import { io } from "socket.io-client";

export const useSocket = (id) => {
  const socket = useRef(null);

  useEffect(() => {
    socket.current = io("https://beastmode-main.onrender.com/signaling");

    if (id) {
      socket.current.emit("register", id);
    }

    return () => {
   
      socket.current.disconnect();
    };
  }, [id]);

  return socket;
};
