import React, { useEffect, useState, useRef, useContext, useReducer, useCallback } from "react";
import io from "socket.io-client";
import "survey-react/survey.css";
import { CMDS, DATA} from "../managers/Definitions.js";
import 'react-toastify/dist/ReactToastify.css';
import { ToastCommunications, TOASTS } from "../components/ToastCommunications.js";
import { SessionProvider, SessionContext } from "../classes/ClientSession.js";
import { STAGE } from "../managers/Definitions.js"
import RoomControlPanel from "./RoomControlPanel.js";

export default function ControlRoom(props) {
	const sessionMap = useContext(SessionContext);
	const useJoinForm = props.useJoinForm ?? true;
	const chatSocket = useRef(null);
	const controlSocket = useRef(null);
	const [connectionStatus, setConnectionStatus] = useState("none")
	const [bridge, setBridge] = useState("none");
	const [stageState, setStageState] = useState({reason: "", state: STAGE.STATUS.NONE});
	const [stageType, setStageType] = useState(STAGE.TYPE.VIDEO_CHAT);
	const [userData, setUserData] = useState({});
	const [roomsData, setRoomsData] = useState({});
	const [stageData, setStageData] = useState({});

   useEffect(() => {
		// controlSocket.current = io.connect(`/${CMDS.NAMESPACES.CHAT}`);
		controlSocket.current = io.connect(`/${CMDS.NAMESPACES.CONTROL}`);
		console.log(`Created Socket: `,controlSocket.current);
      
		controlSocket.current.on(CMDS.SOCKET.RTC_COMMUNICATION, (data) => {
			if(data.bridge != CMDS.RTC.ACTIONS.MESSAGE){
				setBridge(data.bridge);
			}
		})

		// controlSocket.current.onAny((eventName, ...args) => {
		// 	if(eventName !== CMDS.SOCKET.FACE_DETECTED){
		// 		console.log(`Received event ${eventName}`, args)
		// 	}
		// });

		controlSocket.current.on(CMDS.SOCKET.CONNECT, (data) => {
			console.log("Control Socket connected");
		})
		controlSocket.current.on(CMDS.SOCKET.CONNECT_ERROR, (err) => {
		  console.log(`connect_error due to ${err.message}`);
		});
		controlSocket.current.on(CMDS.SOCKET.ROOM_IDLE, () => resetParams());
		controlSocket.current.on(CMDS.SOCKET.SURVEY_START, (data) => onSurveyStart(data));
		controlSocket.current.on(CMDS.SOCKET.FACE_DETECTED, () => setFaceOn(true));
      controlSocket.current.on(CMDS.SOCKET.SESSION_UPDATE, (data) => onSessionUpdate(data));
		// controlSocket.current.on(CMDS.SOCKET.PROCESS_START, () => onProcessStart());
		controlSocket.current.on(CMDS.SOCKET.ROOM_UPDATE, (data) => onRoomUpdate(data));
		controlSocket.current.on(CMDS.SOCKET.USER_UPDATE, (data) => onUserUpdate(data));
		// socket.on(CMDS.SOCKET.PROCESS_STOP, (data) => onProcessStop(data));
		controlSocket.current.on(CMDS.SOCKET.RESET, () => resetParams());

		// controlSocket.current.on(CMDS.SOCKET.MESSAGE, (data) => RTCManager.onMessage(data));
		// controlSocket.current.on(CMDS.SOCKET.CONTROL, (data) => RTCManager.onControl(data));
		// setSocket(socket);
		if(!useJoinForm){
		// CHANGE THIS TO IMMEDIATELY JOIN THE ROOM
    		controlSocket.current.emit(CMDS.SOCKET.JOIN_ROOM);
		}
	}, [])

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

	const onRoomUpdate = (room) => {
		console.log("Room Update ", room);
		setRoomsData((rooms) => {
			rooms[room.id] = room;
			return {...rooms};
		});
	}

	const onSessionUpdate = (data) => {
		console.log("Session update", data);
		if(data?.rooms){
			setRoomsData(data.rooms);
		} else if(data?.sessionId) {
			setRoomsData((rooms) => {
				rooms[data.room].session = data;
				return {...rooms};
			});
		}
	}

   return(
      <div className="control-room">
			<div className="rooms-list">
				{Object.entries(roomsData).map(([key, room]) => <RoomControlPanel key={room.id} room={room}/>)}
			</div>
      </div>
   )
}