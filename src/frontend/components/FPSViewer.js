import React, { useEffect, useRef, useState, forwardRef } from 'react';
import { useFaceProcessor, useSettings } from '../../context';
import VideoProcessor from '../classes/VideoProcessor';

export function FPSViewer(props) {
   const { faceProcessor } = useFaceProcessor();
   const [fpsData, setFpsData] = useState({ data: Array(10).fill(0), i: 0 })
   const [fps, setFps] = useState(0);
   const addFpsData = (fps, dt) => {
      setFpsData(prev => {
         prev.data[prev.i] = fps;
         prev.i = prev.i == prev.length - 1 ? 0 : prev.i+1;
         setFps(Math.round(prev.data.reduce((a, b) => (a + b)) / prev.data.length))
         return prev;
      })
   }

   useEffect(() => {
      if(faceProcessor) faceProcessor.subscribe(VideoProcessor.Event.UPDATE, addFpsData)
   }, [faceProcessor])

   return (
      <div className={`fps-viewer`} {...props}>
         <span>{'FPS: '}</span>
         <span className='fps-value'>{fps}</span>
      </div>
  )
};