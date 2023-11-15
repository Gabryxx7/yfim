import { useState, useEffect } from "react";
import { useApp } from "./useApp";
import VideoProcessor from "../frontend/classes/VideoProcessor";

export const useFaceProcessor = (processorId=null) => {
   const { faceProcessorRef, setFaceProcessor, setFaceProcessorId } = useApp();
   
   useEffect(() => {
      setFaceProcessorId(processorId)
   }, [])
   return { faceProcessor: faceProcessorRef.current, setFaceProcessorId };
}