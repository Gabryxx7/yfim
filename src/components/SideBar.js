import React, { useState, useEffect } from "react";
import Clock from "../containers/Clock";
const stage_name = {
  0: "WAITING",
  1: "ICE BREAKER",
  2: "WOULD YOU RATHER",
  3: "DEBATE",
};
const percentage = {
  1: "26%",
  2: "52%",
  3: "78%",
};
export default function SideBar(props) {
  const { stagesData, side_prompt, user_role, time_diff, end, state_process } = props;
  const currentStageIdx = stagesData != null ? stagesData.currentIdx : 0;
  const totalStages = stagesData != null ? stagesData.total : 0;
  const currentStageName = stagesData != null ? stagesData.name : 0;
  return (
    <div className="sidebar_container">
      <div className="info">
            {state_process && (
              <Clock
                time_diff={time_diff}
                end={end}
              ></Clock>
          )}
          <div className="sidebar_foot">
            <span>{currentStageName}</span>
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
                  width: `${(currentStageIdx+1)/totalStages*100}%`
                }}/>
                </div>
            <span class="progress-text">{currentStageIdx+1}/{totalStages}</span>
            </div>
          </div>
       <span className="sidebar_user_role">{user_role}</span>
      </div>
      <div className="sidebar_prompt">{side_prompt}</div>
    </div>
  );
}
