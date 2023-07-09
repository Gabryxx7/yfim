import React from 'react';
import { useState, useEffect } from 'react';
import Timer from "../containers/Timer";

export default function SideBar(props) {
  const [timeElapsed, setTimeElapsed] = useState(0)
  const [duration, setDuration] = useState(0)
  const [stageInfo, setStageInfo] = useState({
    sidePrompt: props.state?.side_prompt,
    user: props.state?.user_role,
    currentStageIdx: props.state?.session?.data?.stage?.currentIdx,
    currentStageName: props.state?.session?.data?.stage?.name,
    totalStages: props.state?.session?.data?.stage?.totalStages,
  })

  props.state?.session?.addOnUpdate((session) => {
    setTimeElapsed(session.timeElapsed)
  });
  var sidePadding = "11rem";
  var remoteVideoSide = "right";
  const barPadding = `1rem ${remoteVideoSide == 'right' ? sidePadding : '0.5rem'} 0.5rem ${remoteVideoSide != "right" ? sidePadding : '0.5rem'}`
  
  useEffect(() => {
    // console.log("Sidebar STATE update!");
    setTimeElapsed(props.state?.session?.timeElapsed);
    setDuration(props.state?.session?.data?.stage?.duration);
    setStageInfo({
      sidePrompt: props.state?.side_prompt,
      user: props.state?.user_role,
      currentStageIdx: props.state?.session?.data?.currentStage,
      currentStageName: props.state?.session?.data?.stage?.name,
      totalStages: props.state?.session?.data?.totalStages,
    })
    // console.log(props.state.session)
  }, [props.state]);



  return (
    <div className="sidebar_container"
      style={(() => {
        const padding = props.state?.session?.running ? ''+barPadding : '1rem';
        const maxHeight = props.state?.session?.running ? '20vh' : '0vh';
        return {padding,maxHeight}
      })()}>
      <div className="info">
            {props.state?.session?.running && <Timer
                timeRef={timeElapsed}
                countdown={true}
                duration={duration}
                coloring={true}>
             </Timer>}
          <div className="sidebar_foot">
            <span>{stageInfo.currentStageName}</span>
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
                  width: `${(stageInfo.currentStageIdx+1)/stageInfo.totalStages*100}%`
                }}/>
                </div>
            <span class="progress-text">{stageInfo.currentStageIdx+1}/{stageInfo.totalStages}</span>
            </div>
          </div>
       <span className="sidebar_user_role">{stageInfo.user}</span>
      </div>
      <div className="sidebar_prompt">{stageInfo.sidePrompt}</div>
    </div>
  );
}
