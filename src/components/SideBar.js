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
       <p className="sidebar_user_role">{user_role}</p>
            {state_process && (
              <Clock
                time_diff={time_diff}
                end={end}
              ></Clock>
          )}
      </div>
      <p className="sidebar_prompt">{side_prompt}</p>
      <div className="sidebar_foot">
        <p>PART {currentStageIdx+1} OF {totalStages} <br /> {currentStageName} </p>
        <hr
          style={{
            position: "absolute",
            bottom: "5%",
            color: "white",
            background: "white",
            height: "4px",
            width: `${(currentStageIdx+1)/totalStages*100}%`,
            zIndex: 20,
            left: "11%",
          }}
        />
        <hr
          style={{
            position: "absolute",
            bottom: "5%",
            color: "grey",
            background: "grey",
            height: "4px",
            width: "78%",
            left: "11%",
          }}
        />
      </div>
    </div>
  );
}
