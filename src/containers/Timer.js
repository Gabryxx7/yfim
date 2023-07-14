import React from 'react';
import { useState, useEffect } from 'react';
import { timeColorMapDefault, getTimerColor } from "../classes/TimedEvent"
import { STAGE_STATUS } from "../classes/Session"

const TIMER_STATE = {
  NONE: 0,
  RUNNING: 1,
  STOPPED: 2,
};

export default function Timer(props){
  const elapsed = props.elapsed ?? null;
  const timeLimit = props.duration ?? null;
  const countdown = props.countdown ?? false;
  const timeColorMap = props.timeColorMap ?? timeColorMapDefault;
  const [textColor, setTextColor]  = useState(timeColorMap[timeColorMap.length-1].color);
  const [timeString, setTimeString] = useState("00:00")
  const onTimerEnd = props.onTimerEnd ?? (() => {});
  const stageState = props.stageState ?? null; // Used to set the timer's state externally
  const [timerState, setTimerState] = useState(TIMER_STATE.NONE)

  const formatTime = (time) => {
    if(time >= 0){
      const mins = `${Math.floor((time / 60) % 60)}`.padStart(2, "0");
      const secs = `${Math.floor((time) % 60)}`.padStart(2, "0");
      return `${mins}:${secs}`;
    }
  }

  useEffect(() => {
    if(stageState == STAGE_STATUS.COMPLETED){
      setTimerState(TIMER_STATE.STOPPED);
    }
    if(stageState == STAGE_STATUS.IN_PROGRESS){
      setTimerState(TIMER_STATE.RUNNING);
    }
  }, [stageState])

  useEffect(() => {
    if(timerState != TIMER_STATE.RUNNING) return;
    var time = elapsed;
    if(timeLimit > 0){
      var remaining = timeLimit - elapsed
      if(countdown){
        time = remaining;
      }
      setTextColor(getTimerColor(time, timeColorMap))
      if(remaining <= 0){
        onTimerEnd();
        setTimerState(TIMER_STATE.STOPPED);
      }
    }
    setTimeString(formatTime(time))
  }, [elapsed]);

  return (
    <div className="timer" style={{color: `${textColor}`}}>
      {timeString}
    </div>
  );
}
