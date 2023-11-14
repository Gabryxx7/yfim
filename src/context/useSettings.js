import { useApp } from "./useApp";

export const useSettings = () => {
   const { settings, setSettings, socket }= useApp();
   
   return {
      settings,
      updateSettings: (settingsData) => setSettings(prevSettings => ({...prevSettings, ...settingsData}))
   }
}
