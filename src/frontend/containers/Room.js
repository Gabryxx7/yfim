import React, { useEffect, useState, useRef, useContext } from "react";
import io from "socket.io-client";
import "survey-react/survey.css";
import { CMDS, DATA, KEY_SHORTCUTS} from "../../backend/Definitions.js";
import Toolbar from "./Toolbar.js";
import 'react-toastify/dist/ReactToastify.css';
import VideoContainer from "./VideoContainer.js";
import {FaceProcessor} from "../classes/FaceProcessor.js";
import { STAGE } from "../../backend/Definitions.js"
import { Model } from "survey-core";
import { Survey } from "survey-react-ui";
import "survey-core/defaultV2.min.css";
import FileSaver from "file-saver";
// import "../surveyStyle";s
import Introduction from "../components/Introduction.js";
import { AVAILABLE_SURVEYS, SURVEY_CSS_CLASSES, } from "../../../assets/PostChatSurvey.js";
import { TimedEvent } from "../../backend/TimedEvent.js";
import {useSocket} from "../../context";
// import { createRequire } from "module";
// const require = createRequire(import.meta.url);
// var AVAILABLE_SURVEYS = require("../../assets/PostChatSurvey.js");

const START_SHORTCUTS_ENABLED = false;

export default function Room(props) {
	const socket = useSocket(CMDS.NAMESPACES.CHAT);
	const useJoinForm = props.useJoinForm ?? true;
	const [faceProcessor, setFaceProcessor] = useState(null);
	const [prompt, setPrompt] = useState("Waiting for your conversation partner to join the call...")
	const [connectionStatus, setConnectionStatus] = useState("none")
	const [bridge, setBridge] = useState("none");
	const [stageData, setStageData] = useState({reason: "", state: STAGE.STATUS.NONE, type: STAGE.TYPE.NONE, data: null});
	const [userData, setUserData] = useState({});
	const [roomData, setRoomData] = useState({});
	const [sessionCompleted, setSessionCompleted] = useState(false);
	const [shortcutsControls, setShortcutsControls] = useState({shortcutsEnabled: START_SHORTCUTS_ENABLED, audio: true, mic: true, video: true, recording: true, show_debug: false});

	// For some reason survey-react will re-render when the onComplete() contains a setState() call. So I had to write this workaround
	// Where I only set the onComplete() callback on the first page render, this seems to do the trick (probably because of memoization?!)
	const surveyModel = useRef(null)
	const [currentSurvey, setCurrentSurvey] = useState(null)

	useEffect(() => {
		console.log(`Stage Data Updated: `, stageData);
		if(stageData.state == STAGE.STATUS.NONE){
			setCurrentSurvey(null);
			setPrompt("Waiting for your conversation partner to join the call...");
			// TOASTS.TEST.show({onAction: (res) => console.log("Toast clicked! " +res)})
			return;
		}
		if(stageData.state == STAGE.STATUS.COMPLETED){
			console.log(`STAGE [${stageData.type}] COMPLETED (${stageData.reason})`);
			const sessionData = sessionMap.session.getSessionData();
			let baseFilename = `YFIM_SURVEY_${sessionMap.session.user?.name}_${sessionData.date}.json`;
			const completionData = {data: sessionData};
			completionData.filename = baseFilename;
			if(stageData.type == STAGE.TYPE.SURVEY){
				if(stageData.data != null && stageData.data != undefined){
					const surveyData = stageData?.data ?? surveyModel?.current?.data;
					completionData.data.survey = surveyData;
				}
				// setPrompt("Waiting for your conversation partner to complete the survey...");
			}
			socket.emit(CMDS.SOCKET.STEP_COMPLETED, completionData);
			const blob = new Blob([JSON.stringify(completionData.data)], {type: "text/plain;charset=utf-8"});
			FileSaver.saveAs(blob, baseFilename)
			return;
		}
		if(stageData.state == STAGE.STATUS.IN_PROGRESS){
			if(stageData.type == STAGE.TYPE.VIDEO_CHAT){
				setCurrentSurvey(null);
				var availablePrompts = stageData?.prompts ?? stageData.step?.prompts;
				console.log(`Available Prompts: ${availablePrompts}`);
				// console.log(`User order: ${userData.order}, total prompts: ${availablePrompts.length}`);
				const promptIdx = Math.min(userData.order % 2, availablePrompts.length-1);
				const newPrompt = availablePrompts[promptIdx];
				if(newPrompt != null && newPrompt != undefined){
					setPrompt(newPrompt);
				}
			}
			else if(stageData.type == STAGE.TYPE.SURVEY){
				console.log("Current Survey model...", surveyModel.current)
				// setPrompt("We have some questions for you...");
			}
			else {

			}
			return;
		}
	}, [stageData])

	useEffect(() => {
		console.log("NEW PROMPT ", prompt);
		try{
			sessionMap.session.data.stage.userPrompt = prompt;
		} catch(error) {
			console.error("Error assigning user prompt to session stage: ")
		}
	}, [prompt])
	

	const onUserUpdate = (data) => {
		if(sessionMap.session?.user?.role != data?.role){
			if(data?.role?.toLowerCase() == 'host'){
				TOASTS.NEW_ROLE.show({role:data?.role});
			}
		}
		console.log(`Received user update ${data?.role}`, data)
		sessionMap.updateUser(data);
		setUserData((prev) => ({...prev, ...data}));
	}

	const onRoomUpdate = (data) => {
		console.log(`Received room update`, data)
		sessionMap.updateRoom(data);
		setRoomData((prev) => ({...prev, ...data}));
		setStageData((prev) => ({
			...prev,
			...data.session?.stage,
			reason: "OnSessionUpdate",
			state: data.session?.status,
			type: data.stage?.step?.type,
			sessionId: data?.sessionId,
			index: data?.stage?.index
		}));
		sessionMap.session?.setStatus(data?.session?.status)
	}

	const onSessionUpdate = (data) => {
		console.log(`Received Session update`, data)
		sessionMap.updateSession(data);
		if(data?.status == TimedEvent.STATUS.COMPLETED){
			console.log("SESSION COMPLETED!")
			setSessionCompleted(true)
			return;
		}
		sessionMap.session.start();
		console.log("OnSessionUpdate", data)
		setStageData((prev) => ({
			...prev,
			...data.stage,
			reason: "OnSessionUpdate",
			state: STAGE.STATUS.IN_PROGRESS,
			type: data.stage?.step?.type,
			sessionId: data?.sessionId,
			index: data?.stage?.index
		}));

		if(data.stage?.step?.type != STAGE.TYPE.SURVEY) return;
		const surveyDataModel = AVAILABLE_SURVEYS[data.stage?.step?.surveyModelId] ?? null;
		console.log("SURVEY ID", surveyDataModel)
		if(surveyModel.current != null){
			if(surveyDataModel != null && surveyModel.current.surveyModelId == surveyDataModel.surveyModelId){
				console.log("Clearing and re-rendering current survey");
				surveyModel.current.clear();
				surveyModel.current.render();
				return;
			}
		}
		try{
			console.log(`Loading new survey ${surveyDataModel.surveyModelId}`);
			surveyModel.current = new Model(surveyDataModel.model);
			// surveyModel.current.clear();
			// surveyModel.current.render();
			surveyModel.current.onComplete.add((sender, options) => {
				console.log(JSON.stringify(sender.data, null, 3));
				setStageData((prev) => ({...prev, reason: "", state: STAGE.STATUS.COMPLETED, data: sender.data}));
			})
			surveyModel.current.onAfterRenderSurvey.add(() => {console.log("SURVEY RENDERED")});
			setCurrentSurvey(surveyModel.current);
		}
		catch(error){
			console.warn(`Could not find survey with ID ${surveyDataModel.surveyModelId}`);
		}
	}


	//  useEffect(() => {
	// 	setRTCManager(new WebRTCManager(socket, sessionMap));
	//   	// setFaceProcessor(new FaceProcessor());
	// }, []);

	useEffect(() => {
		if(RTCManager == null) return;
		RTCManager.onConnectionStateChange = (state) => setConnectionStatus(state);
		// socket.emit(CMDS.SOCKET.SURVEY_CONNECT, {
		// 	room: room,
		// 	user: user,
		// });
		// socket.onAny((eventName, ...args) => {
		// 	if(eventName !== CMDS.SOCKET.FACE_DETECTED){
		// 		console.log(`Received event ${eventName}`, args)
		// 	}
		// });
		socket.on(CMDS.SOCKET.CONNECT, () => {
			console.log(`CONNECTED TO THE SOCKET CONTEXT`);
		});
		socket.on(CMDS.SOCKET.CONNECT_ERROR, (err) => {
		  console.log(`connect_error due to ${err.message}`);
		});
		socket.on(CMDS.SOCKET.ROOM_IDLE, () => resetParams());
		socket.on(CMDS.SOCKET.SURVEY_START, (data) => onSurveyStart(data));
		socket.on(CMDS.SOCKET.FACE_DETECTED, () => setFaceOn(true));
      socket.on(CMDS.SOCKET.SESSION_UPDATE, (data) => onSessionUpdate(data));
		// socket.on(CMDS.SOCKET.PROCESS_START, () => onProcessStart());
		socket.on(CMDS.SOCKET.ROOM_UPDATE, (data) => onRoomUpdate(data));
		socket.on(CMDS.SOCKET.USER_UPDATE, (data) => onUserUpdate(data));
		// socket.on(CMDS.SOCKET.PROCESS_STOP, (data) => onProcessStop(data));
		socket.on(CMDS.SOCKET.RESET, () => resetParams());

		// setSocket(socket);
		if(!useJoinForm){
		// CHANGE THIS TO IMMEDIATELY JOIN THE ROOM
    		socket.emit(CMDS.SOCKET.JOIN_ROOM);
		}
	}, [RTCManager])

	useEffect(() => {
		// console.log("connectionStatus ", connectionStatus)
		if(connectionStatus == "connected"){
			TOASTS.USER_JOINED.show();
		}
		else if(connectionStatus == "disconnected"){
			TOASTS.USER_LEFT.show();
		}
	}, [connectionStatus]);

	return (
		<div className='main-room' tabIndex={"0"} onKeyDown={handleKeyPress}>
		<Toolbar 
			onSkipClicked={skipStage}
			onTimerEnd={() => {
				setStageData((prev) => ({...prev, reason: "time limit reached", state: STAGE.STATUS.COMPLETED, data: null}));
				console.log("STAGE COMPLETED (time limit reached)");
				socket.emit(CMDS.SOCKET.STEP_COMPLETED);
			}}
			prompt={prompt}
			stageData={stageData}
			userData={userData}
			roomData={roomData}
			showDebug={shortcutsControls.show_debug}
		/>
			
		<div className={`main-call-container ${bridge}`}>
		
			{/* <TestComponent index={0} user={user} />
			<TestComponent index={1} user={user}/> */}
			<div className='main-room-container' style={{display: `${stageData.type == STAGE.TYPE.SURVEY ? 'none' : 'block'}`}}>
			<VideoContainer
				recordingEnabled={shortcutsControls.recordingEnabled}
				stageData={stageData}
				userData={userData}
				onStreamAdded={() => {
					setBridge(CMDS.RTC.STATUS.ESTABLISHED)
				}}
				onRemotePlay={() => {
					sessionMap.session.start();
					setStageData((prev) => ({...prev, reason: "Remote Play trigger", state: STAGE.STATUS.IN_PROGRESS}));
				}}
				audioEnabled={shortcutsControls.audio}
				micEnabled={shortcutsControls.mic}
				videoEnabled={shortcutsControls.video}
				connectionStatus={connectionStatus}
				rtcManager={RTCManager}
				faceProcessor={faceProcessor} />
			</div>
				<Introduction />
			<div style={{display: `${stageData.type == STAGE.TYPE.VIDEO_CHAT ? 'none' : 'block'}`}}>
			{!sessionCompleted && currentSurvey != null && <Survey className={`video-overlay survey-container ${stageData.type}`} model={currentSurvey} /> }
			{sessionCompleted && <div className="video-overlay end-message">
				<h1>{`Thank you!`}</h1>
				<h3>{`Please wait for the experiment to complete :)`}</h3>
			</div>}
			</div>
		</div>
		</div>
	);
}
