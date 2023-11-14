import React, { createContext, useReducer, useCallback, useContext, useState, useEffect, useRef, forwardRef } from "react";
import { TIMES, CMDS, STAGE, KEY_SHORTCUTS } from '../backend/Definitions.js';
import { TOASTS } from "../frontend/components/ToastCommunications.js";
import { useSocket } from "./useSocket.js";
import { TimedEvent } from "../backend/TimedEvent.js"
import { FaceProcessor } from "../frontend/classes/FaceProcessor.js";


export const defaultSettings ={
   shortcutsEnabled: false,
   audio: false,
   mic: false,
   video: {
      enabled: true,
      width: { min: 1280, ideal: 1280 },
      height: { min: 720, ideal: 720 },
      frameRate: 30,
      // resizeMode: 'crop-and-scale',
      colorTemperature: 7000.0,
   },
   recording: false,
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
   const faceProcessorRef = useRef();
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
      if(!room) return;
      console.log("ROOM UPDATED ", JSON.stringify(room))
   }, [room])

   useEffect(() => {
      socket.on(CMDS.SOCKET.CONNECT, () => {
         console.log(`Socket connected`);
      });

		socket.on(CMDS.SOCKET.USER_UPDATE, (data) => {
         setUser(prev => ({...prev, ...data}))
      });

		socket.on(CMDS.SOCKET.ROOM_UPDATE, (data) => {
         setRoom(prev => ({...prev, ...data}))
      });

      faceProcessorRef.current = new FaceProcessor();
      setFaceProcessor(faceProcessorRef.current);
   }, [])


   const sessionData = {
      settings,      setSettings,
      user,          setUser,
      room,          setRoom,
      session,       setSession,
      stage,         setStage,
      step,          setStep,
      faceProcessorRef,
      socket,
      sessionTimer
   }
   
   return <AppContext.Provider value={sessionData}>
      
      {props.children}
   </AppContext.Provider>;
}

export { AppContext, AppProvider }


