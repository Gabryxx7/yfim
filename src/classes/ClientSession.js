import React, { createContext, useReducer, useCallback } from "react";
import {TimedEvent} from "./TimedEvent.js";


class ClientSession extends TimedEvent{
   static Actions = {
      INCREMENT_COUNTER: "INCREMENT_COUNTER",
      UPDATE_USER: "UPDATE_USER",
      UPDATE_SESSION: "UPDATE_SESSION"
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
         session.user = action.data.user;
      }
      return session;
    }
   constructor(name="TimedEventID", updateInterval=1000) {
      super(name, updateInterval)
      this.user = {};
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
      updateSession: (data) => sessionDispatch({type: ClientSession.Actions.UPDATE_SESSION, data: data}),
   };
   return <SessionContext.Provider value={value}>{props.children}</SessionContext.Provider>;
}


export { SessionContext, SessionProvider, ClientSession }