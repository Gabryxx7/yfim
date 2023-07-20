import React from 'react';
import { useState, useEffect, useRef, useContext } from 'react';
import Timer from "../containers/Timer";
import { SessionContext } from "../classes/Session";
import { STAGE } from '../managers/Definitions'
import ProgressBar from './Progressbar';

export default function SideBar(props) {
	const sessionMap = useContext(SessionContext);
  const [sessionRunning, setSessionRunning] = useState(false);
  const [timeElapsed, setTimeElapsed] = useState(0)
  const [duration, setDuration] = useState(0)
  const prompt = props.prompt ?? "PROMPT";
  const onTimerEnd = props.onTimerEnd ?? (() => {});
  const stageState = props.stageState;
  const [stageData, setStageData] = useState({
    user: "user",
    sessionId: "sid",
    userRole: "none",
    index: 0,
    name: "Session has not started yet...",
    totalStages: 0,
    stageType: "none"
  })

  // var sidePadding = "11rem";
  // var remoteVideoSide = "right";
  // let barPadding = `1rem ${remoteVideoSide == 'right' ? sidePadding : '0.5rem'} 0.5rem ${remoteVideoSide != "right" ? sidePadding : '0.5rem'}`
  let barPadding = "0.5rem 1rem";
  useEffect(() => {
		console.log("Sidebar re-render");
    sessionMap.session.addOnStart((session) => {
      setSessionRunning(true);
      console.log("Session started sidebar: ", session.data)
      const stageType = session.data?.stage?.step?.type;
      setStageData({...stageData,
        userRole: session.user?.role,
        user: session.user?.name,
        sessionId: session.data?.sessionId,
        index: session.data?.stage?.index,
        name: session.data?.stage?.name,
        totalStages: session.data?.stages,
        stageType: stageType
      });
      const newDuration = session.data?.stage?.step?.duration;
      console.log("duration ", newDuration);
      setDuration(newDuration);
    });
    sessionMap.session.addOnUpdate((session) => {
      setTimeElapsed(session.timeElapsed);
    });
  }, [])

  useEffect(() => {
		console.log("Sidebar stage update");
  }, [stageState])
  // useEffect(() => {
  //   // console.log("Sidebar STATE update!");
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
    <div className="sidebar-container"
      style={(() => {
        const padding = sessionRunning ? ''+barPadding : '1rem';
        // const maxHeight = sessionRunning ? '20vh' : '0vh';
        const maxHeight = '20vh';
        return {padding,maxHeight}
      })()}>
      <div className="info">
               <Timer
                active={sessionRunning}
                stageState={stageState}
                onTimerEnd={onTimerEnd}
                elapsed={timeElapsed}
                countdown={true}
                duration={duration}
                coloring={true}>
             </Timer>
          <div className="sidebar-block">
            <div>{stageData.name} ({stageState})</div>
            {sessionRunning && <ProgressBar
              max={stageData.totalStages} 
              progress={stageData.index+1}/> }
          </div>
      <div className="debug-info">
        <div className="user-info">
          <div>{stageData.user} ({stageData.userRole})</div>
          <div>{stageData.stageType}</div>
          <div>{stageData.sessionId}</div>
        </div>
        {/* <div className="room-info">
          <div>Waiting for your partner...</div>
        </div> */}
      </div>
      </div>
      <div
      // className={`sidebar-prompt ${sessionRunning ? '' : 'hidden'}`}
        className={`sidebar-prompt`}
      >
        {prompt}</div>
    </div>
  );
}
