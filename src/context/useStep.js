import { useApp } from "./useApp";

export const useStep = () => {
   const { step, setStep, socket }= useApp();
   return {
      step,
      updateStep: (stepData) => setStep(prevStep => ({...prevStep, ...stepData}))
   }
}