import React, { useEffect, useState, useRef, useContext } from "react";
import "survey-react/survey.css";
import { CMDS, DATA, STAGE, KEY_SHORTCUTS } from "../../backend/Definitions.js";
import "react-toastify/dist/ReactToastify.css";
import { AppContext, useFaceProcessor, useSession, useSettings, useStage, useUser } from '../../context';
import FileSaver from "file-saver";
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { icon } from '@fortawesome/fontawesome-svg-core/import.macro'
import JSZip from "jszip";
import { useSocket, useWebRTC } from "../../context";


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
	const faceProcessor = useFaceProcessor();
	const { stream } = useWebRTC();
	const { settings, updateSettings } = useSettings();
	const { session } = useSession();
	const { localVideo, remoteVideo, canvas } = session;
	const { user } = useUser();
	const { stage } = useStage();
	const socket = useSocket(CMDS.NAMESPACES.CHAT);
	const customVideoActions = props.customVideoActions ?? [];
	const mediaRecorder = useRef(null);
	const [videoStatus, setVideoStatus] = useState(null);
	const [recording, setRecording] = useState(false);
	// recording = props.recording ?? recording;
	const mediaChunks = useRef([]);
	const rtcManager = props.rtcManager ?? null;
	const onRemotePlay = props.onRemotePlay ?? (() => {});

	useEffect(() => {
		if(!stream) return;
		// when the other side added a media stream, show it on screen
		// console.log(`RTC: Adding MediaStream ${e?.stream?.id}`);
		if (remoteVideo.current != null) {
			remoteVideo.current.srcObject = stream;
			remoteVideo.current.addEventListener("play", () => {
				// console.log(`RTC: Remote Video is now playing`);
				faceProcessor.setVideo(remoteVideo.current);
				// if(session){
				// 	session.remoteVideo = remoteVideo.current;
				// }
				// setVideoConstraints(remoteVideo.current);
				onRemotePlay();					
			});
		}
	
	}, [stream])

	const stopRecording = () => {
		mediaRecorder.current.stop();
	}

	const startRecording = () => {
		mediaChunks.current = [];
		mediaRecorder.current.ondataavailable = (e) => mediaChunks.current.push(e.data);
		mediaRecorder.current.onstart = (e) => onRecordingStart(e);
		mediaRecorder.current.onstop = (e) => onRecordingStop(e);
		mediaRecorder.current.start();
		console.log("Recording started!", mediaRecorder.current.state)
		faceProcessor.startRecording(session);
	}

	const onRecordingStart = (e) => {
		console.log("Media recorder STARTED!");
	}

	const onRecordingStop = (e) => {
		console.log("Media recorder STOPPED!");
		try{
			// convert saved chunks to blob
			const date = new Date().toISOString().split(".")[0];
			let baseFilename = `YFIM_<type>_${user?.name}_${date}`;
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
					fd.append("stageIndex", stage?.index);
					fd.append("userName", user?.name);
					fd.append("sessionId", stage?.sessionId);
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
				startRecording();
			}
		}
		else {
			stopRecording();
		}
	}, [recording])

	useEffect(() => {
		if(stage == null) return;
		if(stage.type != STAGE.TYPE.VIDEO_CHAT){
			return;
		}
		if(stage.state == STAGE.STATUS.COMPLETED){
			setRecording(false);
		} else if(stage.state == STAGE.STATUS.IN_PROGRESS){
			console.log("New stage in progress. mediaRecorder's state", mediaRecorder.current?.state);
			setRecording(true);
		}
		console.log(`User name: ${user?.name}, SessionId: ${stage?.sessionId}`)
		console.log(`Video Container state ${stage?.state}. Type: ${stage?.type}. mediaRecorder: ${mediaRecorder.current?.state}`)
	}, [stage])

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
			toggleVideoMuted(localVideo.current, settings.video);
			toggleAudioMuted(localVideo.current, settings.video);
			if(settings.recording){
				if(mediaRecorder.current != null){
					return;
				}
				mediaRecorder.current = new MediaRecorder(localVideo.current.srcObject);
				console.log(`Created media recorder (already recording? ${recording}`, mediaRecorder.current)
				// if(recording && mediaRecorder?.current?.state != "recording"){
				// 	startRecording();
				// }
				// faceProcessor.start();
			}
		} catch (error) {
			console.error("Error getting user media: " + error);
		}
		localVideo.current.addEventListener("play",  () => {
			console.log("Local video PLAY", localVideo.current.id, "Media Recorder null?", mediaRecorder.current == null, "undefined?", mediaRecorder.current == undefined);
		});

		// attach local media to the peer connection
		// stream.getTracks().forEach((track) => {
		// 	console.log('Adding track ', track);
		// 	this.pc.addTrack(track, this.localStream)
		// });

		// try{
		// 	if(this.session?.user.role.toLowerCase() === "host"){
		// 		this.initiateCall()
		// 	}
		// }
		// catch(error){
		// 	console.error(`Error initiating call: `, error);
		// }
	};

	useEffect(() => {
		toggleAudioMuted(remoteVideo.current, settings.audio);
	}, [settings.audio])
	useEffect(() => {
		toggleAudioMuted(localVideo.current, settings.audio);
	}, [settings.mic])
	useEffect(() => {
		toggleVideoMuted(localVideo.current, settings.video);
	}, [settings.video])


	useEffect(() => {
		if(stage == null) return;
		if(stage.type == STAGE.TYPE.VIDEO_CHAT){
			toggleVideoMuted(localVideo.current, true);
			toggleAudioMuted(localVideo.current, true);
			return;
		}
		if(stage.type == STAGE.TYPE.SURVEY){
			toggleVideoMuted(localVideo.current, false);
			toggleAudioMuted(localVideo.current, false);
		}
	}, [stage])

	useEffect(() => {
		if(faceProcessor == null) return;
		faceProcessor.canvas = canvas.current;
		if(!faceProcessor.isRunning()){
			faceProcessor.setVideo(localVideo.current);
			// if(session){
			// 	session.localVideo = localVideo.current;
			// }
			initLocalVideo()
				.then(async () => {
					if(rtcManager != null){
						rtcManager.localVideo = localVideo.current;
					}
					faceProcessor.setVideo(localVideo.current);
					return faceProcessor.loadModels();
				})
				.then(async () => faceProcessor.start())
			
			// session?.addOnStart((session) => {
			// 	const maskFeatures = session.data?.stage?.mask;
			// 	// console.log("New stage started, mask data:", maskData)
			// 	if(!!maskFeatures){
			// 		faceProcessor.setMaskData(maskFeatures);
			// 	}
			// });
		}
	}, [faceProcessor]);


	return (
			<div className='media-bridge'>
				<div className="actions-panel video-actions overlay-panel">
					<div className="live-icon action" onClick={() => toggleVideoMuted(localVideo.current)}>
						{videoStatus != null && videoStatus[VIDEO_ID.LOCAL].video ?
							<FontAwesomeIcon icon={icon({name: 'video'})} /> :
							<FontAwesomeIcon icon={icon({name: 'video-slash'})} />
						}
					</div>
					<div className="mic-icon action" onClick={() => toggleAudioMuted(localVideo.current)}>
						{videoStatus != null && videoStatus[VIDEO_ID.LOCAL].audio ?
							<FontAwesomeIcon icon={icon({name: 'microphone'})} /> :
							<FontAwesomeIcon icon={icon({name: 'microphone-slash'})} />
						}
					</div>
					<div className="headset-icon action" onClick={() => toggleAudioMuted(remoteVideo.current)}>
						{videoStatus == null ? <></> :
						remoteVideo.current == null ?
							<FontAwesomeIcon icon={icon({name: 'volume-off'})} /> :
							videoStatus[VIDEO_ID.REMOTE].audio ?
								<FontAwesomeIcon icon={icon({name: 'volume-high'})} /> :
								<FontAwesomeIcon icon={icon({name: 'volume-xmark'})} />
						}
					</div>
					<div className={`recording-icon action ${recording ? "recording" : ""}`} onClick={() => setRecording((prev) => !prev)}>
						{recording ?
							<FontAwesomeIcon icon={icon({name: 'circle'})} /> :
							<FontAwesomeIcon icon={icon({name: 'play'})} />
						}
					</div>
				</div>
				<canvas className="canvas" ref={canvas} />
				{(() => {
					// if (socket == null) return <></>;
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

				{socket != null && (
					<video className={VIDEO_ID.REMOTE} id={VIDEO_ID.REMOTE} ref={remoteVideo} autoPlay></video>
				)}
				<video className={VIDEO_ID.LOCAL} id={VIDEO_ID.LOCAL} ref={localVideo} autoPlay muted></video>
			{/* <SurveyPage sessionStatusRef={this.state.statusRef} />  */}
			{/* GABRY: This stupid survey component causes the page to scroll up top at every render... */}
			{/* <div style={{backgroundColor: "white", height: "50vh", width: "100vw"}}/> */}
			</div>
	);
}