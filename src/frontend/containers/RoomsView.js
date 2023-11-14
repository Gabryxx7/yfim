import React, { useEffect, useState, useRef, useContext } from "react";
import io from "socket.io-client";
import "survey-react/survey.css";
import { CMDS } from "../../backend/Definitions.js";
import 'react-toastify/dist/ReactToastify.css';
import { ToastCommunications, TOASTS } from "../components/ToastCommunications.js";
import { AppProvider, AppContext } from '../../context/AppContext.js';
import { STAGE } from "../../backend/Definitions.js"
import RoomControlPanel from "../components/Controls/RoomControlPanel.js";
import SettingsPanel from "../components/Controls/SettingsPanel.js";
import { useSocket } from "../../context";


/**
 * 
 * @param {*} rooms Just a dictionary (object) of rooms, the index is the roomID
 * @param {*} data Whatever data we are trying to update
 * @param {*} key The key of the data field we want to update. If this is null, we assume that "data" is just the whole room data to be replaces
 * @returns 
 */
const updateRoomData = (rooms, data=null, key=null) => {
	if(data != null){
		if(key == null){
			key = data.id;
		}
		rooms[key] = data;
	}
	return {...rooms}; // Remember to return a new object or it won't trigger any change/update
}

export default function RoomsView(props) {
	const sessionMap = useContext(AppContext);
	const socket = useSocket(CMDS.NAMESPACES.CONTROL);
	const [stageData, setStageData] = useState({reason: "", state: STAGE.STATUS.NONE, type: STAGE.TYPE.NONE, data: null});
	const [userData, setUserData] = useState({});
	const [roomsData, setRoomsData] = useState({});

   useEffect(() => {
      if(!socket) return;      
      socket.emit(CMDS.SOCKET.CONTROL_ROOM)
		socket.on(CMDS.SOCKET.ROOM_IDLE, () => resetParams());
		socket.on(CMDS.SOCKET.SURVEY_START, (data) => onSurveyStart(data));
		socket.on(CMDS.SOCKET.FACE_DETECTED, () => setFaceOn(true));
      socket.on(CMDS.SOCKET.SESSION_UPDATE, (data) => onSessionUpdate(data));
		socket.on(CMDS.SOCKET.ROOM_UPDATE, (data) => onRoomUpdate(data));
		socket.on(CMDS.SOCKET.USER_UPDATE, (data) => onUserUpdate(data));
		socket.on(CMDS.SOCKET.RESET, () => resetParams());
	}, [socket])

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
		setRoomsData((rooms) => updateRoomData(rooms, room));
	}

	const onSessionUpdate = (data) => {
		console.log("Session update", data);
		if(data?.rooms){
			setRoomsData(data.rooms);
		} else if(data?.sessionId) {
			setRoomsData((rooms) => updateRoomData(rooms, data, "session"));
		}
	}

   return(
      <div className="rooms-list">
         {Object.entries(roomsData).map(([key, room]) => <RoomControlPanel id={room.id} key={room.id} room={room}/>)}
      </div>
   )
}