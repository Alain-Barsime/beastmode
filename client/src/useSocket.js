import { useEffect, useRef } from "react";
import { io } from "socket.io-client";

export const useSocket = (id) => {
  const socket = useRef(null);

  useEffect(() => {
    socket.current = io("http://localhost:5000");

    if (id) {
      socket.current.emit("register", id);
    }

    return () => {
   
      socket.current.disconnect();
    };
  }, [id]);

  return socket;
};
