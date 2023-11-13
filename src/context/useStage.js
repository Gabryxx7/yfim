import React, { useContext } from "react";
import { AppContext } from "./AppContext.js";

export const useStage = () => {
   const { stage, setStage, socket } = useContext(AppContext);
   return {
      stage,
      updateStage: (stageData) => setStage(prevStage => ({...prevStage, ...stageData})),
      skipStage: () => console.log("Skipping stage"),
      completeStage: () => console.log("Stage completed")
   }
}