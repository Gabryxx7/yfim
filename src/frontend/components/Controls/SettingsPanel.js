import React, { useEffect, useState, useRef } from "react";
import io from "socket.io-client";
import "survey-react/survey.css";
import 'react-toastify/dist/ReactToastify.css';
import ServerConfig from "../../../../data/ServerConfig.json"
import { CMDS } from "../../../backend/Definitions.js";
import { useSocket } from "../../../context/SocketContext.js"

function SettingInput(props) {
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
	const chatSocket = useSocket(CMDS.NAMESPACES.CHAT);
	const socket = useSocket(CMDS.NAMESPACES.CONTROL);
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