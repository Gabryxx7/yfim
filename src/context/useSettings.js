import React, { useContext } from "react";
import { AppContext, useStage } from "./AppContext";
import { CMDS, KEY_SHORTCUTS } from "../backend/Definitions";
import { TOASTS } from "../frontend/components/ToastCommunications";

export const useSettings = () => {
   const { settings, setSettings, socket } = useContext(AppContext);
   
   return {
      settings,
      updateSettings: (settingsData) => setSettings(prevSettings => ({...prevSettings, ...settingsData}))
   }
}
