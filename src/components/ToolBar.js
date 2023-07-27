import React from 'react';
import { useState, useEffect, useRef, useContext } from 'react';
import Clock from "../containers/Clock.js";
import { SessionContext } from "../classes/ClientSession.js";
import { STAGE, USER } from '../managers/Definitions.js'
import ProgressBar from './Progressbar.js';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import '@fortawesome/fontawesome-free'
import {library} from '@fortawesome/fontawesome-svg-core'
import {far} from '@fortawesome/free-regular-svg-icons'
import {fas} from '@fortawesome/free-solid-svg-icons'
import {fab} from '@fortawesome/free-brands-svg-icons'
library.add(far,fas,fab);

const StatusIconMap = (status) => {
  const style = 'fa';
  let faIcon = {};
  let compStyle = {};
  switch(status){
    case USER.STATUS.NONE:{
      faIcon = [style, 'x'];
      compStyle= {color: 'red'};
      break;
    }
    case USER.STATUS.IN_SESSION:{
      faIcon = [style, 'clock'];
      compStyle= {color: 'white'};
      break;
    }
    case USER.STATUS.READY:{
      faIcon = [style, 'check'];
      compStyle= {color: 'green'};
      break;
    }
  }
  return <FontAwesomeIcon style={{...compStyle}} icon={faIcon} />
}

const RoomUser = (props) => {
  return(
    <div className="room-user">
      <div className="status"> {StatusIconMap(props.user?.status)}</div>
      <div className="name">{props.user?.name}</div>
    </div>
  )
}

const RoomInfo = (props) => {
  return(
    <div className="room-info">
      <div className="room-name">{props.room?.id}</div>
      <div className="users-list">
        {props.room?.users?.map((user) => <RoomUser key={USER.id} user={user}/>)}
      </div>
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
        <div
          className={`primary-button ${stageState.state == STAGE.STATUS.COMPLETED ? 'disabled': ''}`}
          style={{
            padding: '0.5rem 0rem'
          }}
          onClick={onSkipClicked}>Skip</div>
      {/* <div className="room-info">
        <div>Waiting for your partner...</div>
      </div> */}
    </div>
  )
}

export default function Toolbar(props) {
	const sessionMap = useContext(SessionContext);
  const socket = props.socket;
  const [sessionRunning, setSessionRunning] = useState(false);
  const [timeElapsed, setTimeElapsed] = useState(0)
  const [duration, setDuration] = useState(0)
  const prompt = props.prompt ?? "PROMPT";
  const onTimerEnd = props.onTimerEnd ?? (() => {});
  const onSkipClicked = props.onSkipClicked ?? (() => {});
  const stageState = props.stageState;
  const userData = props.userData ?? {};
  const roomData = props.roomData ?? {};
  const [stageData, setStageData] = useState({});

  // var sidePadding = "11rem";
  // var remoteVideoSide = "right";
  // let barPadding = `1rem ${remoteVideoSide == 'right' ? sidePadding : '0.5rem'} 0.5rem ${remoteVideoSide != "right" ? sidePadding : '0.5rem'}`
  let barPadding = "0.5rem 1rem";
  useEffect(() => {
		console.log("Toolbar re-render");
    sessionMap.session.addOnStart((session) => {
      setSessionRunning(true);
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
      //   const padding = sessionRunning ? ''+barPadding : '1rem';
      //   // const maxHeight = sessionRunning ? '20vh' : '0vh';
      //   const maxHeight = '20vh';
      //   return {padding,maxHeight}
      // })()}
      >
      <div className="info">
          <Clock
          active={sessionRunning}
          stageState={stageState}
          onTimerEnd={onTimerEnd}
          elapsed={timeElapsed}
          countdown={true}
          duration={duration}
          coloring={true}>
        </Clock>
        <div className="toolbar-block">
          <div>{stageData.name} ({stageState.state})</div>
          {sessionRunning && <ProgressBar
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
      // className={`toolbar-prompt ${sessionRunning ? '' : 'hidden'}`}
        className={`toolbar-prompt`}>
        {prompt}</div>
    </div>
  );
}
