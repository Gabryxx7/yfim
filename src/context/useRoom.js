import React, { useContext } from "react";
import { AppContext } from "./AppContext.js";

export const useRoom = () => {
   const { room, setRoom, socket } = useContext(AppContext);
   
   return {
      room,
      update: (roomData) => setRoom(prevRoom => ({...prevRoom, ...roomData})),
      join: () => console.log("Joining room!")
   }
}