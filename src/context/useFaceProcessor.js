import { useState, useEffect } from "react";
import { useApp } from "./useApp";
import VideoProcessor from "../frontend/classes/VideoProcessor";

export const useFaceProcessor = () => {
   const { faceProcessorRef } = useApp();
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

   // useEffect(() => {
      
   // }, [fpsData])

   useEffect(() => {
      if(faceProcessorRef.current){
         faceProcessorRef.current.subscribe(VideoProcessor.Event.UPDATE, addFpsData)
      }
   }, [faceProcessorRef.current])
   return { faceProcessor: faceProcessorRef.current, fps: fps };
}