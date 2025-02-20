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
import Toolbar from "./Toolbar.js";
import { useParams } from "react-router-dom";
import { AvailableVideoProcessors } from "../../context/AppContext.js";
import { ControlPanel } from "./ControlPanel.js";

const renderLog = (trigger, data) => {
	// console.log("ROOM RERENDER! Triggered by: "+trigger, data);
}

export default function RoomTest(props) { 
	const socket = useSocket(CMDS.NAMESPACES.CHAT);
	return <WebRTCProvider socket={socket}>
		<RoomTestSession {...props} />
	</WebRTCProvider>
}

function RoomTestSession(props) {
	const params = useParams();
	const socket = useSocket(CMDS.NAMESPACES.CHAT);
   const { shortcutsHandler } = useShortcuts();
   const { settings, updateSettings } = useSettings();
   const { faceProcessor } = useFaceProcessor(AvailableVideoProcessors.VIDEO);
   const { user,  updateUser } = useUser();
   const { room,  updateRoom } = useRoom();
   const { stage, updateStage } = useStage();
   const { step,  updateStep } = useStep();
	const { bridge } = useWebRTC();

	useEffect(() => {
		updateSettings({ debug: true })
		params.room_id && updateUser({ roomId: params.room_id})
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
			<Toolbar 
				// onTimerEnd={() => {
				// 	setStageData((prev) => ({...prev, reason: "time limit reached", state: STAGE.STATUS.COMPLETED, data: null}));
				// 	console.log("STAGE COMPLETED (time limit reached)");
				// 	socket.emit(CMDS.SOCKET.STEP_COMPLETED);
				// }}
			/>
				
		<div className={`main-call-container ${bridge}`}>
			<div className='main-room-container' style={{display: `${stage.type == STAGE.TYPE.SURVEY ? 'none' : 'block'}`}}>
				<VideoContainer />
			</div>
			{bridge != CMDS.RTC.STATUS.ESTABLISHED && <Introduction />}
			<ControlPanel>
				<ShortcutsPanel className="overlay-transparent" />
				<FaceMaskSelector className="overlay-transparent" />
			</ControlPanel>
		</div>
		<ToastCommunications />
		</div>
	);
}
