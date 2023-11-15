import React, { useEffect, useState, useRef, useContext } from "react";
import "survey-react/survey.css";
import { CMDS, DATA, KEY_SHORTCUTS, STAGE} from "../../backend/Definitions.js";
import 'react-toastify/dist/ReactToastify.css';
import "survey-core/defaultV2.min.css";
import { ToastCommunications, TOASTS } from "../components/ToastCommunications.js";
import { TimedEvent } from "../../backend/TimedEvent.js";
import { useUser, useRoom, useSession, useStage, useStep, useSettings, useShortcuts, useFaceProcessor, useSocket} from '../../context';
import ShortcutsPanel from "../components/ShortcutsPanel.js";
import VideoContainer from "./VideoContainer.js";
import { FaceMaskSelector } from "../components/Controls/FaceMaskSelector.js";

const renderLog = (trigger, data) => {
	console.log("VideoTest RERENDER! Triggered by: "+trigger, data);
}

function ControlsOverlay(props){
	return <div className="overlay-panel">
		{props.children}
	</div>
}

export default function VideoTest(props) {
	const socket = useSocket(CMDS.NAMESPACES.CHAT);
   const { shortcutsHandler } = useShortcuts();
   const { settings, updateSettings } = useSettings();
   const { faceProcessor } = useFaceProcessor();
   const { user,  updateUser } = useUser();
   const { room,  updateRoom } = useRoom();
   const { stage, updateStage } = useStage();
   const { step,  updateStep } = useStep();

	useEffect(() => {
		updateSettings({ debug: true })
	}, [])


	useEffect(() => {
		renderLog('user', user);
	}, [user])

	useEffect(() => {
		renderLog('faceProcessor', faceProcessor);
	}, [faceProcessor])

	useEffect(() => {
		renderLog('socket', socket);
	}, [socket])

	useEffect(() => {
		renderLog('room', room);
	}, [room])

	useEffect(() => {
		renderLog('stage', stage);
	}, [stage])

	useEffect(() => {
		renderLog('settings', settings);
	}, [settings])
	
	return (
      <div className='main-room' tabIndex={"0"} onKeyDown={shortcutsHandler}>
         <div className={`main-call-container`}>
            <div className='main-room-container'>
               <VideoContainer />
            </div>
            <ControlsOverlay>
               <ShortcutsPanel className="overlay-transparent" />
               <FaceMaskSelector className="overlay-transparent" />
            </ControlsOverlay>
         </div>
         <ToastCommunications />
      </div>
	);
}
