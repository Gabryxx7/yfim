import React, { createContext, useReducer, useCallback, useContext, useState, useEffect, useRef, forwardRef } from "react";
import { TIMES, CMDS, STAGE, KEY_SHORTCUTS } from '../backend/Definitions.js';
import { TOASTS } from "../frontend/components/ToastCommunications.js";
import { useSocket } from "./useSocket.js";
import { TimedEvent } from "../backend/TimedEvent.js"
import { FaceProcessor } from "../frontend/classes/FaceProcessor.js";


export const defaultSettings ={
   shortcutsEnabled: false,
   audio: true,
   mic: true,
   video: true,
   recording: true,
   debug: false,
} 

const AppContext = createContext();

const AppProvider = (props) => {
   const sessionTimer = new TimedEvent("MainSession");
	const socket = useSocket(CMDS.NAMESPACES.CHAT);
   const [session, setSession] = useState({
      localVideo: useRef(),
      remoteVideo: useRef(),
      canvas: useRef(),
   });
	const [faceProcessor, setFaceProcessor] = useState();
   const [settings, setSettings] = useState({...defaultSettings});
   const [user, setUser] = useState({ initialized: false });
   const [room, setRoom] = useState({});
   const [stage, setStage] = useState({});
   const [step, setStep] = useState({});

   useEffect(() => {
      if(!user) return;
      if(!user.initialized && !!user.name){
         console.log(`Sending user data update`, user)
         socket.emit(CMDS.SOCKET.JOIN_ROOM, user);
         user.initialized = true;
      }
      console.log("USER UPDATED ", JSON.stringify(user))
   }, [user])

   useEffect(() => {
      console.log("Initializing App context")
      socket.on(CMDS.SOCKET.CONNECT, () => {
         console.log(`CONNECTED TO THE SOCKET CONTEXT`);
      });

		socket.on(CMDS.SOCKET.USER_UPDATE, (data) => {
         setUser(prev => ({...prev, ...data}))
      });

      setFaceProcessor(new FaceProcessor());
   }, [])


   const sessionData = {
      settings,      setSettings,
      user,          setUser,
      room,          setRoom,
      session,       setSession,
      stage,         setStage,
      step,          setStep,
      faceProcessor,
      socket,
      sessionTimer
   }
   
   return <AppContext.Provider value={sessionData}>
      
      {props.children}
   </AppContext.Provider>;
}


export { useFaceProcessor } from './useFaceProcessor.js'
export { useShortcuts } from './useShortcuts.js'
export { useSettings } from './useSettings.js'
export { useRoom } from './useRoom.js'
export { useUser } from './useUser.js'
export { useStage } from './useStage.js'
export { useStep } from './useStep.js'
export { useSession } from './useSession.js'

export { AppContext, AppProvider }


