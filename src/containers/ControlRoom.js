import React, { useEffect, useState, useRef, useContext, useReducer, useCallback } from "react";
import io from "socket.io-client";
import "survey-react/survey.css";
import { CMDS, DATA} from "../managers/Definitions.js";
import Toolbar from "./Toolbar.js";
import WebRTCManager from "../classes/RTCManager.js"
import 'react-toastify/dist/ReactToastify.css';
import { ToastCommunications, TOASTS } from "../components/ToastCommunications.js";
import { SessionProvider, SessionContext } from "../classes/ClientSession.js";
import TestComponent from "../tests/SessionContextUpdateExample.js"
import VideoContainer from "./VideoContainer.js";
import FaceProcessor from "../classes/FaceProcessor.js";
import { STAGE } from "../managers/Definitions.js"
import { Model } from "survey-core";
import { Survey } from "survey-react-ui";
import "survey-core/defaultV2.min.css";
// import "../surveyStyle";
import Introduction from "../components/Introduction.js";
import { SURVEYS, SURVEY_CSS_CLASSES, } from "../../assets/PostChatSurvey.js";
// import { createRequire } from "module";
// const require = createRequire(import.meta.url);
// var SURVEYS = require("../../assets/PostChatSurvey.js");

export default function RoomSession(props) {
	const sessionMap = useContext(SessionContext);
	return (
		<SessionProvider>
			<Room {...props}/>
		</SessionProvider>
	);
}


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
	const [roomData, setRoomData] = useState({});
	const [stageData, setStageData] = useState({});

   useEffect(() => {
		controlSocket.current = io.connect(`/${CMDS.NAMESPACES.CHAT}`);
		controlSocket.current = io.connect(`/${CMDS.NAMESPACES.CONTROL}`);
		console.log(`Created Socket: `,controlSocket.current);
      
		controlSocket.current.on(CMDS.SOCKET.RTC_COMMUNICATION, (data) => {
			if(data.bridge != CMDS.RTC.ACTIONS.MESSAGE){
				setBridge(data.bridge);
			}
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

	const onRoomUpdate = (data) => {
		sessionMap.updateRoom(data);
		setRoomData(sessionMap.session?.room);
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

   return(
      <div className="control-room">

      </div>
   )
}