import React, { useEffect, useState, useRef, useContext, useReducer, useCallback } from "react";
import io from "socket.io-client";
import "survey-react/survey.css";
import { CMDS, DATA} from "../../backend/Definitions.js";
import 'react-toastify/dist/ReactToastify.css';
import { ToastCommunications, TOASTS } from "../components/ToastCommunications.js";
import { SessionProvider, SessionContext } from "../classes/ClientSession.js";
import { STAGE } from "../../backend/Definitions.js"
import RoomControlPanel from "../components/Controls/RoomControlPanel.js";
import ServerConfig from "../../../../data/ServerConfig.json"

export default function SettingsPanel(props) {
	const label = props.label ?? "Setting";
	const [setting, setSetting] = useState("none");
   const type = props.type ?? "text";

   useEffect(() => {
	}, [])

   return(
      <div className="setting-input">
         {React.createElement('input', {}, [])}
      </div>
   )
}


export default function SettingsPanel(props) {
	const sessionMap = useContext(SessionContext);
	const chatSocket = useRef(null);
	const controlSocket = useRef(null);
	const [connectionStatus, setConnectionStatus] = useState("none")
	const [settings, setSettings] = useState(ServerConfig);

   useEffect(() => {
	}, [])


   useEffect(() => {
	}, [settings])

   return(
      <div className="settings-panel">
      </div>
   )
}