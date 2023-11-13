import React, { createContext, useReducer, useCallback, useContext, useState, useEffect, useRef } from "react";
import { TIMES, CMDS, STAGE, KEY_SHORTCUTS } from '../backend/Definitions.js';
import { TimedEvent } from "../backend/TimedEvent.js"
import { useSocket } from "./SocketContext.js";
import { TOASTS } from "../frontend/components/ToastCommunications.js";
import { FaceProcessor } from "../frontend/classes/FaceProcessor.js";
import { useFaceProcessor } from "./useFaceProcessor.js";


export const defaultSettings ={
   shortcutsEnabled: false,
   audio: true,
   mic: true,
   video: true,
   recording: true,
   debug: false,
} 

const AppContext = createContext();

const SessionProvider = (props) => {
   const sessionTimer = new TimedEvent("MainSession");
	const socket = useSocket(CMDS.NAMESPACES.CHAT);
   const [session, setSession] = useState({
      localVideo: useRef(),
      remoteVideo: useRef(),
      canvas: useRef(),
   });
	const [faceProcessor, setFaceProcessor] = useState();
   const [settings, setSettings] = useState({...defaultSettings});
   const [user, setUser] = useState({});
   const [room, setRoom] = useState({});
   const [stage, setStage] = useState({});
   const [step, setStep] = useState({});

   useEffect(() => {
      if(!user || Object.keys(user).length <= 0) return;
      console.log(`Sending user data update`, user)
      socket.emit(CMDS.SOCKET.JOIN_ROOM, user);
   }, [user])

   useEffect(() => {

      socket.on(CMDS.SOCKET.CONNECT, () => {
         console.log(`CONNECTED TO THE SOCKET CONTEXT`);
      });

      setFaceProcessor(new FaceProcessor());
   }, [])


   const sessionData = {
      settings,   setSettings,
      user,       setUser,
      room,       setRoom,
      session,    setSession,
      stage,      setStage,
      step,       setStep,
      faceProcessor,
      socket,
      sessionTimer
   }
   
   return <AppContext.Provider value={sessionData}>{props.children}</AppContext.Provider>;
}
export { useFaceProcessor } from './useFaceProcessor.js'
export { useShortcuts } from './useShortcuts.js'
export { useSettings } from './useSettings.js'
export { useRoom } from './useRoom.js'
export { useUser } from './useUser.js'
export { useStage } from './useStage.js'
export { useStep } from './useStep.js'
export { useSession } from './useSession.js'

export { AppContext, SessionProvider }


