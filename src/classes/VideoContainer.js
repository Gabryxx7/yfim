import React, { useEffect, useState, useRef, useContext } from "react";
import "survey-react/survey.css";
import { CMDS, DATA } from "../managers/Communications";
import "react-toastify/dist/ReactToastify.css";
import { SessionContext } from "../classes/Session";
import { DrawableLandmark, INTERP_FUNCTIONS } from "../classes/DrawableLandmark";
import { TIMES } from "../managers/TimesDefinitions";
// import * as faceapi from "face-api.js"; // Updated face-api, check below
import * as faceapi from "@vladmandic/face-api"; // https://github.com/justadudewhohacks/face-api.js/issues?q=undefined+backend+#issuecomment-681001997


// Points positions are defined here: https://github.com/justadudewhohacks/face-api.js/blob/master/src/classes/FaceLandmarks68.ts
// Alternatively, one could use reflection to just call the function by name. I just find it easier to pass the list of points and let the landmark object updates itself
// PointsRange refers to which points belong to the landmark in the list of landmark positions so pointsRange=[i,j] would use the points positions.slice(i, j)
// If pointsRange is [] or [0,0] or in general i and j are such that j <= i, the whole list of given positions will be used
const defLandData = { name:"Test", pointsRange:[0, 0], scale:[1, 1], visible:true, pointSize:2, pointColor:"#f00", drawMask:true, interpFun: INTERP_FUNCTIONS.easeInOut, interpTime: 0.15 };
const landmarksData = [
  new DrawableLandmark({...defLandData, name:"JawOutline", pointsRange:[0, 17], scale:[1, 1], visible:false }),
  new DrawableLandmark({...defLandData, name:"LeftEyeBrow", pointsRange:[17, 22], scale:[1, 1], visible:false }),
  new DrawableLandmark({...defLandData, name:"RightEyeBrow", pointsRange:[22, 27], scale:[1, 1], visible:false }),
  new DrawableLandmark({...defLandData, name:"Nose", pointsRange:[27, 36], scale:[0.5, 1], visible:false }),
  new DrawableLandmark({...defLandData, name:"LeftEye", pointsRange:[36, 42], scale:[1.5, 1.35] }),
  new DrawableLandmark({...defLandData, name:"RightEye", pointsRange:[42, 48], scale:[1.5, 1.35] }),
  new DrawableLandmark({...defLandData, name:"Mouth", pointsRange:[48, 68], scale:[0.8, 0.8] })
]
const centerLandmarkPoint = new DrawableLandmark({...defLandData, name:"Center", pointsRange:[], scale:[1, 1], pointSize:10, pointColor:"#ff0", drawMask:false });
let centerOffset = 0;
const randomInRange = (min, max) => Math.floor(Math.random() * (max - min)) + min;
let updateCenterOffsetInterval = null;

