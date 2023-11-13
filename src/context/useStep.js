import React, { useContext } from "react";
import { AppContext } from "./AppContext.js";

export const useStep = () => {
   const { step, setStep, socket } = useContext(AppContext);
   return {
      step,
      updateStep: (stepData) => setStep(prevStep => ({...prevStep, ...stepData}))
   }
}