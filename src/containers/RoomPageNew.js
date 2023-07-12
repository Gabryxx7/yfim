import React, { useEffect, useState, useRef, useContext, useReducer, useCallback } from "react";
import io from "socket.io-client";
import MediaContainer from "./MediaContainer";
import CommunicationContainer from "./CommunicationContainer";
import "survey-react/survey.css";
import { CMDS, DATA} from "../managers/Communications";
import 'react-toastify/dist/ReactToastify.css';
import SurveyComponent from "../components/SurveyComponent";
import Sidebar from "../components/Sidebar";
import WebRTCManager from "../classes/RTCManager"
import Communication from "../components/Communication";
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
	const [RTCManager, setRTCManager] = useState(null)
	const [RTCStatus, setRTCStatus] = useState({bridge: "none", data: {}});
	const [bridge, setBridge] = useState(null);

	const onRoomUpdate = (data) => {		
		console.log(`Updated user Role ${data?.user?.role}`)
		sessionMap.updateUser(data);
		setUser(sessionMap.session.user)
	}

	const handleInvitation = (e) => {
		e.preventDefault();
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
	}, [bridge])

	return (
		<div class={`main-call-container ${bridge} stage-${RTCStatus.stageType}`}>
			<TestComponent index={0} user={user} />
			<TestComponent index={1} user={user}/>
			<Sidebar />
			<VideoContainer socket={socket} setBridge={setBridge} rtcManager={RTCManager} />
			{/* <button onClick={notify}>Notify!</button>
    <ToastContainer
        position="bottom-right"
        autoClose={100000}
        hideProgressBar={false}
        newestOnTop={false}
        closeOnClick
        rtl={false}
        pauseOnFocusLoss
        draggable
        pauseOnHover
        theme="colored"/> */}
			{/* <MediaContainer
				room={this.props.match.params.room}
				roomPage={this}
				session={this.state.session}
				media={(media) => (this.media = media)}
				socket={this.socket}
				getUserMedia={this.getUserMedia}
				username={this.props.match.params.room}
			/>
			<SurveyComponent /> */}
			{/* <CommunicationContainer socket={socket} RTCManager={RTCManager} /> */}

			<Communication
				// {...state}
				toggleVideo={() => console.log("Toggle Video")}
				toggleAudio={() => console.log("Toggle Audio")}
				send={() => send()}
				handleInput={(e) => handleInput(e)}
				handleInvitation={(e) => handleInvitation(e)}
			/>
		</div>
	);
}
