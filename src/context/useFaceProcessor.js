import React, { useContext } from "react";
import { AppContext } from "./AppContext.js";

export const useFaceProcessor = () => {
   const { faceProcessor, setFaceProcessor, socket } = useContext(AppContext);
   return faceProcessor;
}