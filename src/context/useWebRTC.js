import { useContext } from "react";
import { WebRTCContext } from "./WebRTCContext.js";

export const useWebRTC = () => {
   const { bridge, setBridge, socket, stream } = useContext(WebRTCContext);
   
   return {
      stream,
      bridge,
      updateBridge: (bridgeData) => setBridge(prevBridge => ({...prevBridge, ...bridgeData})),
      socket
   }
}