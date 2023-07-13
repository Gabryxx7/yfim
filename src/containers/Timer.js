import React from 'react';
import { useState, useEffect } from 'react';
import { timeColorMapDefault, getTimerColor } from "../classes/TimedEvent"

export default function Timer(props){
  const elapsed = props.elapsed ?? null;
  const timeLimit = props.duration ?? null;
  const countdown = props.countdown ?? false;
  const timeColorMap = props.timeColorMap ?? timeColorMapDefault;
  const [textColor, setTextColor]  = useState(timeColorMap[timeColorMap.length-1].color);
  const [timeString, setTimeString] = useState("00:00")

  const formatTime = (time) => {
    if(time >= 0){
      const mins = `${Math.floor((time / 60) % 60)}`.padStart(2, "0");
      const secs = `${Math.floor((time) % 60)}`.padStart(2, "0");
      return `${mins}:${secs}`;
    }
  }

  useEffect(() => {
    var time = elapsed;
    if(timeLimit > 0){
      if(countdown){
        time = timeLimit - elapsed;
      }
      setTextColor(getTimerColor(time, timeColorMap))
    }
    setTimeString(formatTime(time))
  }, [elapsed]);

  return (
    <div className="timer" style={{color: `${textColor}`}}>
      {timeString}
    </div>
  );
}
