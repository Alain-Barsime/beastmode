import React, { useContext, useEffect } from "react";
import { UserContext } from "./UserContext";

export default function Loader() {
  const { isDarkMode } = useContext(UserContext);

  useEffect(() => {
    console.log("isDarkmode:", isDarkMode); 

    if (isDarkMode) {
      document.body.style.setProperty("background-color", "black", "important");
      document.body.style.setProperty("color", "white", "important");
    } else {
      document.body.style.setProperty("background-color", "white", "important");
      document.body.style.setProperty("color", "black", "important");
    }

    return () => {
      document.body.style.backgroundColor = "";
      document.body.style.color = "";
    };
  }, [isDarkMode]);

  return <p className="loading">Loading...</p>;
}
