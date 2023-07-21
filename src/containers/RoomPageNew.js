import React, { useEffect, useState, useRef, useContext, useReducer, useCallback } from "react";
import io from "socket.io-client";
import "survey-react/survey.css";
import { CMDS, DATA} from "../managers/Definitions.js";
import Sidebar from "../components/Sidebar.js";
import WebRTCManager from "../classes/RTCManager.js"
import 'react-toastify/dist/ReactToastify.css';
import { ToastCommunications, TOASTS } from "../components/ToastCommunications.js";
import { SessionProvider, SessionContext } from "../classes/Session.js";
import TestComponent from "../components/SessionContextUpdateExample.js"
import VideoContainer from "../classes/VideoContainer.js";
import FaceProcessor from "../classes/FaceProcessor.js";
import { STAGE } from "../managers/Definitions.js"
import { Model } from "survey-core";
import { Survey } from "survey-react-ui";
import "survey-core/defaultV2.min.css";
// import "../surveyStyle";
import Introduction from "../components/Introduction.js";
import SURVEYS from "../../assets/PostChatSurvey.js";
// import { createRequire } from "module";
// const require = createRequire(import.meta.url);
// var SURVEYS = require("../../assets/PostChatSurvey.js");

export default function RoomPageNew(props) {
	const sessionMap = useContext(SessionContext);
	return (
		<SessionProvider>
			<RoomPage {...props}/>
		</SessionProvider>
	);
}


