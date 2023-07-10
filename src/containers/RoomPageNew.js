import React, { useEffect, useState, useRef } from "react";
import io from "socket.io-client";
import MediaContainer from "./MediaContainer";
import CommunicationContainer from "./CommunicationContainer";
import "survey-react/survey.css";
import { SOCKET_CMDS, DATA_TYPES, NAMESPACES } from "../managers/SocketCommands";
import 'react-toastify/dist/ReactToastify.css';
import SurveyComponent from "../components/SurveyComponent";
import {TimedEvent} from "../components/TimedEvent";
import Sidebar from "../components/Sidebar";
import WebRTCManager from "../components/RTCManager"

export default function RoomPageNew(props) {
	const session = new TimedEvent("MainSession");
	const stageType = "video-chat";
	const side_prompt = "";
	const user_role = "";
	const bridge = "";
	const survey = false;
	const user = "";
	const socket = useRef(null);
  const RTCManager = useRef(null)
  const [RTCStatus, setRTCStatus] = useState({bridge: "none", data: {}});

	const setupSocket = (socketRef) => {
    const socket = socketRef.current;
		// socket.emit(SOCKET_CMDS.SURVEY_CONNECT, {
		// 	room: room,
		// 	user: user,
		// });
    socket.on(SOCKET_CMDS.RTC_COMMUNICATION, (data) => {
      RTCManager.current.handleRTCCommunication(data);
    })
		socket.on(SOCKET_CMDS.ROOM_IDLE, () => resetParams());
		socket.on(SOCKET_CMDS.SURVEY_START, (data) => onSurveyStart(data));
		socket.on(SOCKET_CMDS.FACE_DETECTED, () => setFaceOn(true));
		socket.on(SOCKET_CMDS.PROCESS_START, () => onProcessStart());
		// socket.on(SOCKET_CMDS.PROCESS_STOP, (data) => onProcessStop(data));
		socket.on(SOCKET_CMDS.RESET, () => resetParams());

		socket.on(SOCKET_CMDS.MESSAGE, (data) => onMessage(data));
		socket.on(SOCKET_CMDS.CONTROL, (data) => onControl(data));
		// setSocket(socket);
	};

	useEffect(() => {
		socket.current = io.connect(`/${NAMESPACES.CHAT}`);
		console.log(`Created Socket: `,socket.current);
    RTCManager.current = new WebRTCManager(socket);
		setupSocket(socket);
    socket.current.emit(SOCKET_CMDS.JOIN_ROOM);
	}, []);

  useEffect(() => {
    console.log("New RTCStatus", RTCStatus);
  }, [RTCStatus])

	return (
		<div class={`main-call-container ${RTCStatus.bridge} stage-${RTCStatus.stageType}`}>
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
		</div>
	);
}
