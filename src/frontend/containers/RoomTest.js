import React, { useEffect, useState, useRef, useContext } from "react";
import io from "socket.io-client";
import "survey-react/survey.css";
import { CMDS, DATA, KEY_SHORTCUTS, STAGE} from "../../backend/Definitions.js";
import 'react-toastify/dist/ReactToastify.css';
import "survey-core/defaultV2.min.css";
import { ToastCommunications, TOASTS } from "../components/ToastCommunications.js";
import { TimedEvent } from "../../backend/TimedEvent.js";
import {useSocket} from "../../context/SocketContext.js";
import { useUser, useRoom, useSession, useStage, useStep, useSettings, useShortcuts, useFaceProcessor } from '../../context/AppContext.js';
import Introduction from "../components/Introduction.js";
import ShortcutsPanel from "../components/ShortcutsPanel.js";
import VideoContainer from "./VideoContainer.js";
import { FaceMaskSelector } from "../components/Controls/FaceMaskSelector.js";
// import { createRequire } from "module";
// const require = createRequire(import.meta.url);
// var AVAILABLE_SURVEYS = require("../../assets/PostChatSurvey.js");

const renderLog = (trigger) => console.log("ROOM RERENDER! Triggered by: "+trigger);

function ControlsOverlay(props){
	return <div className="overlay-panel">
		{props.children}
	</div>
}

export default function RoomTest(props) {
	const socket = useSocket(CMDS.NAMESPACES.CHAT);
   const { shortcutsHandler } = useShortcuts();
   const { settings, updateSettings } = useSettings();
   const faceProcessor = useFaceProcessor();
   const { user,  updateUser } = useUser();
   const { room,  updateRoom } = useRoom();
   const { stage, updateStage } = useStage();
   const { step,  updateStep } = useStep();

	useEffect(() => {
		updateSettings({ debug: true })
	}, [])

	useEffect(() => {
		renderLog('user');
	}, [user])

	useEffect(() => {
		renderLog('faceProcessor');
	}, [faceProcessor])

	useEffect(() => {
		renderLog('socket');
	}, [socket])

	useEffect(() => {
		renderLog('room');
	}, [room])

	useEffect(() => {
		renderLog('stage');
	}, [stage])

	useEffect(() => {
		renderLog('settings');
	}, [settings])
	
	return (
		<div className='main-room' tabIndex={"0"} onKeyDown={shortcutsHandler}>
		<div className={`main-call-container`}>
			<div className='main-room-container' style={{display: `${stage.type == STAGE.TYPE.SURVEY ? 'none' : 'block'}`}}>
				<VideoContainer />
			</div>
         <Introduction />
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
