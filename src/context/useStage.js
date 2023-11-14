import { useApp } from "./useApp";

export const useStage = () => {
   const { stage, setStage, socket }= useApp();
   return {
      stage,
      updateStage: (stageData) => setStage(prevStage => ({...prevStage, ...stageData})),
      skipStage: () => console.log("Skipping stage"),
      completeStage: () => console.log("Stage completed")
   }
}