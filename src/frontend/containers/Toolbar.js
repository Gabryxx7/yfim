import React, { useEffect, useState, useRef, useContext } from "react";
import { STAGE, USER } from '../../backend/Definitions.js'
import Clock from "../components/Controls/Clock.js";
import { SessionContext } from "../classes/ClientSession.js";
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

const ToolbarTesting = (props) => {
  const stageData = props.stageData ?? {};
  const stageState = props.stageState ?? {};
  const userData = props.userData ?? {};
  const roomData = props.roomData ?? {};
  const onSkipClicked = props.onSkipClicked ?? (() => {});
  return(
    <div className="meta-info">
      <RoomInfo room={roomData} />
      <div className="user-info">
        <div>{userData.name} ({userData.role})</div>
        <div>{stageData.stageType} - {stageData.topic}</div>
        <div>{stageData.sessionId}</div>
      </div>
      <SkipStage onClick={onSkipClicked} stageState={stageState} />
      {/* <div className="room-info">
        <div>Waiting for your partner...</div>
      </div> */}
    </div>
  )
}

export default function Toolbar(props) {
	const sessionMap = useContext(SessionContext);
  const socket = props.socket;
  const [sessionState, setSessionState] = useState(TimedEvent.STATUS.NONE);
  const [timeElapsed, setTimeElapsed] = useState(0)
  const [duration, setDuration] = useState(0)
  const prompt = props.prompt ?? "PROMPT";
  const onTimerEnd = props.onTimerEnd ?? (() => {});
  const stageState = props.stageState;
  const userData = props.userData ?? {};
  const roomData = props.roomData ?? {};
  const [stageData, setStageData] = useState({});
  const onSkipClicked = props.onSkipClicked ?? (() => {});

  // var sidePadding = "11rem";
  // var remoteVideoSide = "right";
  // let barPadding = `1rem ${remoteVideoSide == 'right' ? sidePadding : '0.5rem'} 0.5rem ${remoteVideoSide != "right" ? sidePadding : '0.5rem'}`
  let barPadding = "0.5rem 1rem";
  useEffect(() => {
		console.log("Toolbar re-render");
    sessionMap.session.addOnStart((session) => {
      setSessionState(TimedEvent.STATUS.RUNNING);
      console.log("Session started toolbar: ", session.data)
      const stageType = session.data?.stage?.step?.type;
      setStageData({...stageData,
        sessionId: session.data?.sessionId,
        index: session.data?.stage?.index,
        name: session.data?.stage?.step?.name,
        totalStages: session.data?.stages,
        stageType: stageType,
        topic: session.data?.stage?.topic
      });
      const newDuration = session.data?.stage?.step?.duration;
      console.log("duration ", newDuration);
      setDuration(newDuration);
    });
    sessionMap.session.addOnTick((session) => {
      setTimeElapsed(session.elapsed);
    });
  }, [])

  useEffect(() => {
		console.log("Toolbar stage update" ), stageState;
  }, [stageState])
  // useEffect(() => {
  //   // console.log("Toolbar STATE update!");
  //   // setStageData({
  //   //   prompt: props.state?.side_prompt,
  //   //   user: props.state?.user_role,
  //   //   index: props.state?.session?.data?.currentStage,
  //   //   name: props.state?.session?.data?.stage?.name,
  //   //   totalStages: props.state?.session?.data?.totalStages,
  //   // })
  //   // console.log(props.state.session)
  // }, [props.state]);



  return (
    <div className="toolbar-container"
      // style={(() => {
      //   const padding = sessionState ? ''+barPadding : '1rem';
      //   // const maxHeight = sessionState ? '20vh' : '0vh';
      //   const maxHeight = '20vh';
      //   return {padding,maxHeight}
      // })()}
      >
      <div className="info">
          <Clock
            active={sessionState}
            stageState={stageState}
            onTimerEnd={onTimerEnd}
            elapsed={timeElapsed}
            countdown={true}
            duration={duration}
            coloring={true}>
        </Clock>
        <div className="toolbar-block">
          <div>{stageData.name} ({stageState.state})</div>
          {sessionState != TimedEvent.STATUS.NONE && <ProgressBar
            max={stageData.totalStages} 
            progress={stageData.index+1}/> }
        </div>
          <ToolbarTesting
            onSkipClicked={onSkipClicked}
            stageData={stageData}
            stageState={stageState}
            userData={userData}
            roomData={roomData}
          />
      </div>
      <div
      // className={`toolbar-prompt ${sessionState ? '' : 'hidden'}`}
        className={`toolbar-prompt`}>
        {prompt}</div>
    </div>
  );
}
