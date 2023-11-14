import { useState, useEffect } from "react";
import { useApp } from "./useApp";
import VideoProcessor from "../frontend/classes/VideoProcessor";

export const useFaceProcessor = () => {
   const { faceProcessorRef } = useApp();
   return { faceProcessor: faceProcessorRef.current };
}