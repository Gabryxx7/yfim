import React, { useEffect, useState, useRef } from "react";
import io from "socket.io-client";
import MediaContainer from "./MediaContainer";
import CommunicationContainer from "./CommunicationContainer";
import "survey-react/survey.css";
import { CMDS, DATA} from "../managers/Communications";
import 'react-toastify/dist/ReactToastify.css';
import SurveyComponent from "../components/SurveyComponent";
import {TimedEvent} from "../components/TimedEvent";
import Sidebar from "../components/Sidebar";
import WebRTCManager from "../components/RTCManager"
import Communication from "../components/Communication";

export default function RoomPageNew(props) {
	const session = new TimedEvent("MainSession");
	const stageType = "video-chat";
	const side_prompt = "";
	const user_role = "";
	const survey = false;
	const user = "";
	const socket = useRef(null);
	const RTCManager = useRef(null)
	const [RTCStatus, setRTCStatus] = useState({bridge: "none", data: {}});
	const [bridge, setBridge] = useState(null);

	const setupSocket = (socketRef) => {
    const socket = socketRef.current;
		// socket.emit(CMDS.SOCKET.SURVEY_CONNECT, {
		// 	room: room,
		// 	user: user,
		// });
		// socket.onAny((eventName, ...args) => {
		// 	if(eventName !== CMDS.SOCKET.FACE_DETECTED){
		// 		console.log(`Received event ${eventName}`, args)
		// 	}
		// });
		socket.on(CMDS.SOCKET.RTC_COMMUNICATION, (data) => {
			setBridge(data.bridge);
			RTCManager.current.handleRTCCommunication(data);
		})
		socket.on(CMDS.SOCKET.CONNECT_ERROR, (err) => {
		  console.log(`connect_error due to ${err.message}`);
		});
		socket.on(CMDS.SOCKET.ROOM_IDLE, () => resetParams());
		socket.on(CMDS.SOCKET.SURVEY_START, (data) => onSurveyStart(data));
		socket.on(CMDS.SOCKET.FACE_DETECTED, () => setFaceOn(true));
		socket.on(CMDS.SOCKET.PROCESS_START, () => onProcessStart());
		socket.on(CMDS.SOCKET.ROOM_UPDATE, (data) => onRoomUpdate(data));
		// socket.on(CMDS.SOCKET.PROCESS_STOP, (data) => onProcessStop(data));
		socket.on(CMDS.SOCKET.RESET, () => resetParams());

		socket.on(CMDS.SOCKET.MESSAGE, (data) => onMessage(data));
		socket.on(CMDS.SOCKET.CONTROL, (data) => onControl(data));
		// setSocket(socket);
	};

	const onRoomUpdate = (data) => {
		console.log(`Updated user Role ${data?.user?.role}`)
      // this.props.setRoomData(data);
	}

	const handleInvitation = (e) => {
		e.preventDefault();
		if(RTCManager.current.autoacceptTimer != null) clearTimeout(RTCManager.current.autoacceptTimer);
		if(RTCManager.current.lastUserIdRequest != null){
			console.log(`Emitting Invitation accept ${RTCManager.current.lastUserIdRequest}`)
			socket.current.emit(CMDS.SOCKET.RTC_COMMUNICATION, {bridge: CMDS.RTC.ACTIONS.ACCEPT_JOIN_REQUEST, userId: RTCManager.current.lastUserIdRequest});
			RTCManager.current.lastUserIdRequest = null;
		}
		// socketRef.current.emit(e.target.dataset.ref, state.sid); // I'm not sure why so many emit() calls had an array [cmd] as command
		setBridge(CMDS.RTC.STATUS.CONNECTING)
	 }

	useEffect(() => {
		socket.current = io.connect(`/${CMDS.NAMESPACES.CHAT}`);
		console.log(`Created Socket: `,socket.current);
    	RTCManager.current = new WebRTCManager(socket);
		setupSocket(socket);
    	socket.current.emit(CMDS.SOCKET.JOIN_ROOM);
	}, []);

	useEffect(() => {
		console.log("New RTCStatus", RTCStatus);
	 }, [RTCStatus])


	useEffect(() => {
		if(bridge == null) return;
		console.log("New bridge", bridge);
	}, [bridge])

	return (
		<div class={`main-call-container ${bridge} stage-${RTCStatus.stageType}`}>
			{/* <Sidebar state={this.state} /> */}
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
