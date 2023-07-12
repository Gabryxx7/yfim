import React, { useEffect, useState, useRef, useContext, useReducer, useCallback } from "react";
import io from "socket.io-client";
import MediaContainer from "./MediaContainer";
import CommunicationContainer from "./CommunicationContainer";
import "survey-react/survey.css";
import { CMDS, DATA} from "../managers/Communications";
import { ToastContainer, toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import SurveyComponent from "../components/SurveyComponent";
import Sidebar from "../components/Sidebar";
import WebRTCManager from "../classes/RTCManager"
import { ToastCommunications, InvitationMsg, WaitingMsg, NewRoleMsg, PendingApprovalMsg } from "../components/ToastCommunications";
import { SessionProvider, SessionContext } from "../classes/Session";
import TestComponent from "../components/SessionContextUpdateExample"
import VideoContainer from "../classes/VideoContainer";



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
	const [user, setUser] = useState({});
	const socket = useRef(null);
	const waitingMsgId = useRef(null);
	const [RTCManager, setRTCManager] = useState(null)
	const [RTCStatus, setRTCStatus] = useState({bridge: "none", data: {}});
	const [bridge, setBridge] = useState("none");

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
		setUser(sessionMap.session.user)
	}

	const onInvitationAnswer = (answer) => {
		console.log("Invitation answer");
		if(RTCManager.autoacceptTimer != null) clearTimeout(RTCManager.autoacceptTimer);
		if(RTCManager.lastUserIdRequest != null){
			console.log(`Emitting Invitation accept ${RTCManager.lastUserIdRequest}`)
			socket.current.emit(CMDS.SOCKET.RTC_COMMUNICATION, {bridge: CMDS.RTC.ACTIONS.ACCEPT_JOIN_REQUEST, userId: RTCManager.lastUserIdRequest});
			RTCManager.lastUserIdRequest = null;
		}
		// socketRef.current.emit(e.target.dataset.ref, state.sid); // I'm not sure why so many emit() calls had an array [cmd] as command
		setBridge(CMDS.RTC.STATUS.CONNECTING)
	 }

	 useEffect(() => {
		socket.current = io.connect(`/${CMDS.NAMESPACES.CHAT}`);
		console.log(`Created Socket: `,socket.current);
    	setRTCManager(new WebRTCManager(socket, sessionMap));
	}, []);


	useEffect(() => {
	}, [user]);

	useEffect(() => {
		if(RTCManager == null) return;
		// socket.emit(CMDS.SOCKET.SURVEY_CONNECT, {
		// 	room: room,
		// 	user: user,
		// });
		// socket.onAny((eventName, ...args) => {
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
		socket.current.on(CMDS.SOCKET.PROCESS_START, () => onProcessStart());
		socket.current.on(CMDS.SOCKET.ROOM_UPDATE, (data) => onRoomUpdate(data));
		// socket.on(CMDS.SOCKET.PROCESS_STOP, (data) => onProcessStop(data));
		socket.current.on(CMDS.SOCKET.RESET, () => resetParams());

		socket.current.on(CMDS.SOCKET.MESSAGE, (data) => RTCManager.onMessage(data));
		socket.current.on(CMDS.SOCKET.CONTROL, (data) => RTCManager.onControl(data));
		// setSocket(socket);
    	socket.current.emit(CMDS.SOCKET.JOIN_ROOM);
	}, [RTCManager])

	useEffect(() => {
		console.log("New RTCStatus", RTCStatus);
	 }, [RTCStatus])


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
		<div class={`main-call-container ${bridge} stage-${RTCStatus.stageType}`}>
			{/* <TestComponent index={0} user={user} />
			<TestComponent index={1} user={user}/> */}
			<Sidebar />
			<VideoContainer socket={socket} setBridge={setBridge} rtcManager={RTCManager} />
			 <button onClick={() => toast(<InvitationMsg onInvitationAnswer={onInvitationAnswer}/>)}>Notify!</button>
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
			<SurveyComponent /> 
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
