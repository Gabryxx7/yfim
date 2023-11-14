import React, { useEffect, useState, useRef, useContext } from "react";
import { CMDS } from '../../backend/Definitions.js'
import Clock from "../components/Controls/Clock.js";
import ProgressBar from '../components/Controls/Progressbar.js';
import ToolbarDebug from '../components/ToolbarDebug.js';
import { TimedEvent } from "../../backend/TimedEvent.js"
import { useUser, useRoom, useSession, useStage, useStep, useSettings, useShortcuts, useFaceProcessor, useSocket, useWebRTC} from '../../context';
// import console from "../../utils/customLogger.js";


export default function Toolbar(props) {
	const socket = useSocket(CMDS.NAMESPACES.CHAT);
  const { shortcutsHandler } = useShortcuts();
  const { settings, updateSettings } = useSettings();
  const { faceProcessor, fps } = useFaceProcessor();
  const { session, updateSession } = useSession();
  const { user,  updateUser } = useUser();
  const { room,  updateRoom } = useRoom();
  const { stage, updateStage } = useStage();
  const { step,  updateStep } = useStep();
  const [timeElapsed, setTimeElapsed] = useState(0)
  const [duration, setDuration] = useState(0)
  const [paused, setPaused] = useState(false)
  const prompt = props.prompt ?? "PROMPT";
  const onTimerEnd = props.onTimerEnd ?? (() => {});
  const showDebug = props.showDebug ?? false;

  // var sidePadding = "11rem";
  // var remoteVideoSide = "right";
  // let barPadding = `1rem ${remoteVideoSide == 'right' ? sidePadding : '0.5rem'} 0.5rem ${remoteVideoSide != "right" ? sidePadding : '0.5rem'}`
  let barPadding = "0.5rem 1rem";
  useEffect(() => {
    // sessionMap.session.addOnStart((session) => {
    //   setsession.state(TimedEvent.STATUS.RUNNING);
    //   setSessionData({...sessionData,
    //     ...session?.data,
    //     sessionId: session.data?.sessionId,
    //     totalStages: session.data?.stages
    //   });
    // });
    // sessionMap.session.addOnTick((session) => {
    //   setTimeElapsed(session.elapsed);
    // });

    // sessionMap.session.addOnPause((session) => {
    //   setPaused(true)
    // });
    // sessionMap.session.addOnResume((session) => {
    //   setPaused(false)
    // });
  }, [])

  useEffect(() => {
    console.log("Toolbar session updated! ", session)
  }, [session])

  // useEffect(() => {
  //   setSessionData({...sessionData, ...roomData.session})
  //   console.log("Toolbar Room updated! ", roomData)
  // }, [roomData])

  useEffect(() => {
		console.log("Toolbar stage updated", stage);
    // setSessionData({...sessionData,
    //   index: stageData?.index,
    //   name: stageData?.step?.name,
    //   stageType: stageData?.step?.type,
    //   topic: stageData?.topic
    // });
    // const newDuration = stageData?.step?.duration;
    // setDuration(newDuration);
  }, [stage])



  return (
    <div className="toolbar-container"
      // style={(() => {
      //   const padding = session.state ? ''+barPadding : '1rem';
      //   // const maxHeight = session.state ? '20vh' : '0vh';
      //   const maxHeight = '20vh';
      //   return {padding,maxHeight}
      // })()}
      >
      <div className="info">
          {/* <Clock
            paused={paused}
            active={session.state}
            stageData={stageData}
            onTimerEnd={onTimerEnd}
            elapsed={timeElapsed}
            countdown={true}
            duration={duration}
            coloring={true} /> */}
        <div
      // className={`toolbar-prompt ${session.state ? '' : 'hidden'}`}
        className={`toolbar-prompt`}>
        {prompt}</div>
        <div className="toolbar-block">
          <div>{session.name} ({stage?.state})</div>
          {session.state != TimedEvent.STATUS.NONE && <ProgressBar
            max={session.totalStages} 
            progress={session.index+1}/> }
        </div>
      </div>
          {/* <ToolbarDebug
            style={showDebug ? {} : {display: 'none'}}
            onSkipClicked={onSkipClicked}
            sessionData={sessionData}
            stageData={stageData}
            userData={userData}
            roomData={roomData} 
          />*/}
    </div>
  );
}
