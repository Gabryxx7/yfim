import React, { createContext, useReducer, useCallback } from "react";
import { TIMES } from '../../backend/Definitions.js';
import { TimedEvent } from "../../backend/TimedEvent.js"


class ClientSession extends TimedEvent{
   static Actions = {
      INCREMENT_COUNTER: "INCREMENT_COUNTER",
      UPDATE_USER: "UPDATE_USER",
      UPDATE_SESSION: "UPDATE_SESSION",
      UPDATE_ROOM: "UPDATE_ROOM"
   }
   static reducer = (session, action) => {
      console.log("Reducer " + action.type)
      if (action.type === ClientSession.Actions.INCREMENT_COUNTER) {
         session.testCount += 1;
      }
      if (action.type === ClientSession.Actions.UPDATE_SESSION) {
         session.data = action.data;
         session.id = action.data?.sessionId;
      }
      if (action.type === ClientSession.Actions.UPDATE_USER) {
         session.user = action.data;
      }
      if (action.type === ClientSession.Actions.UPDATE_ROOM) {
         session.room = action.data;
      }
      return session;
    }
   constructor() {
      super(TIMES.SESSION_UPDATE_INTERVAL)
      this.user = {};
      this.room = {};
   }

   getSessionData(){
      const data = {
         user: this.user?.name,
         date: new Date().toISOString().split(".")[0],
         sessionId: this.data?.sessionId,
         stage: this.data?.stage?.name,
         stageIndex: this.data?.stage?.index,
         topic: this.data?.stage?.topic,
         prompt: this.data?.stage?.prompt,
         room: this.room,
         stage_mask: this.data?.stage?.mask,
         step_mask: this.data?.stage?.step?.mask
      }
      return data;
   }
}


const SessionContext = createContext();

const SessionProvider = (props) => {
   const [sessionState, sessionDispatch] = useReducer(ClientSession.reducer, new ClientSession("MainSession"));
 
   const value = {
      session: sessionState,
      incrementCounter: (data) => sessionDispatch({type: ClientSession.Actions.INCREMENT_COUNTER, data: data}),
      updateUser: (data) => sessionDispatch({type: ClientSession.Actions.UPDATE_USER, data: data}),
      updateRoom: (data) => sessionDispatch({type: ClientSession.Actions.UPDATE_ROOM, data: data}),
      updateSession: (data) => sessionDispatch({type: ClientSession.Actions.UPDATE_SESSION, data: data}),
   };
   return <SessionContext.Provider value={value}>{props.children}</SessionContext.Provider>;
}


export { SessionContext, SessionProvider, ClientSession }