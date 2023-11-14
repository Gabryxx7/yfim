import { useApp } from "./useApp";

export const useSession = () => {
   const {session, setSession}= useApp();
   return {
      session,
      updateSession: (sessionData) => setSession(prevSession => ({...prevSession, ...sessionData}))
   }
}