export default function VideoContainer(props) {
	const sessionMap = useContext(SessionContext);
	const socket = props.socket;
	const rtcManager = props.rtcManager;
	const canvasRef = useRef();
	const localVideo = useRef();
	const remoteVideo = useRef();
	const remoteStream = useRef();
	const detectionsRef = useRef({updated: false});
	const setBridge = props.setBridge;
	const faceApiLoaded = useRef(false);


	// when the other side added a media stream, show it on screen
	const onAddStream = (e) => {
		console.log("onaddstream", e);
		if (remoteVideo.current != null) {
			remoteStream.current = e.stream;
			remoteVideo.current.srcObject = e.stream;

			remoteVideo.current.addEventListener("play", () => {
				console.log("Remote Video Play");
				// start detect remote's face and process
				tryStartFaceDetection().catch((error) => {
				console.warn(`Error attempting to start face detection emotion: ${error}`)
				});
			});
      	setBridge(CMDS.RTC.STATUS.ESTABLISHED);
			sessionMap.session.start();
		}
	}

	const loadModels = async () => {
	// load faceapi models for detection
		faceApiLoaded.current = false;
		console.info("++ loading model");

		await faceapi.tf.setBackend("webgl"); // Or 'wasm'
		const MODEL_URL = "/models";
		const tinyFaceDetectorModel = await faceapi.loadTinyFaceDetectorModel(MODEL_URL);
		const faceLandmarkModel = await faceapi.loadFaceLandmarkModel(MODEL_URL);
		const faceRecognitionModel = await faceapi.loadFaceRecognitionModel(MODEL_URL);
		const faceExpressionModel = await faceapi.loadFaceExpressionModel(MODEL_URL);
		faceApiLoaded.current = true;

		// console.log(faceapi.nets);

		// console.info("+ tinyFaceDetectorModel loaded:");
		// console.log(tinyFaceDetectorModel);

		// console.info("+ faceLandmarkModel loaded:");
		// console.log(faceLandmarkModel);

		// console.info("+ faceRecognitionModel loaded:");
		// console.log(faceRecognitionModel);

		// console.info("+ faceExpressionModel loaded:");
		// console.log(faceExpressionModel);
	}


	// main function for chat room
	// 1. faceapi doc: https://justadudewhohacks.github.io/face-api.js/docs/index.html
	// 2. create canvas based on remote video size
	// 3.
	const tryStartFaceDetection = async () => {
		if(!faceApiLoaded.current){
			console.warn("Waiting for face api models to load...");
			setTimeout(async () => await tryStartFaceDetection(), TIMES.FACE_DETECTION_RETRY);
			return;
		}

		const canvasTmpLocal = faceapi.createCanvasFromMedia(localVideo.current);

		if(remoteVideo.current != null){
			const canvasTmpRemote = faceapi.createCanvasFromMedia(remoteVideo.current);
			// console.log("compare", canvasTmpRemote, canvasTmpLocal);
		}

		const displaySize = {
			width: canvasTmpLocal.width,
			height: canvasTmpLocal.height,
		};
		faceapi.matchDimensions(canvasRef.current, displaySize);
		console.log(canvasRef.current.width, canvasRef.current.height);

		console.log("Triggering face detection..");
		setTimeout(async () => await faceDetectionCallback(), TIMES.FACE_DETECTION_DELAY);
		window.requestAnimationFrame(() => drawCanvas());
	}

	
	const faceDetectionCallback = async () => {
		let currentVideoSource = remoteVideo.current;
		if(remoteVideo == null){
		  currentVideoSource = localVideo.current;
		  console.warn("No remote video source, using local video for face api detection");
		}
		// console.log(`Using Video Source: ${currentVideoSource.id}`, currentVideoSource)
		try {
		  const newDetections = await faceapi
			 .detectSingleFace(
				currentVideoSource,
				new faceapi.TinyFaceDetectorOptions()
			 )
			 .withFaceLandmarks()
			 .withFaceExpressions();
		  if(newDetections != undefined && newDetections != null){
			 detectionsRef.current = newDetections;
		  }
		  detectionsRef.current.updated = true;
		  // console.log("detections", this.detections);
		}catch (err) {
		  console.error(`ERROR detecting single face ${err}`);
		  detectionsRef.current.updated = false;
		}
		// if (this.props.roomPage.state.session.running && !this.state.survey_in_progress) {
		//   try {
		// 	 const emo_data = {
		// 		timeStamp: utc,
		// 		elapsedStage: 0,
		// 		elapsedSession: 0,
		// 		emotion: this.detections.expressions,
		// 	 };
		// 	 this.record.record_detail.push(emo_data);
		// 	 this.record.record_count += 1;
		//   } catch (err) {
		// 	 console.warn(`Error showing emotion: ${err}`);
		//   }
		// }
  
		setTimeout(async () => await faceDetectionCallback(), TIMES.FACE_DETECTION_DELAY);
	 }


  // Draw a mask over face/screen
  const drawCanvas = () => {
	const ctx = canvasRef.current.getContext("2d");
	ctx.fillStyle = "black";
	ctx.fillRect(0, 0, canvasRef.current.width, canvasRef.current.height);
	const detections = detectionsRef.current;
	if(detections.updated){
	  let imHeight = detections.detection.imageHeight;
	  let imWidth = detections.detection.imageWidth;
	  let cHeight = ctx.canvas.clientHeight;
	  let cWidth = ctx.canvas.clientWidth;
	  let ctxHeight = ctx.canvas.height;
	  let ctxWidth = ctx.canvas.width;
	  let bHeight = ctx.canvas.getBoundingClientRect().height;
	  let bWidth = ctx.canvas.getBoundingClientRect().width;

	  let imgWidthR = detections.detection.imageWidth;
	  let imgHeightR = detections.detection.imageHeight;
	  if(detections.updated){
		 let resized = faceapi.resizeResults(detections, { width: ctxWidth, height: ctxHeight }) // For some reason it's not quite centered
		 imgWidthR = resized.detection.imageWidth;
		 imgHeightR = resized.detection.imageHeight;

		 // console.log(`Image: ${imWidth} x ${imHeight}\nImage Resized: ${imWidthR} x ${imHeightR}\nClient: ${cWidth} x ${cHeight}\nBounding: ${bWidth} x ${bHeight}`)
		 // detections = faceapi.resizeResults(detections, { width: ctx.canvas.clientWidth, height: ctx.canvas.clientHeight })
		 const landmarks = resized.landmarks;
		 // console.log("landmarks", landmarks);
		 for(let l of landmarksData){
			l.updatePointsFromLandmark(landmarks.positions);
			l.setRotation(resized.angle.roll);
		 }
		 detectionsRef.current.updated = false;
	  }
	}

	// I need to draw the cutout/clipping maskes first and then draw the landmarks on top, i can't do both in the same loop as the clipping masks of the next
	// Points would override the previous landmark points
	for(let l of landmarksData){
		if(l.drawMask){
			try{
				l.drawClippingMask(ctx)
			}catch(error){
				console.warn("Error drawing clipping mask", error.message);
			}
		}
	}
	// for(let l of landmarksData){
	//   l.drawPoints(ctx)
	//   l.drawCentroid(ctx, false)
	// }

	// This is just a quick test to check whether the animated value/points structure works
	// if(updateCenterOffsetInterval == null) updateCenterOffsetInterval = setInterval(() => {centerOffset = randomInRange(-200, 200)}, 2000);
	// centerLandmarkPoint.updatePoints([ {x: imgWidthR * 0.5 + centerOffset, y: imgHeightR * 0.5 + centerOffset}]);
	// centerLandmarkPoint.drawPoints(ctx);
	window.requestAnimationFrame(() => drawCanvas());
 }

 useEffect(() => {
	(async () => await loadModels())();
 }, [])

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
					<video className="remote-video" id="remote-video" ref={remoteVideo} autoPlay></video>
				)}
				<video className="local-video" id="local-video" ref={localVideo} autoPlay muted></video>
			</div>
			{/* <SurveyPage sessionStatusRef={this.state.statusRef} />  */}
			{/* GABRY: This stupid survey component causes the page to scroll up top at every render... */}
			{/* <div style={{backgroundColor: "white", height: "50vh", width: "100vw"}}/> */}
		</div>
	);
}
