import React, { useContext, useEffect } from "react";
import { CMDS } from "../backend/Definitions.js";
import { useApp } from "./useApp";

export const useUser = () => {
   const {user, setUser, socket}= useApp();
   
   return {
      user,
      updateUser: (userData) => setUser(prevUser => ({...prevUser, ...userData}))
   }
}