import React, { useContext, useEffect } from "react";
import { CMDS } from "../backend/Definitions.js";
import { AppContext } from "./AppContext.js";

export const useUser = () => {
   const {user, setUser, socket} = useContext(AppContext);

   return {
      user,
      updateUser: (userData) => setUser(prevUser => ({...prevUser, ...userData}))
   }
}