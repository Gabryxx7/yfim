import React, { useEffect, useRef, useState, forwardRef } from 'react';
import { useFaceProcessor, useSettings } from '../../context';
import VideoProcessor from '../classes/VideoProcessor';
import YFIMObject from '../classes/YFIMObject';

export function FPSViewer(props) {
   const { faceProcessor } = useFaceProcessor();
   const [fps, setFps] = useState(0);

   useEffect(() => {
      if(faceProcessor){
         console.log("Subscribing to faceProcessor update")
         faceProcessor.subscribe(YFIMObject.Event.UPDATE, (fpsData) => setFps(fpsData.avg))
      }
   }, [faceProcessor])

   return (
      <div className={`fps-viewer`} {...props}>
         <span>{'FPS: '}</span>
         <span className='fps-value'>{fps}</span>
      </div>
  )
};