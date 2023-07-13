import React, { createContext, useReducer, useCallback } from "react";
import {TimedEvent} from "../classes/TimedEvent";


class Session extends TimedEvent{
   static Actions = {
      INCREMENT_COUNTER: "INCREMENT_COUNTER",
      UPDATE_SESSION_NAME: "UPDATE_SESSION_NAME",
      UPDATE_USER: "UPDATE_USER"
   }
   static reducer = (session, action) => {
      console.log("Reducer " + action.type)
      if (action.type === Session.Actions.INCREMENT_COUNTER) {
         session.testCount += 1;
      }
      if (action.type === Session.Actions.UPDATE_SESSION_NAME) {
         session.name = action.data.name;
      }
      if (action.type === Session.Actions.UPDATE_USER) {
         session.user = action.data.user;
      }
      return session;
    }
   constructor(name="TimedEventID", updateInterval=1000) {
      super(name, updateInterval)
      this.user = {};
   }
}


const SessionContext = createContext();

const SessionProvider = (props) => {
   const [sessionState, sessionDispatch] = useReducer(Session.reducer, new Session("MainSession"));
 
   const value = {
      session: sessionState,
      incrementCounter: (data) => sessionDispatch({type: Session.Actions.INCREMENT_COUNTER, data: data}),
      updateUser: (data) => sessionDispatch({type: Session.Actions.UPDATE_USER, data: data}),
   };
   return <SessionContext.Provider value={value}>{props.children}</SessionContext.Provider>;
}


export { SessionContext, SessionProvider, Session }