import { useApp } from "./useApp";

export const useFaceProcessor = () => {
   const { faceProcessor, setFaceProcessor, socket }= useApp();
   return faceProcessor;
}