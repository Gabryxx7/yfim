import React, { useEffect, useState, useRef, useContext } from "react";
import { CMDS } from '../../backend/Definitions.js'
import Clock from "../components/Controls/Clock.js";
import { AppContext } from '../../context/AppContext.js';
import ProgressBar from '../components/Controls/Progressbar.js';
import ToolbarDebug from '../components/ToolbarDebug.js';
import { TimedEvent } from "../../backend/TimedEvent.js"
import { useSocket } from "../../context/SocketContext.js";
// import console from "../../utils/customLogger.js";


export default function Toolbar(props) {
	const sessionMap = useContext(AppContext);
  const socket = useSocket(CMDS.NAMESPACES.CHAT);
  const [sessionState, setSessionState] = useState(TimedEvent.STATUS.NONE);
  const [timeElapsed, setTimeElapsed] = useState(0)
  const [duration, setDuration] = useState(0)
  const [paused, setPaused] = useState(false)
  const prompt = props.prompt ?? "PROMPT";
  const onTimerEnd = props.onTimerEnd ?? (() => {});
  const stageData = props.stageData;
  const userData = props.userData ?? {};
  const roomData = props.roomData ?? {};
  const showDebug = props.showDebug ?? false;
  const [sessionData, setSessionData] = useState({});
  const onSkipClicked = props.onSkipClicked ?? (() => {});

  // var sidePadding = "11rem";
  // var remoteVideoSide = "right";
  // let barPadding = `1rem ${remoteVideoSide == 'right' ? sidePadding : '0.5rem'} 0.5rem ${remoteVideoSide != "right" ? sidePadding : '0.5rem'}`
  let barPadding = "0.5rem 1rem";
  useEffect(() => {
    sessionMap.session.addOnStart((session) => {
      setSessionState(TimedEvent.STATUS.RUNNING);
      setSessionData({...sessionData,
        ...session?.data,
        sessionId: session.data?.sessionId,
        totalStages: session.data?.stages
      });
    });
    sessionMap.session.addOnTick((session) => {
      setTimeElapsed(session.elapsed);
    });

    sessionMap.session.addOnPause((session) => {
      setPaused(true)
    });
    sessionMap.session.addOnResume((session) => {
      setPaused(false)
    });
  }, [])

  useEffect(() => {
    console.log("Toolbar session updated! ", sessionData)
  }, [sessionData])

  // useEffect(() => {
  //   setSessionData({...sessionData, ...roomData.session})
  //   console.log("Toolbar Room updated! ", roomData)
  // }, [roomData])

  useEffect(() => {
		console.log("Toolbar stage updated", stageData);
    setSessionData({...sessionData,
      index: stageData?.index,
      name: stageData?.step?.name,
      stageType: stageData?.step?.type,
      topic: stageData?.topic
    });
    const newDuration = stageData?.step?.duration;
    setDuration(newDuration);
  }, [stageData])



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
            paused={paused}
            active={sessionState}
            stageData={stageData}
            onTimerEnd={onTimerEnd}
            elapsed={timeElapsed}
            countdown={true}
            duration={duration}
            coloring={true}>
        </Clock>
        <div
      // className={`toolbar-prompt ${sessionState ? '' : 'hidden'}`}
        className={`toolbar-prompt`}>
        {prompt}</div>
        <div className="toolbar-block">
          <div>{sessionData.name} ({stageData?.state})</div>
          {sessionState != TimedEvent.STATUS.NONE && <ProgressBar
            max={sessionData.totalStages} 
            progress={sessionData.index+1}/> }
        </div>
      </div>
          <ToolbarDebug
            style={showDebug ? {} : {display: 'none'}}
            onSkipClicked={onSkipClicked}
            sessionData={sessionData}
            stageData={stageData}
            userData={userData}
            roomData={roomData}
          />
    </div>
  );
}
