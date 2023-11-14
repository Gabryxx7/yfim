import React, { useEffect, useState, useRef, useContext } from "react";
import "survey-react/survey.css";
import { CMDS, DATA, KEY_SHORTCUTS, STAGE} from "../../backend/Definitions.js";
import 'react-toastify/dist/ReactToastify.css';
import "survey-core/defaultV2.min.css";
import { ToastCommunications, TOASTS } from "../components/ToastCommunications.js";
import { TimedEvent } from "../../backend/TimedEvent.js";
import { useUser, useRoom, useSession, useStage, useStep, useSettings, useShortcuts, useFaceProcessor, useSocket, useWebRTC} from '../../context';
import Introduction from "../components/Introduction.js";
import ShortcutsPanel from "../components/ShortcutsPanel.js";
import VideoContainer from "./VideoContainer.js";
import { FaceMaskSelector } from "../components/Controls/FaceMaskSelector.js";
import { WebRTCContext, WebRTCProvider } from "../../context/WebRTCContext.js";
// import { createRequire } from "module";
// const require = createRequire(import.meta.url);
// var AVAILABLE_SURVEYS = require("../../assets/PostChatSurvey.js");

const renderLog = (trigger, data) => {
	// console.log("ROOM RERENDER! Triggered by: "+trigger, data);
}

function ControlsOverlay(props){
	return <div className="overlay-panel">
		{props.children}
	</div>
}

export default function RoomTest(props) { 
	const socket = useSocket(CMDS.NAMESPACES.CHAT);
	return <WebRTCProvider socket={socket}>
		<RoomTestSession {...props} />
	</WebRTCProvider>
}

function RoomTestSession(props) {
	const socket = useSocket(CMDS.NAMESPACES.CHAT);
	const {bridge} = useWebRTC();
   const { shortcutsHandler } = useShortcuts();
   const { settings, updateSettings } = useSettings();
   const { faceProcessor, fps } = useFaceProcessor();
   const { user,  updateUser } = useUser();
   const { room,  updateRoom } = useRoom();
   const { stage, updateStage } = useStage();
   const { step,  updateStep } = useStep();

	useEffect(() => {
		updateSettings({ debug: true })
	}, [])

	useEffect(() => {
		renderLog('bridge', bridge)
	}, [bridge])

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
			<div className={`main-call-container ${bridge}`}>
				<div className='main-room-container' style={{display: `${stage.type == STAGE.TYPE.SURVEY ? 'none' : 'block'}`}}>
					<VideoContainer />
				</div>
				{bridge != CMDS.RTC.STATUS.ESTABLISHED && <Introduction />}
				<ControlsOverlay>
					<ShortcutsPanel className="overlay-transparent" />
					<FaceMaskSelector className="overlay-transparent" />
				</ControlsOverlay>
			</div>
			<ToastCommunications />
			<div>{user?.name}</div>
				<div>{room?.name}</div>
				<div>{stage?.index}</div>
			</div>
	);
}
