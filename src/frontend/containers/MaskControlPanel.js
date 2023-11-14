import React, { Component, useEffect, useRef, useState } from "react";
import TextField from "@mui/material/TextField";
import "survey-core/defaultV2.min.css";
import { CMDS, DATA, STAGE } from "../../backend/Definitions.js";
import VideoContainer from "./VideoContainer.js";
import { FaceMaskSelector } from "../components/Controls/FaceMaskSelector.js";
import { useSocket, useFaceProcessor } from '../../context'

export default function MaskControlPanel(props) {
	const socket = useSocket(CMDS.NAMESPACES.CONTROL);
	const [recording, setRecording] = useState(false);
	const faceProcessor = useFaceProcessor();
	const [stageData, setStageData] = useState({ type: STAGE.TYPE.VIDEO_CHAT, sessionId: "testSession" });
	const [userData, setUserData] = useState({ name: "faceTest" });
	const sessionDataFields = (
		<div>
			<TextField
				variant="standard"
				value={userData?.name}
				color="secondary"
				onChange={(e) => setUserData((prev) => ({ ...prev, name: e.target.value }))}
			/>
			<TextField
				variant="standard"
				value={stageData?.sessionId}
				color="secondary"
				onChange={(e) => setStageData((prev) => ({ ...prev, sessionId: e.target.value }))}
			/>
		</div>
	);
	// const recordControls = <RecordingControls recording={recording} onClick={() => setRecording(!recording)} />

	return (
		<div
			className="face-mask-container"
			style={{
				width: "100%",
				display: "block",
				position: "relative",
				height: "100%",
			}}
		>
			<div className="face-mask-controls">
				<FaceMaskSelector faceProcessor={faceProcessor} />
				<div>{sessionDataFields}</div>
			</div>
			<VideoContainer
				// customVideoActions={[sessionDataFields]}
				audioEnabled={false}
				micEnabled={false}
				videoEnabled={true}
				recordingEnabled={true}
				recording={recording}
				userData={userData}
				stageData={stageData}
				// socket={socket}
				onStreamAdded={() => {
					setBridge(CMDS.RTC.STATUS.ESTABLISHED);
				}}
				onRemotePlay={() => {}}
				// connectionStatus={connectionStatus}
				// rtcManager={RTCManager}
				faceProcessor={faceProcessor}
			/>
		</div>
	);
}
