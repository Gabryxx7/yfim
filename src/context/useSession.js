import React, { useContext } from "react";
import { AppContext } from "./AppContext.js";

export const useSession = () => {
   const {session, setSession} = useContext(AppContext);
   return {
      session,
      update: (sessionData) => setSession(prevSession => ({...prevSession, ...sessionData}))
   }
}