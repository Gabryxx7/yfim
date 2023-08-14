import React, { useEffect, useState, useRef, useContext } from "react";
import "survey-react/survey.css";
import { CMDS, DATA, STAGE } from "../../backend/Definitions.js";
import "react-toastify/dist/ReactToastify.css";
import { SessionContext } from "../classes/ClientSession.js";
import FileSaver from "file-saver";
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { icon } from '@fortawesome/fontawesome-svg-core/import.macro'
import JSZip from "jszip";


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

const VIDEO_ID = {
	REMOTE: "remote-video",
	LOCAL: "local-video"
}

export default function VideoContainer(props) {
	const sessionMap = useContext(SessionContext) ?? null;
	const faceProcessor = props.faceProcessor;
	const recordingEnabled = props.recordingEnabled ?? false;
	const customVideoActions = props.customVideoActions ?? [];
	const mediaRecorder = useRef(null);
	const [videoStatus, setVideoStatus] = useState(null);
	const [recording, setRecording] = useState(false);
	// recording = props.recording ?? recording;
	const stageData = props.stageData ?? null;
	const userData = props.userData ?? {name: "VideoTest"};
	const mediaChunks = useRef([]);
	const socket = props.socket ?? null;
	const rtcManager = props.rtcManager ?? null;
	const canvasRef = useRef();
	const localVideo = useRef();
	const remoteVideo = useRef();
	const onRemotePlay = props.onRemotePlay ?? (() => {});
	const onStreamAdded = props.onStreamAdded;

	const onMediaStop = (e) => {
		console.log("Recording stopped!");
		try{
			// convert saved chunks to blob
			const date = new Date().toISOString().split(".")[0];
			let baseFilename = `YFIM_<type>_${userData?.name}_${date}`;
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
					// fd.append("test", "test1");
					fd.append("userName", userData?.name);
					fd.append("sessionId", stageData?.sessionId);
					fd.append("zipFile", content, zipFilename);

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

	useEffect(() => {
		if(videoStatus == null){
			const defaultVideoStatus = {};
			defaultVideoStatus[VIDEO_ID.LOCAL] = {audio: true, video: true};
			defaultVideoStatus[VIDEO_ID.REMOTE] = {audio: true, video: true};
			setVideoStatus(defaultVideoStatus);
		}
	}, [videoStatus])

	const updateVideoStatus = (videoId, newStatus) => {
		setVideoStatus((prev) => {
			const updated = {...prev};
			updated[videoId] = {...prev[videoId], ...newStatus}
			return updated;
		})
	}
	const toggleAudioMuted = (video, override=null) => {
		if(!video || !video.srcObject) return;
		var newStatus = null;
		video.srcObject.getAudioTracks().forEach((track) => {
			newStatus = track.enabled = override == null ? !track.enabled : override;
		});
		updateVideoStatus(video.id, {audio: newStatus})
	}
	const toggleVideoMuted = (video, override=null) => {
		if(!video || !video.srcObject) return;
		var newStatus = null;
		video.srcObject.getVideoTracks().forEach((track) => {
			newStatus = track.enabled = override == null ? !track.enabled : override;
		});
		updateVideoStatus(video.id, {video: newStatus})
	}

	useEffect(() => {
		console.log("RECORDING CHANGED", recording, mediaRecorder.current);
		if(mediaRecorder.current == null) return;
		if(recording){
			if(mediaRecorder.current?.state != "recording"){
				mediaChunks.current = [];
				mediaRecorder.current.ondataavailable = (e) => mediaChunks.current.push(e.data);
				mediaRecorder.current.onstop = (e) => onMediaStop(e);
				mediaRecorder.current.start();
				console.log("Recording started!", mediaRecorder.current.state)
				faceProcessor.startRecording(sessionMap?.session);
			}
		}
		else {
			mediaRecorder.current.stop();
		}
	}, [recording])

	useEffect(() => {
		if(stageData == null) return;
		if(stageData.type != STAGE.TYPE.VIDEO_CHAT){
			return;
		}
		if(stageData.state == STAGE.STATUS.COMPLETED){
			setRecording(false);
		} else if(stageData.state == STAGE.STATUS.IN_PROGRESS){
			console.log("New stage in progress. mediaRecorder's state", mediaRecorder.current?.state);
			setRecording(true);
		}
		console.log(`User name: ${userData?.name}, SessionId: ${stageData?.sessionId}`)
		console.log(`Video Container state ${stageData?.state}. Type: ${stageData?.type}. mediaRecorder: ${mediaRecorder.current?.state}`)
	}, [stageData])

	// when the other side added a media stream, show it on screen
	const onAddStream = (e) => {
		console.log(`RTC: Adding MediaStream ${e?.stream?.id}`);
		if (remoteVideo.current != null) {
			remoteVideo.current.srcObject = e.stream;
			remoteVideo.current.addEventListener("play", () => {
				console.log("RTC: Remote Video is now playing");
				faceProcessor.setVideo(remoteVideo.current);
				if(sessionMap?.session){
					sessionMap.session.remoteVideo = remoteVideo.current;
				}
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
			toggleVideoMuted(localVideo.current, false);
			toggleAudioMuted(localVideo.current, false);
		} catch (error) {
			console.error("Error getting user media: " + error);
		}
		localVideo.current.addEventListener("play",  () => {
			console.log("Local video PLAY", localVideo.current.id, "Media Recorder null?", mediaRecorder.current == null, "undefined?", mediaRecorder.current == undefined);
			if(recordingEnabled){
				if(mediaRecorder.current != null){
					return;
				}
				mediaRecorder.current = new MediaRecorder(localVideo.current.srcObject);
				console.log("Created media recorder", mediaRecorder.current)
				// faceProcessor.start();
			}
		});

		// attach local media to the peer connection
		// stream.getTracks().forEach((track) => {
		// 	console.log('Adding track ', track);
		// 	this.pc.addTrack(track, this.localStream)
		// });

		// try{
		// 	if(this.sessionMap?.session?.user.role.toLowerCase() === "host"){
		// 		this.initiateCall()
		// 	}
		// }
		// catch(error){
		// 	console.error(`Error initiating call: `, error);
		// }
	};

	useEffect(() => {
		if(stageData == null) return;
		console.log(`New step starting ${stageData.type}`)
		if(stageData.type != STAGE.TYPE.VIDEO_CHAT){
			toggleVideoMuted(localVideo.current, false);
			toggleAudioMuted(localVideo.current, false);
			return;
		}
		toggleVideoMuted(localVideo.current, true);
		toggleAudioMuted(localVideo.current, true);
	}, [stageData])

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
			if(sessionMap?.session){
				sessionMap.session.localVideo = localVideo.current;
			}
			initLocalVideo()
				.then(async () => {
					if(rtcManager != null){
						rtcManager.localVideo = localVideo.current;
					}
					faceProcessor.setVideo(localVideo.current);
					return faceProcessor.loadModels();
				})
				.then(async () => faceProcessor.start())
			
			sessionMap?.session?.addOnStart((session) => {
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
				<div className="video-actions">
					<div className="video-call-icons">
						<div className="live-icon icon" onClick={() => toggleVideoMuted(localVideo.current)}>
							{videoStatus != null && videoStatus[VIDEO_ID.LOCAL].video ?
								<FontAwesomeIcon icon={icon({name: 'video'})} /> :
								<FontAwesomeIcon icon={icon({name: 'video-slash'})} />
							}
						</div>
						<div className="mic-icon icon" onClick={() => toggleAudioMuted(localVideo.current)}>
							{videoStatus != null && videoStatus[VIDEO_ID.LOCAL].audio ?
								<FontAwesomeIcon icon={icon({name: 'microphone'})} /> :
								<FontAwesomeIcon icon={icon({name: 'microphone-slash'})} />
							}
						</div>
						<div className="headset-icon icon">
							{videoStatus != null && videoStatus[VIDEO_ID.REMOTE].audio ?
								<FontAwesomeIcon icon={icon({name: 'phone'})} /> :
								<FontAwesomeIcon icon={icon({name: 'phone-slash'})} />
							}
						</div>
						<div className={`recording-icon icon ${recording ? "recording" : ""}`} onClick={() => setRecording((prev) => !prev)}>
							{recording ?
								<FontAwesomeIcon icon={icon({name: 'circle'})} /> :
								<FontAwesomeIcon icon={icon({name: 'play'})} />
							}
						</div>
					</div>
					{customVideoActions.map((component) => component)}
				</div>
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

				{socket?.current != null && (
					<video className={VIDEO_ID.REMOTE} id={VIDEO_ID.REMOTE} ref={remoteVideo} autoPlay></video>
				)}
				<video className={VIDEO_ID.LOCAL} id={VIDEO_ID.LOCAL} ref={localVideo} autoPlay muted></video>
			{/* <SurveyPage sessionStatusRef={this.state.statusRef} />  */}
			{/* GABRY: This stupid survey component causes the page to scroll up top at every render... */}
			{/* <div style={{backgroundColor: "white", height: "50vh", width: "100vw"}}/> */}
			</div>
	);
}
