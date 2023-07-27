import React from 'react';
import { useState, useEffect } from 'react';
import { timeColorMapDefault, getTimerColor } from "../managers/Timer.js"
import { STAGE } from "../managers/Definitions.js"

const CLOCK_STATE = {
  NONE: "none",
  RUNNING: "running",
  PAUSED: "paused",
  STOPPED: "stopped",
};

export default function Clock(props){
  const active = props.active ?? true;
  const elapsed = props.elapsed ?? null;
  const timeLimit = props.duration ?? null;
  const countdown = props.countdown ?? false;
  const timeColorMap = props.timeColorMap ?? timeColorMapDefault;
  const [textColor, setTextColor]  = useState(timeColorMap[timeColorMap.length-1].color);
  const [timeString, setTimeString] = useState("00:00")
  const onTimerEnd = props.onTimerEnd ?? (() => {});
  const stageState = props.stageState ?? null; // Used to set the timer's state externally
  const [timerState, setTimerState] = useState(CLOCK_STATE.NONE)

  const formatTime = (time) => {
    if(time >= 0){
      const mins = `${Math.floor((time / 60) % 60)}`.padStart(2, "0");
      const secs = `${Math.floor((time) % 60)}`.padStart(2, "0");
      return `${mins}:${secs}`;
    }
  }

  useEffect(() => {
    if(stageState.state == STAGE.STATUS.COMPLETED){
      setTimerState(CLOCK_STATE.STOPPED);
    }
    if(stageState.state == STAGE.STATUS.IN_PROGRESS){
      setTimeString("00:00")
      setTimerState(CLOCK_STATE.RUNNING);
    }
  }, [stageState])

  useEffect(() => {
    if(!active){
      setTimeString("Waiting...")
    }
    if(timerState != CLOCK_STATE.RUNNING) return;
    var time = elapsed;
    if(timeLimit > 0){
      var remaining = timeLimit - elapsed
      if(countdown){
        time = remaining;
      }
      setTextColor(getTimerColor(time, timeColorMap))
      if(remaining <= 0){
        onTimerEnd();
        setTimerState(CLOCK_STATE.STOPPED);
      }
    }
    setTimeString(formatTime(time))
  }, [elapsed]);

  return (
    <div className={`timer ${timerState}`} style={{color: `${textColor}`}}>
      {timeString}
    </div>
  );
}
