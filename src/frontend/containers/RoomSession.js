import React, { useEffect, useState, useRef, useContext, useReducer, useCallback } from "react";
import io from "socket.io-client";
import "survey-react/survey.css";
import { CMDS, DATA} from "../../backend/Definitions.js";
import Toolbar from "./Toolbar.js";
import WebRTCManager from "../classes/RTCManager.js"
import 'react-toastify/dist/ReactToastify.css';
import { ToastCommunications, TOASTS } from "../components/ToastCommunications.js";
import { SessionProvider, SessionContext } from "../classes/ClientSession.js";
import VideoContainer from "../containers/VideoContainer.js";
import {FaceProcessor} from "../classes/FaceProcessor.js";
import { STAGE } from "../../backend/Definitions.js"
import { Model } from "survey-core";
import { Survey } from "survey-react-ui";
import "survey-core/defaultV2.min.css";
import FileSaver from "file-saver";
// import "../surveyStyle";
import Introduction from "../components/Introduction.js";
import { AVAILABLE_SURVEYS, SURVEY_CSS_CLASSES, } from "../../../assets/PostChatSurvey.js";
// import { createRequire } from "module";
// const require = createRequire(import.meta.url);
// var AVAILABLE_SURVEYS = require("../../assets/PostChatSurvey.js");

export default function RoomSession(props) {
	const sessionMap = useContext(SessionContext);
	return (
		<SessionProvider>
			<Room {...props}/>
		</SessionProvider>
	);
}

