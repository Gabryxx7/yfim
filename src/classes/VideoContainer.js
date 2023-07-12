import React, { useEffect, useState, useRef, useContext } from "react";
import "survey-react/survey.css";
import { CMDS, DATA } from "../managers/Communications";
import "react-toastify/dist/ReactToastify.css";
import { SessionContext } from "../classes/Session";

export default function VideoContainer(props) {
	const sessionMap = useContext(SessionContext);
  const socket = props.socket;
  const rtcManager = props.rtcManager;
	const canvasRef = useRef();
  const localVideo = useRef();
  const remoteVideo = useRef();
  const remoteStream = useRef();
  const setBridge = props.setBridge;


	// when the other side added a media stream, show it on screen
	const onAddStream = (e) => {
		console.log("onaddstream", e);
		if (remoteVideo != null) {
			remoteStream.current = e.stream;
			remoteVideo.srcObject = remoteStream.current = e.stream;
      setBridge(CMDS.RTC.STATUS.ESTABLISHED);
		}
	}

  useEffect(() => {
    if(rtcManager == null) return;
    rtcManager.onAddStream = onAddStream;
    rtcManager.localVideo = localVideo.current;
    rtcManager.remoteVideo = remoteVideo.current;
  }, [rtcManager])

	return (
		<div className={`main-room-container`}>
			<div className={`media-bridge`}>
				<canvas className="canvas" ref={canvasRef} />
				{(() => {
					// if (socket.current == null) return <></>;
					// if (!this.props.roomPage.state.session.running) {
					// 	if (this.state.intro.visible)
					// 		return (
					// 			<IntroFaceDetect userRole={this.props.roomPage.state.user_role} />
					// 		); /* Face detected before process showing details */
					// 	return (
					// 		<Introduction userRole={this.props.roomPage.state.user_role} />
					// 	); /* No face detected, showing introduction */
					// }
				})()}

				{/* {this.state.loading && <Thankyou result={this.state.result} userRole={this.props.roomPage.state.user_role} />} */}

				{/* <GYModal title="Attention" visible={this.state.visible}>
					<h1 style={{ color: "white" }}>{this.state.attention}</h1>
				</GYModal> */}

				{socket.current != null && (
					<video className="remote-video" id="remote-video" ref={localVideo} autoPlay></video>
				)}
				<video className="local-video" id="local-video" ref={remoteVideo} autoPlay muted></video>
			</div>
			{/* <SurveyPage sessionStatusRef={this.state.statusRef} />  */}
			{/* GABRY: This stupid survey component causes the page to scroll up top at every render... */}
			{/* <div style={{backgroundColor: "white", height: "50vh", width: "100vw"}}/> */}
		</div>
	);
}
