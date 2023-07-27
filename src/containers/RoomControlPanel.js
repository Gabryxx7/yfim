import React, { useEffect, useState, useRef, useContext, useReducer, useCallback } from "react";
import "survey-react/survey.css";
import 'react-toastify/dist/ReactToastify.css';
import "survey-core/defaultV2.min.css";
import {RoomUsersList, RoomUser} from "../components/RoomUser.js"

export default function RoomControlPanel(props) {
   const room = props.room ?? {};

   return(
      <div className="room-control-panel">
         <div className="session-info">
            <div className="session">
               <div>Session: {room.session?.sessionId}</div>
               <div>Stages: {room.session?.stages}</div>
            </div>
            <div className="stage">
               <div>Stage: {room.session?.stage?.name}</div>
               <div>Steps: {room.session?.stage?.steps?.length}</div>
               <div className="step">
                  {room.session?.stage?.step?.name} ({room.session?.stage?.step?.type})
               </div>
            </div>
         </div>
         <div className="room-info">
            <div className="room-name">{room?.id}</div>
            <RoomUsersList users={room?.users} />
         </div>
      </div>
   )
}