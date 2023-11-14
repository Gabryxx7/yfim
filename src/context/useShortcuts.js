import { useStage, useSettings } from ".";
import { useApp } from "./useApp";
import { CMDS, KEY_SHORTCUTS } from "../backend/Definitions";
import { TOASTS } from "../frontend/components/ToastCommunications";

export const useShortcuts = () => {
   const { settings, updateSettings } = useSettings();
   const { stage, updateStage, skipStage, completeStage } = useStage();

   const shortcutsHandler = (e) => {
      if(!e) return;
      const keyCode = e.code;
      // console.log(`${shortcutsControls.shortcutsEnabled ? '[ENABLED]' : '[DISABLED]'} Key Pressed: ${e.code}, ${keyCode}`);
      if(keyCode === KEY_SHORTCUTS.ENABLE_SHORTCUTS.keyCode){
         updateSettings({ shortcutsEnabled: !settings.shortcutsEnabled })
         TOASTS.KEYBOARD_SHORTCUTS.show({enabled: !settings.shortcutsEnabled}) // At this stage it did not change yet!
      }

      if(!settings.shortcutsEnabled) return;
      if(keyCode === KEY_SHORTCUTS.MUTE_VIDEO.keyCode){
         updateSettings({ video: !settings.video})
      }
      if(keyCode === KEY_SHORTCUTS.MUTE_SELF.keyCode){
         updateSettings({ mic: !settings.mic})
      } 
      if(keyCode === KEY_SHORTCUTS.MUTE_OTHERS.keyCode){
         updateSettings({ audio: !settings.audio})
      } 
      if(keyCode === KEY_SHORTCUTS.TOGGLE_RECORDING.keyCode){
         updateSettings({ recording: !settings.recording})
      }
      if(keyCode === KEY_SHORTCUTS.SHOW_DEBUG.keyCode){
         updateSettings({ show_debug: !settings.show_debug})
      }
      if(keyCode === KEY_SHORTCUTS.SKIP_STAGE.keyCode){
         skipStage()
      }
      if(keyCode === KEY_SHORTCUTS.PAUSE_TIMER.keyCode){
         // sessionMap.session.togglePause();
         socket.emit(CMDS.SOCKET.TOGGLE_SESSION_PAUSE);
      }
      e.preventDefault()
   }
   return { shortcutsHandler };
}