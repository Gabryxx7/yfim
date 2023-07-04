import React from 'react';
import { useState, useEffect } from 'react';
import {timeColorMapDefault} from "../components/TimedEvent"

export default function Timer(props){
  const duration = props.duration ?? null;
  const countdown = props.countdown ?? false;
  const timeColorMap = props.timeColorMap ?? timeColorMapDefault;
  const [textColor, setTextColor]  = useState(timeColorMap[timeColorMap.length-1].color);
  const [timeString, setTimeString] = useState("00:00")

  const updateColor = (remaining) => {
    for(let interval of timeColorMap){
      if(interval.conditionFun(remaining)){
        setTextColor(interval.color);
        return;
      }
    }
  }
  const updateTimer = (elapsed) => {
    var totalTime = elapsed;
    if(duration){
      var remaining = duration - elapsed;
      if(countdown){
        totalTime = remaining
      }
      updateColor(remaining)
    }
    const mins = `${Math.floor((totalTime / 60) % 60)}`.padStart(2, "0");
    const secs = `${Math.floor((totalTime) % 60)}`.padStart(2, "0");
    setTimeString(`${mins}:${secs}`)
  };

  useEffect(() => {
    updateTimer(props.timeRef);
  }, [props.timeRef]);

  return (
    <div className="timer" style={{color: `${textColor}`}}>
      {timeString}
    </div>
  );
}