function Room(props) {
	const sessionMap = useContext(SessionContext);
	const useJoinForm = props.useJoinForm ?? true;
	const [faceProcessor, setFaceProcessor] = useState(null);
	const socket = useRef(null);
	const [prompt, setPrompt] = useState("Waiting for your conversation partner to join the call...")
	const [RTCManager, setRTCManager] = useState(null)
	const [connectionStatus, setConnectionStatus] = useState("none")
	const [bridge, setBridge] = useState("none");
	const [stageData, setStageData] = useState({reason: "", state: STAGE.STATUS.NONE, type: STAGE.TYPE.NONE, data: null});
	const [userData, setUserData] = useState({});
	const [roomData, setRoomData] = useState({});

	// For some reason survey-react will re-render when the onComplete() contains a setState() call. So I had to write this workaround
	// Where I only set the onComplete() callback on the first page render, this seems to do the trick (probably because of memoization?!)
	const surveyModel = useRef(null)
	const [currentSurvey, setCurrentSurvey] = useState(null)

	useEffect(() => {
		// if(surveyModel.current == null){
		// 	surveyModel.current = new Model(AVAILABLE_SURVEYS.POST_VIDEO_CHAT);
		// 	surveyModel.current = new Model(AVAILABLE_SURVEYS.TEST);
		// 	surveyModel.current.onComplete.add((sender, options) => {
		// 		console.log(JSON.stringify(sender.data, null, 3));
		// 		setStageData({reason: "", data: sender.data, state: STAGE.STATUS.COMPLETED});
		// 	})
		// 	surveyModel.current.onAfterRenderSurvey.add(() => {console.log("SURVEY RENDERED")});
		// }
	}, [])


	useEffect(() => {
		console.log(`STAGE TYPE: ${stageData.type}`)
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
			socket.current.emit(CMDS.SOCKET.STEP_COMPLETED, completionData);
			const blob = new Blob([JSON.stringify(completionData.data)], {type: "text/plain;charset=utf-8"});
			FileSaver.saveAs(blob, baseFilename)
			return;
		}
		if(stageData.state == STAGE.STATUS.IN_PROGRESS){
			if(stageData.type == STAGE.TYPE.VIDEO_CHAT){
				setCurrentSurvey(null);
				var availablePrompts = sessionMap.session.data?.stage?.prompts;
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
			console.error("Error assigning user prompt to session stage: ", error)
		}
	}, [prompt])
	

	const onUserUpdate = (data) => {
		if(sessionMap.session?.user?.role != data?.user?.role){
			if(data?.user?.role?.toLowerCase() == 'host'){
				TOASTS.NEW_ROLE.show({role:data?.user?.role});
			}
		}
		console.log(`Updated user Role ${data?.user?.role}`)
		sessionMap.updateUser(data);
		setUserData(sessionMap.session?.user);
	}

	const onRoomUpdate = (data) => {
		sessionMap.updateRoom(data);
		setRoomData(sessionMap.session?.room);
	}

	const onSessionUpdate = (data) => {
		console.log("Session update");
		sessionMap.updateSession(data);
		sessionMap.session.start();
		setStageData({reason: "", state: STAGE.STATUS.IN_PROGRESS,
			type: sessionMap.session.data?.stage?.step?.type,
			sessionId: sessionMap.session?.data?.sessionId,
			index: sessionMap.session?.data?.stage?.index});

		if(sessionMap.session.data?.stage?.step?.type != STAGE.TYPE.SURVEY) return;
		const surveyDataModel = AVAILABLE_SURVEYS[sessionMap.session.data?.stage?.step?.surveyModelId] ?? null;
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

	const onJoinRequestAnswer = (answer) => {
		if(RTCManager.lastUserIdRequest != null){
			console.log(`RTC: ${answer}ing join request from ${RTCManager.lastUserIdRequest}`);
			socket.current.emit(CMDS.SOCKET.RTC_COMMUNICATION, {bridge: CMDS.RTC.ACTIONS.ACCEPT_JOIN_REQUEST, userId: RTCManager.lastUserIdRequest});
			RTCManager.lastUserIdRequest = null;
		}
		// socketRef.current.emit(e.target.dataset.ref, state.sid); // I'm not sure why so many emit() calls had an array [cmd] as command
		setBridge(CMDS.RTC.STATUS.CONNECTING)
	 }

	 useEffect(() => {
		console.log("Room page render");
		socket.current = io.connect(`/${CMDS.NAMESPACES.CHAT}`);
		console.log(`Created Socket: `,socket.current);
		setRTCManager(new WebRTCManager(socket, sessionMap));
	  	setFaceProcessor(new FaceProcessor());
	}, []);

	useEffect(() => {
		if(RTCManager == null) return;
		RTCManager.onConnectionStateChange = (state) => setConnectionStatus(state);
		// socket.emit(CMDS.SOCKET.SURVEY_CONNECT, {
		// 	room: room,
		// 	user: user,
		// });
		// socket.current.onAny((eventName, ...args) => {
		// 	if(eventName !== CMDS.SOCKET.FACE_DETECTED){
		// 		console.log(`Received event ${eventName}`, args)
		// 	}
		// });
		socket.current.on(CMDS.SOCKET.RTC_COMMUNICATION, (data) => {
			if(data.bridge != CMDS.RTC.ACTIONS.MESSAGE){
				setBridge(data.bridge);
			}
			RTCManager.handleRTCCommunication(data);
		})
		socket.current.on(CMDS.SOCKET.CONNECT_ERROR, (err) => {
		  console.log(`connect_error due to ${err.message}`);
		});
		socket.current.on(CMDS.SOCKET.ROOM_IDLE, () => resetParams());
		socket.current.on(CMDS.SOCKET.SURVEY_START, (data) => onSurveyStart(data));
		socket.current.on(CMDS.SOCKET.FACE_DETECTED, () => setFaceOn(true));
      socket.current.on(CMDS.SOCKET.SESSION_UPDATE, (data) => onSessionUpdate(data));
		// socket.current.on(CMDS.SOCKET.PROCESS_START, () => onProcessStart());
		socket.current.on(CMDS.SOCKET.ROOM_UPDATE, (data) => onRoomUpdate(data));
		socket.current.on(CMDS.SOCKET.USER_UPDATE, (data) => onUserUpdate(data));
		// socket.on(CMDS.SOCKET.PROCESS_STOP, (data) => onProcessStop(data));
		socket.current.on(CMDS.SOCKET.RESET, () => resetParams());

		socket.current.on(CMDS.SOCKET.MESSAGE, (data) => RTCManager.onMessage(data));
		socket.current.on(CMDS.SOCKET.CONTROL, (data) => RTCManager.onControl(data));
		// setSocket(socket);
		if(!useJoinForm){
		// CHANGE THIS TO IMMEDIATELY JOIN THE ROOM
    		socket.current.emit(CMDS.SOCKET.JOIN_ROOM);
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

	 useEffect(() => {
		if(bridge == null) return;
		console.log("RTC: Bridge Updated",bridge);
		if(bridge == "none"){
			TOASTS.WAITING.show();
			return;
		}
		TOASTS.WAITING.dismiss();
		if(bridge == CMDS.RTC.ACTIONS.HOST_APPROVAL_REQUEST){
			TOASTS.JOIN_REQUEST.show({onAction: onJoinRequestAnswer});
		} else if(bridge == CMDS.RTC.STATUS.PENDING_APPROVAL){
			TOASTS.PENDING_APPROVAL.show();
		} else{
			TOASTS.PENDING_APPROVAL.dismiss();
		}
	}, [bridge])

	return (
		<div className='main-room'>
		<Toolbar 
			socket={socket}
			onSkipClicked={() => {
				setStageData((prev) => ({...prev, reason: "Skip clicked", state: STAGE.STATUS.COMPLETED, data: null}));
			}}
			onTimerEnd={() => {
				setStageData((prev) => ({...prev, reason: "time limit reached", state: STAGE.STATUS.COMPLETED, data: null}));
				console.log("STAGE COMPLETED (time limit reached)");
				socket.current.emit(CMDS.SOCKET.STEP_COMPLETED);
			}}
			prompt={prompt}
			stageData={stageData}
			userData={userData}
			roomData={roomData}
		/>
			
		<div className={`main-call-container ${bridge}`}>
			{/* <TestComponent index={0} user={user} />
			<TestComponent index={1} user={user}/> */}
			<div className='main-room-container' style={{display: `${stageData.type == STAGE.TYPE.VIDEO_CHAT ? 'block' : 'none'}`}}>
			<VideoContainer
				recordingEnabled={true}
				stageData={stageData}
				userData={userData}
				socket={socket}
				onStreamAdded={() => {
					setBridge(CMDS.RTC.STATUS.ESTABLISHED)
				}}
				onRemotePlay={() => {
					sessionMap.session.start();
					setStageData((prev) => ({...prev, reason: "time limit reached", state: STAGE.STATUS.IN_PROGRESS}));
				}}
				connectionStatus={connectionStatus}
				rtcManager={RTCManager}
				faceProcessor={faceProcessor} />
			</div>
			 <Introduction
			 stageData={stageData}
			 useJoinForm={useJoinForm}
			 onUsernameFormSubmit={(name) => {
				console.log(`New user ${name}, stage state: ${stageData}`)
				if(stageData.state == STAGE.STATUS.NONE){
					socket.current.emit(CMDS.SOCKET.JOIN_ROOM, {name: name});
				}
			 }}/>
			 <ToastCommunications />
			<div style={{display: `${stageData.type == STAGE.TYPE.VIDEO_CHAT ? 'none' : 'block'}`}}>
			{currentSurvey != null && <Survey className={`survey-container ${stageData.type}`} model={currentSurvey} /> }
			</div>
		</div>
		</div>
	);
}
