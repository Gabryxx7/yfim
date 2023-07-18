import React from 'react';
import { useState, useEffect, useRef, useContext } from 'react';
import Timer from "../containers/Timer";
import { SessionContext } from "../classes/Session";


export default function SideBar(props) {
	const sessionMap = useContext(SessionContext);
  const [sessionRunning, setSessionRunning] = useState(false);
  const [timeElapsed, setTimeElapsed] = useState(0)
  const [duration, setDuration] = useState(0)
  const onTimerEnd = props.onTimerEnd ?? (() => {});
  const stageState = props.stageState;
  const [stageData, setStageData] = useState({
    prompt: "Prompt",
    user: "No user",
    index: -1,
    name: "No stage",
    totalStages: 10,
    stageType: "none"
  })

  var sidePadding = "11rem";
  var remoteVideoSide = "right";
  const barPadding = `1rem ${remoteVideoSide == 'right' ? sidePadding : '0.5rem'} 0.5rem ${remoteVideoSide != "right" ? sidePadding : '0.5rem'}`
  
  useEffect(() => {
		console.log("Sidebar re-render");
    sessionMap.session.addOnStart((session) => {
      setSessionRunning(true);
      console.log("Session started sidebar: ", session.data)
      setStageData({...stageData,
        user: session.data?.user?.role,
        index: session.data?.currentStage,
        name: session.data?.stage?.name,
        prompt: session.data?.stage?.topic,
        totalStages: session.data?.totalStages,
        stageType: session.data?.stage?.stepData?.type
      });
      const newDuration = session.data?.stage?.duration;
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
    <div className="sidebar_container"
      style={(() => {
        const padding = sessionRunning ? ''+barPadding : '1rem';
        const maxHeight = sessionRunning ? '20vh' : '0vh';
        return {padding,maxHeight}
      })()}>
      <div className="info">
            {sessionRunning && duration > 0 &&
               <Timer
                stageState={stageState}
                onTimerEnd={onTimerEnd}
                elapsed={timeElapsed}
                countdown={true}
                duration={duration}
                coloring={true}>
             </Timer>}
          <div className="sidebar_foot">
            <span>{stageData.name} ({stageState})</span>
            <div class="progress-container">
              <div class="progress-bar"
                style={{
                  background: '#d4eeff',
                  transition: "all 0.5s",
                  height: "0.5rem",
                  width: "100%",
                  borderRadius: "50px",
                }}>
              <div class="progress-bar-completed"
                style={{
                  background: "#1da1f2",
                  height: "100%",
                  borderRadius: "inherit",
                  width: `${(stageData.index+1)/stageData.totalStages*100}%`
                }}/>
                </div>
            <span class="progress-text">{stageData.index+1}/{stageData.totalStages}</span>
            </div>
          </div>
       <span className="sidebar_user_role">{stageData.user}</span>
       <span className="sidebar_user_role">{stageData.stageType}</span>
      </div>
      <div className="sidebar_prompt">{stageData.prompt}</div>
    </div>
  );
}
