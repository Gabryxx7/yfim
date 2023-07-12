import React from 'react';
import { useState, useEffect } from 'react';
import { timeColorMapDefault, getTimerColor } from "../classes/TimedEvent"

export default function Timer(props){
  const timeLimit = props.duration ?? null;
  const countdown = props.countdown ?? false;
  const timeColorMap = props.timeColorMap ?? timeColorMapDefault;
  const [textColor, setTextColor]  = useState(timeColorMap[timeColorMap.length-1].color);
  const [timeString, setTimeString] = useState("00:00")

  useEffect(() => {
    var time = elapsed;
    if(timeLimit > 0){
      if(countdown){
        time = duration - elapsed;
      }
      setTextColor(getTimerColor(time, timeColorMap))
    }
    setTimeString(formatTime(time))
  }, [props.timeElapsedRef]);

  return (
    <div className="timer" style={{color: `${textColor}`}}>
      {timeString}
    </div>
  );
}
