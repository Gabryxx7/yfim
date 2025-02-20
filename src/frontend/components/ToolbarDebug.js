import React, { useEffect, useState, useRef, useContext } from "react";
import { STAGE, USER, KEY_SHORTCUTS } from '../../backend/Definitions.js'
import Clock from "../components/Controls/Clock.js";
import { AppContext } from '../../context/AppContext.js';
import ProgressBar from '../components/Controls/Progressbar.js';
import SkipStage from '../components/Controls/SkipStage.js';
import {RoomUsersList, RoomUser} from '../components/Controls/RoomUser.js'
import { TimedEvent } from "../../backend/TimedEvent.js"


const RoomInfo = (props) => {
   return(
     <div className="room-info">
       <div className="room-name">{props.room?.id}</div>
       <RoomUsersList users={props.room?.users} />
     </div>)
 }
 
 
 const FeaturesList = (props) => {
   return(<div className={(props.className ?? '')+" features"}>
         {props.features && props.features.length > 0 && 
         <div className="features-list">
            {props.features?.map((feature, i) => <div key={`feature-${i}`} className="feature">{feature}{i < props.features?.length-1 && ', '}</div>)}
         </div>}
      </div>
     )
 }
 
 
 const ConditionsList = (props) => {
   return(
       <div className={(props.className ?? '')+' conditions-list'}>
         <span>{props.title}:</span>
         {props.conditions?.map((conditionFeaturesList, i) => <FeaturesList key={`Condition-${i}`} className='condition' features={conditionFeaturesList} />)}
       </div>
     )
 }
 
export default function ToolbarDebug(props){
   const sessionData = props.sessionData ?? {};
   const stageData = props.stageData ?? {};
   const userData = props.userData ?? {};
   const roomData = props.roomData ?? {};
   const onSkipClicked = props.onSkipClicked ?? (() => {});
   return(
     <div className="meta-info" style={{...props.style}}>
       <RoomInfo room={roomData} />
       <div className="user-info">
         <div> {userData.order} - {userData.name} ({userData.role})</div>
         <div>{sessionData.stageType} - {sessionData.topic}</div>
         <div>{sessionData.sessionId}</div>
       </div>
       <SkipStage onClick={onSkipClicked} stageData={stageData} />
       <div className="conditions-dbg">
         <ConditionsList title="Current" conditions={[sessionData?.conditions?.current]}/>
         <ConditionsList title="Remaining" conditions={sessionData?.conditions?.remaining}/>
         <ConditionsList title="Completed" conditions={sessionData?.conditions?.completed}/>
       </div>
     </div>
   )
 }
 