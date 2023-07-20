import React, { useEffect, useState, useRef, useContext } from "react";
import "survey-react/survey.css";
import { CMDS, DATA, STAGE } from "../managers/Definitions";
import "react-toastify/dist/ReactToastify.css";
import { SessionContext } from "../classes/Session";
const FileSaver = require("file-saver");
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { icon } from '@fortawesome/fontawesome-svg-core/import.macro'
import {  toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import * as JSZip from 'jszip'

const setVideoConstraints = (video) => {
	video.getTracks().forEach((track) => {
		console.log("Track capabilities: ", track, track.getCapabilities());
		track.applyConstraints({
			colorTemperature: 10000,
			exposureCompensation: 3,
		 }).catch( ( error ) => {
			console.warn(`Error applying constraints to track: `, error)
		 });
	});
}

export default function VideoContainer(props) {
	const sessionMap = useContext(SessionContext);
	const faceProcessor = props.faceProcessor;
	const [mediaRecorder, setMediaRecorder] = useState(null);
	const recorderReady = useRef(false);
	const mediaChunks = useRef([]);
	const socket = props.socket;
	const rtcManager = props.rtcManager;
	const canvasRef = useRef();
	const localVideo = useRef();
	const remoteVideo = useRef();
	const remoteStream = useRef();
	const onRemotePlay = props.onRemotePlay ?? (() => {});
	const onStreamAdded = props.onStreamAdded;

	// when the other side added a media stream, show it on screen
	const onAddStream = (e) => {
		console.log("onaddstream", e);
		if (remoteVideo.current != null) {
			remoteStream.current = e.stream;
			remoteVideo.current.srcObject = e.stream;
			remoteVideo.current.addEventListener("play", () => {
				console.log("Remote Video Play");
				faceProcessor.setVideo(remoteVideo.current);
				sessionMap.session.remoteVideo = remoteVideo.current;
				// setVideoConstraints(remoteVideo.current);
				onRemotePlay();
				
			});
			onStreamAdded();
		}
	};

	useEffect(() => {
		if(props.connectionStatus == "disconnected"){
			if(faceProcessor != null){
				faceProcessor.setVideo(localVideo.current);
			}
		}
	}, [props.connectionStatus]);

	const initLocalVideo = async () => {
		// call if we were the last to connect (to increase
		// chances that everything is set up properly at both ends)
		// console.log(`State user: ${this.state.user}`);
		console.log("initializing local video");
		try {
			const stream = await navigator.mediaDevices.getUserMedia({
				audio: true,
				video: {
					width: { min: 1280, ideal: 1280 },
					height: { min: 720, ideal: 720 },
					frameRate: 30,
					colorTemperature: 7000.0,
				},
			});
			localVideo.current.srcObject = stream;
		} catch (error) {
			console.error("Error getting user media: " + error);
		}
		localVideo.current.addEventListener("play",  () => {
			console.log("Local video PLAY");
			const newMediaRecorder = new MediaRecorder(localVideo.current.srcObject);
			console.log("Created media recorder", newMediaRecorder)
			setMediaRecorder(newMediaRecorder);
			// faceProcessor.start();
		});

		// attach local media to the peer connection
		// stream.getTracks().forEach((track) => {
		// 	console.log('Adding track ', track);
		// 	this.pc.addTrack(track, this.localStream)
		// });

		// try{
		// 	if(this.sessionMap.session.user.role.toLowerCase() === "host"){
		// 		this.initiateCall()
		// 	}
		// }
		// catch(error){
		// 	console.error(`Error initiating call: `, error);
		// }
	};

	useEffect(() => {
		if(mediaRecorder == null) return;
		sessionMap.session.addOnStart((session) => {
			if(session.data?.stage?.step?.type != STAGE.TYPE.VIDEO_CHAT) return;
			if(mediaRecorder != null && mediaRecorder.state != "recording"){
				console.log("Starting MediaRecorder ", mediaRecorder);
				mediaRecorder.start();
				console.log("Recording started!")
				faceProcessor.startRecording();
				mediaRecorder.ondataavailable = (e) => {
					mediaChunks.current.push(e.data);
				}
				mediaRecorder.onstop = (e) => {
					try{
						console.log("Recording stopped!")
						// convert saved chunks to blob
						const date = new Date().toISOString().split(".")[0];
						let baseFilename = `YFIM_<type>_${sessionMap.session.user?.name}_${date}`;
						const files = [];
						files.push({
							name: baseFilename.replace("<type>", "VIDEO")+".webm",
							data: new Blob(mediaChunks.current, { type: "video/webm" })
						})
						files.push({
							name: baseFilename.replace("<type>", "FACE")+".json",
							data: faceProcessor.stopRecording()
						})
						
						const zipFiles = true;
						if(zipFiles){
							const zip =  new JSZip();
							for (let file of files) {
								zip.file(file.name, file.data);
							}
												
							zip.generateAsync({
								type: "blob",
								compression: "DEFLATE",
								compressionOptions: {level: 9}
							}).then((content) => {
								const zipFilename = baseFilename.replace("<type>_", "")+".zip"
								FileSaver.saveAs(content, zipFilename);
								var url = window.location.href;
								var arr = url.split("/");
								var result = arr[0] + "//" + arr[2];

								var fd = new FormData();
								fd.append("zipFile", content, zipFilename);
								fd.append("userName", sessionMap.session.user?.name);
								fd.append("sessionId", sessionMap.session.data?.sessionId);

								console.log("FORM DATA", fd);
								for (var key of fd.entries()) {
									console.log(key[0] + ', ' + key[1]);
								}
								fetch(`${result}/upload_stage_results`, {
									 method: 'POST',
									 body: fd,
									//  mimeType:'multipart/form-data',
									//  headers: {
									// 	"Content-Type": `multipart/form-data; boundary=${fd._boundary}`
									//  }
								}).then((res) => console.log("File Upload completed", res))
								.catch((err) => console.warn("Error uploading file to server", err));
							}).catch((error) => {
								console.warn("Error saving .zip file...", error);
							});
						}
						else{
							for (let file of files) {
								FileSaver.saveAs(file.data, file.name);
							}
						}
					}
					catch(error){
						console.warn("Error storing video and face api files...", error);
					}
				}
				const recordTestDuration = 5000;
				toast("Recording Started!", {
					autoClose: recordTestDuration,
					pauseOnFocusLoss: false,
					draggable: false,
					pauseOnHover: false
				})
				setTimeout(() => mediaRecorder.stop(), recordTestDuration);
			}
		});
	}, [mediaRecorder])

	useEffect(() => {
		if(faceProcessor != null){
			faceProcessor.canvas = canvasRef.current;
		}
	}, [])

	useEffect(() => {
		if(faceProcessor == null) return;
		faceProcessor.canvas = canvasRef.current;
		if(!faceProcessor.isRunning()){
			faceProcessor.setVideo(localVideo.current);
			sessionMap.session.localVideo = localVideo.current;
			initLocalVideo()
				.then(async () => {
					rtcManager.localVideo = localVideo.current;
					faceProcessor.setVideo(localVideo.current);
					return faceProcessor.loadModels();
				})
				.then(async () => faceProcessor.start())
			
			sessionMap.session.addOnStart((session) => {
				const maskData = session.data?.stage?.step?.mask;
				if(maskData != null && maskData != undefined){
					faceProcessor.setMaskData(maskData);
				}
			});
		}
	}, [faceProcessor]);

	useEffect(() => {
		if (rtcManager == null) return;
		rtcManager.onAddStream = onAddStream;
		rtcManager.localVideo = localVideo.current;
		rtcManager.remoteVideo = remoteVideo.current;
	}, [rtcManager]);

	return (
			<div className='media-bridge'>
				<div className="live-icon"> <FontAwesomeIcon icon={icon({name: 'video'})} /> </div>
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
					<video className="remote-video" id="remote-video" ref={remoteVideo} autoPlay></video>
				)}
				<video className="local-video" id="local-video" ref={localVideo} autoPlay muted></video>
			{/* <SurveyPage sessionStatusRef={this.state.statusRef} />  */}
			{/* GABRY: This stupid survey component causes the page to scroll up top at every render... */}
			{/* <div style={{backgroundColor: "white", height: "50vh", width: "100vw"}}/> */}
			</div>
	);
}
