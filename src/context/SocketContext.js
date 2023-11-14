import React, { createContext, useReducer, useCallback, useContext } from "react";
import io from "socket.io-client";

// The context is some sort of "global static" object that can be retrieved by any component at any time
export const SocketContext = createContext()

// The provider here is just a wrapper on top of the default provider to customise the data that we can get from it
export const SocketProvider = (props) => {
   const activeSockets = {};

   const getSocket = (namespace) => {
      if(!namespace) return;
      if(!activeSockets[namespace]){
         activeSockets[namespace] = io.connect(`/${namespace}`);
         console.log("Creating new context socket ", namespace)
      }
      return activeSockets[namespace];
   }

   // This is the "global static" object that will keep track of the sockets we are using throughout the whole app
   const value = {
      getSocket: getSocket
   }; 
   return <SocketContext.Provider value={value}>{props.children}</SocketContext.Provider>;
}