function RoomPage(props) {
	const sessionMap = useContext(SessionContext);
	const useJoinForm = props.useJoinForm ?? true;
	const [faceProcessor, setFaceProcessor] = useState(null);
	const socket = useRef(null);
	const [prompt, setPrompt] = useState("Waiting for your conversation partner to join the call...")
	const [RTCManager, setRTCManager] = useState(null)
	const [connectionStatus, setConnectionStatus] = useState("none")
	const [bridge, setBridge] = useState("none");
	const [stageState, setStageState] = useState({reason: "", state: STAGE.STATUS.NONE});
	const [stageType, setStageType] = useState(STAGE.TYPE.VIDEO_CHAT);

	// For some reason survey-react will re-render when the onComplete() contains a setState() call. So I had to write this workaround
	// Where I only set the onComplete() callback on the first page render, this seems to do the trick (probably because of memoization?!)
	const surveyModel = useRef(null)

	useEffect(() => {
		// if(surveyModel.current == null){
		// 	surveyModel.current = new Model(SURVEYS.POST_VIDEO_CHAT);
		// 	surveyModel.current = new Model(SURVEYS.TEST);
		// 	surveyModel.current.onComplete.add((sender, options) => {
		// 		console.log(JSON.stringify(sender.data, null, 3));
		// 		setStageState({reason: "", surveyData: sender.data, state: STAGE.STATUS.COMPLETED});
		// 	})
		// 	surveyModel.current.onAfterRenderSurvey.add(() => {console.log("SURVEY RENDERED")});
		// }
	}, [])


	useEffect(() => {
		if(stageState.state == STAGE.STATUS.NONE){
			setPrompt("Waiting for your conversation partner to join the call...");
			// TOASTS.TEST.show({onAction: (res) => console.log("Toast clicked! " +res)})
			return;
		}
		if(stageState.state == STAGE.STATUS.COMPLETED){
			console.log(`STAGE COMPLETED (${stageState.reason})`);
			const sessionData = sessionMap.session.getSessionData();
			let baseFilename = `YFIM_SURVEY_${sessionMap.session.user?.name}_${sessionData.date}.json`;
			const completionData = {data: sessionData};
			if(stageType == STAGE.TYPE.SURVEY){
				if(stageState.surveyData != null && stageState.surveyData != undefined){
					completionData.data.survey = stageState.surveyData;
				}
				completionData.filename = baseFilename;
				// setPrompt("Waiting for your conversation partner to complete the survey...");
			}
			socket.current.emit(CMDS.SOCKET.STEP_COMPLETED, completionData);
			return;
		}
		if(stageState.state == STAGE.STATUS.IN_PROGRESS){
			if(stageType == STAGE.TYPE.SURVEY){
				// setPrompt("We have some questions for you...");
			}
			else if(stageType == STAGE.TYPE.VIDEO_CHAT){
				const newPrompt = sessionMap.session.data?.stage?.step?.prompt;
				if(newPrompt != null && newPrompt != undefined){
					setPrompt(newPrompt);
				}
			}
			return;
		}
	}, [stageState])

	useEffect(() => {
		console.log("NEW PROMPT ", prompt)
	}, [prompt])
	

	const onRoomUpdate = (data) => {
		if(sessionMap.session?.user?.role != data?.user?.role){
			if(data?.user?.role?.toLowerCase() == 'host'){
				TOASTS.NEW_ROLE.show({role:data?.user?.role});
			}
		}
		console.log(`Updated user Role ${data?.user?.role}`)
		sessionMap.updateUser(data);
	}

	const onSessionUpdate = (data) => {
		console.log("Session update");
		sessionMap.updateSession(data);
		sessionMap.session.start();
		setStageType(sessionMap.session.data?.stage?.step?.type);
		setStageState({reason: "", state: STAGE.STATUS.IN_PROGRESS});

		const surveyId = SURVEYS[sessionMap.session.data?.stage?.step?.surveyId] ?? null;
		console.log("SURVEY ID", surveyId)
		if(surveyModel.current != null){
			if(surveyId != null && surveyModel.current.surveyId == surveyId.surveyId){
				surveyModel.current.clear();
				surveyModel.current.render();
				return;
			}
		}
		try{
			surveyModel.current = new Model(SURVEYS[surveyId.id].model);
			surveyModel.current.onComplete.add((sender, options) => {
				console.log(JSON.stringify(sender.data, null, 3));
				setStageState({reason: "", surveyData: sender.data, state: STAGE.STATUS.COMPLETED});
			})
			surveyModel.current.onAfterRenderSurvey.add(() => {console.log("SURVEY RENDERED")});
		}
		catch(error){
			console.warn(`Could not find survey with ID ${surveyId}`);
		}
	}

	const onInvitationAnswer = (answer) => {
		console.log("Invitation answer");
		if(RTCManager.lastUserIdRequest != null){
			console.log(`Emitting Invitation accept ${RTCManager.lastUserIdRequest}`)
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
			setBridge(data.bridge);
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
		console.log(`NEW STAGE TYPE: ${stageType}`)
	}, [stageType])


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
		console.log("New bridge", bridge);
		if(bridge == "none"){
			TOASTS.WAITING.show();
			return;
		}
		TOASTS.WAITING.dismiss();
		if(bridge == CMDS.RTC.ACTIONS.HOST_APPROVAL_REQUEST){
			TOASTS.JOIN_REQUEST.show({onAction: onInvitationAnswer});
		} else if(bridge == CMDS.RTC.STATUS.PENDING_APPROVAL){
			TOASTS.PENDING_APPROVAL.show();
		} else{
			TOASTS.PENDING_APPROVAL.dismiss();
		}
	}, [bridge])

	return (
		<>
		<Sidebar 
			socket={socket}
			onSkipClicked={() => {
				setStageState({reason: "Skip clicked", state: STAGE.STATUS.COMPLETED});
			}}
			onTimerEnd={() => {
				setStageState({reason: "time limit reached", state: STAGE.STATUS.COMPLETED});
				console.log("STAGE COMPLETED (time limit reached)");
				socket.current.emit(CMDS.SOCKET.STEP_COMPLETED);
			}}
			prompt={prompt}
			stageState={stageState}
		/>
			
		<div className={`main-call-container ${bridge}`}>
			{/* <TestComponent index={0} user={user} />
			<TestComponent index={1} user={user}/> */}
			<div className='main-room-container' style={{display: `${stageType == STAGE.TYPE.VIDEO_CHAT ? 'block' : 'none'}`}}>
			<VideoContainer
				stageState={stageState}
				socket={socket}
				onStreamAdded={() => {
					setBridge(CMDS.RTC.STATUS.ESTABLISHED)
				}}
				onRemotePlay={() => {
					sessionMap.session.start();
					setStageState({reason: "", state: STAGE.STATUS.IN_PROGRESS});
				}}
				connectionStatus={connectionStatus}
				rtcManager={RTCManager}
				faceProcessor={faceProcessor} />
			</div>
			 <Introduction
			 stageState={stageState}
			 useJoinForm={useJoinForm}
			 onUsernameFormSubmit={(name) => {
				console.log(`New user ${name}, state: ${stageState}`)
				if(stageState.state == STAGE.STATUS.NONE){
					socket.current.emit(CMDS.SOCKET.JOIN_ROOM, {name: name});
				}
			 }}/>
			 <ToastCommunications />
    
			{/* <MediaContainer
				room={this.props.match.params.room}
				roomPage={this}
				session={this.state.session}
				media={(media) => (this.media = media)}
				socket={this.socket}
				getUserMedia={this.getUserMedia}
				username={this.props.match.params.room}
			/>*/}
			<div style={{display: `${stageType == STAGE.TYPE.VIDEO_CHAT ? 'none' : 'block'}`}}>
			{surveyModel.current != null &&  <Survey className="survey-container" model={surveyModel.current} /> }
			</div>
			{/* <CommunicationContainer socket={socket} RTCManager={RTCManager} /> */}

			{/* <Communication
				// {...state}
				toggleVideo={() => console.log("Toggle Video")}
				toggleAudio={() => console.log("Toggle Audio")}
				send={() => send()}
				handleInput={(e) => handleInput(e)}
				handleInvitation={(e) => handleInvitation(e)}
			/> */}
		</div>
		</>
	);
}
