import React, { useEffect, useState, useRef, useContext, useReducer, useCallback } from "react";
import io from "socket.io-client";
import "survey-react/survey.css";
import { CMDS, DATA} from "../managers/Definitions";
import Sidebar from "../components/Sidebar";
import WebRTCManager from "../classes/RTCManager"
import {  toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import { ToastCommunications, InvitationMsg, WaitingMsg, NewRoleMsg, PendingApprovalMsg } from "../components/ToastCommunications";
import { SessionProvider, SessionContext } from "../classes/Session";
import TestComponent from "../components/SessionContextUpdateExample"
import VideoContainer from "../classes/VideoContainer";
import FaceProcessor from "../classes/FaceProcessor";
import { STAGE } from "../managers/Definitions"
import { Model } from "survey-core";
import { Survey } from "survey-react-ui";
import "survey-core/defaultV2.min.css";
import "../survey.scss";
import Introduction from "../components/Introduction";

const { PostChatSurvey, TestSurvey } = require("../../assets/PostChatSurvey");

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
	const [faceProcessor, setFaceProcessor] = useState(null);
	const socket = useRef(null);
	const [prompt, setPrompt] = useState("Waiting for your conversation partner to join the call...")
	const [RTCManager, setRTCManager] = useState(null)
	const [connectionStatus, setConnectionStatus] = useState("none")
	const [bridge, setBridge] = useState("none");
	const [stageState, setStageState] = useState(STAGE.STATUS.NONE);
	const [stageType, setStageType] = useState(STAGE.TYPE.VIDEO_CHAT);

	// For some reason survey-react will re-render when the onComplete() contains a setState() call. So I had to write this workaround
	// Where I only set the onComplete() callback on the first page render, this seems to do the trick (probably because of memoization?!)
	const surveyModel = useRef(null)

	useEffect(() => {
		if(surveyModel.current == null){
			// surveyModel.current = new Model(PostChatSurvey);
			surveyModel.current = new Model(TestSurvey);
			surveyModel.current.onComplete.add((sender, options) => {
				console.log(JSON.stringify(sender.data, null, 3));
				setStageState(STAGE.STATUS.COMPLETED);
				console.log("STAGE COMPLETED (event)");
				socket.current.emit(CMDS.SOCKET.STAGE_COMPLETED);
			})
			surveyModel.current.onAfterRenderSurvey.add(() => {console.log("SURVEY RENDERED")});
		}
	}, [])


	useEffect(() => {
		if(stageState == STAGE.STATUS.NONE){
			setPrompt("Waiting for your conversation partner to join the call...");
			return;
		}
		if(stageState == STAGE.STATUS.COMPLETED){
			if(stageType == STAGE.TYPE.SURVEY){
				setPrompt("Waiting for your conversation partner to complete the survey...");
			}
			return;
		}
		if(stageState == STAGE.STATUS.IN_PROGRESS){
			if(stageType == STAGE.TYPE.SURVEY){
				setPrompt("We have some questions for you...");
			}
			else if(stageType == STAGE.TYPE.VIDEO_CHAT){
				const newPrompt = sessionMap.session.data?.stage?.step?.topic;
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
				toast.info(<NewRoleMsg role={data?.user?.role}/>, {
					autoClose: 3000,
					toastId: "newRoleToast"
				})
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
		setStageState(STAGE.STATUS.IN_PROGRESS);

		if(surveyModel.current != null){
			surveyModel.current.clear();
			surveyModel.current.render();
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
    	socket.current.emit(CMDS.SOCKET.JOIN_ROOM);
	}, [RTCManager])

	useEffect(() => {
		console.log(`NEW STAGE TYPE: ${stageType}`)
	}, [stageType])


	useEffect(() => {
		// console.log("connectionStatus ", connectionStatus)
		if(connectionStatus == "connected"){
			toast(<div className="toast-msg">A user joined the room!</div>, {
				type: "success",
				toastId: "userJoined",
				autoClose: 5000
			});
		}
		else if(connectionStatus == "disconnected"){
			toast(<div className="toast-msg">A user left the room!</div>, {
				type: "error",
				toastId: "userLeft",
				autoClose: 5000
			});
		}
	}, [connectionStatus]);

	 useEffect(() => {
		if(bridge == null) return;
		console.log("New bridge", bridge);
		if(bridge == "none"){
			toast.loading(<WaitingMsg />, {
				toastId: "waiting"
			});
			return;
		}
		toast.dismiss("waiting");
		if(bridge == CMDS.RTC.ACTIONS.HOST_APPROVAL_REQUEST){
			toast.warn(<InvitationMsg onInvitationAnswer={onInvitationAnswer}/>, {
				toastId: "peerRequestId"
			});
		} else if(bridge == CMDS.RTC.STATUS.PENDING_APPROVAL){
			toast.info(<PendingApprovalMsg />, {
				toastId: "pendingApproval"
			});
		} else{
			toast.dismiss("pendingApproval");
		}
	}, [bridge])

	return (
		<div class={`main-call-container ${bridge}`}>
			{/* <TestComponent index={0} user={user} />
			<TestComponent index={1} user={user}/> */}
			<Sidebar 
				onTimerEnd={() => {
					setStageState(STAGE.STATUS.COMPLETED)
					console.log("STAGE COMPLETED (time limit reached)");
					socket.current.emit(CMDS.SOCKET.STAGE_COMPLETED);
				}}
				prompt={prompt}
  				stageState={stageState}
			/>
			<div style={{display: `${stageType == STAGE.TYPE.VIDEO_CHAT ? 'block' : 'none'}`}}>
			<VideoContainer
				socket={socket}
				onStreamAdded={() => {
					setBridge(CMDS.RTC.STATUS.ESTABLISHED)
				}}
				onRemotePlay={() => {
					sessionMap.session.start();
					setStageState(STAGE.STATUS.IN_PROGRESS);
				}}
				connectionStatus={connectionStatus}
				rtcManager={RTCManager}
				faceProcessor={faceProcessor} />
			</div>
			 <Introduction stageState={stageState}/>
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
	);
}
