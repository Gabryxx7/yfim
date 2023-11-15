import VideoProcessor from "./VideoProcessor.js";
import { DrawingUtils, FilesetResolver, FaceLandmarker } from "@mediapipe/tasks-vision";
import { CustomLandmarks } from "./DrawableLandmark.js"
import { FACE_LANDMARKS } from "../../backend/Definitions.js";
import { FaceProcessor } from "./FaceProcessor.js";
const runningMode = "VIDEO";

const landmarksMap = {};
landmarksMap[FACE_LANDMARKS.JAWOUTLINE] = 		() => FaceLandmarker.FACE_LANDMARKS_CONTOURS;
landmarksMap[FACE_LANDMARKS.LEFTEYEBROW] = 		() => FaceLandmarker.FACE_LANDMARKS_LEFT_EYEBROW;
landmarksMap[FACE_LANDMARKS.RIGHTEYEBROW] = 		() => FaceLandmarker.FACE_LANDMARKS_RIGHT_EYEBROW;
landmarksMap[FACE_LANDMARKS.NOSE] = 				() => FaceLandmarker.FACE_LANDMARKS_FACE_OVAL;
landmarksMap[FACE_LANDMARKS.LEFTEYE] = 			() => FaceLandmarker.FACE_LANDMARKS_LEFT_EYE;
landmarksMap[FACE_LANDMARKS.RIGHTEYE] = 			() => FaceLandmarker.FACE_LANDMARKS_RIGHT_EYE;
landmarksMap[FACE_LANDMARKS.MOUTH] = 				() => FaceLandmarker.FACE_LANDMARKS_LIPS;


 class MediaPipeProcessor extends FaceProcessor {

	constructor(...rest){
		super(...rest);
		this.drawingUtils = new DrawingUtils(this.ctx);
	}

	getVertices(points, landmarkVIndexes, imgSize=null){
		imgSize ??= {width: 1280, height: 720};
		const indexes = landmarkVIndexes.map(p => p.start);
		return indexes.map(i => ({x: points[i].x*imgSize.width, y: points[i].y*imgSize.height, z: points[i].z}));
	}

	getLandmarkPoints(landmark, points){
		if(!points) return;
		const lPoints = landmarksMap[landmark.name]();
		if(!lPoints) return;
		const newPoints = this.getVertices(points, lPoints, {width: 1280, height: 720});
		// console.log(landmark.name, newPoints)
		return newPoints
	}

	async init() {
		const filesetResolver = await FilesetResolver.forVisionTasks(
		  "https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@0.10.3/wasm"
		);
		this.faceLandmarker = await FaceLandmarker.createFromOptions(filesetResolver, {
		  baseOptions: {
			 modelAssetPath: `https://storage.googleapis.com/mediapipe-models/face_landmarker/face_landmarker/float16/1/face_landmarker.task`,
			 delegate: "GPU"
		  },
		  outputFaceBlendshapes: true,
		  runningMode ,
		  numFaces: 1
		});
	 }

	drawMesh(){
		if(!this.showPoints) return;
		const drawingUtils = new DrawingUtils(this.ctx);
		const landmarks = this.landmarks;
		drawingUtils.drawConnectors(
			landmarks,
			FaceLandmarker.FACE_LANDMARKS_TESSELATION,
			{ color: "#C0C0C044", lineWidth: 1 }
		 );
		 drawingUtils.drawConnectors(
			landmarks,
			FaceLandmarker.FACE_LANDMARKS_RIGHT_EYE,
			{ color: "#FF3030" }
		 );
		 drawingUtils.drawConnectors(
			landmarks,
			FaceLandmarker.FACE_LANDMARKS_RIGHT_EYEBROW,
			{ color: "#FF3030" }
		 );
		 drawingUtils.drawConnectors(
			landmarks,
			FaceLandmarker.FACE_LANDMARKS_LEFT_EYE,
			{ color: "#30FF30" }
		 );
		 drawingUtils.drawConnectors(
			landmarks,
			FaceLandmarker.FACE_LANDMARKS_LEFT_EYEBROW,
			{ color: "#30FF30" }
		 );
		 drawingUtils.drawConnectors(
			landmarks,
			FaceLandmarker.FACE_LANDMARKS_FACE_OVAL,
			{ color: "#E0E0E0" }
		 );
		 drawingUtils.drawConnectors(
			landmarks,
			FaceLandmarker.FACE_LANDMARKS_LIPS,
			{ color: "#E0E0E0" }
		 );
		 drawingUtils.drawConnectors(
			landmarks,
			FaceLandmarker.FACE_LANDMARKS_RIGHT_IRIS,
			{ color: "#FF3030" }
		 );
		 drawingUtils.drawConnectors(
			landmarks,
			FaceLandmarker.FACE_LANDMARKS_LEFT_IRIS,
			{ color: "#30FF30" }
		 );
	}
	
	async update() {
		const video = this.video;
		const canvasElement = this.canvas;
		canvasElement.width = video.videoWidth;
		canvasElement.height = video.videoHeight;
		// Now let's start detecting the stream.
		let startTimeMs = performance.now();
		if (this.lastVideoTime !== video.currentTime) {
			this.lastVideoTime = video.currentTime;
		  	this.results = this.faceLandmarker.detectForVideo(video, startTimeMs);
		}
		// console.log(this.results.faceLandmarks);
		if (this.results.faceLandmarks) {
			for (const landmarks of this.results.faceLandmarks) {
				// console.log(this.getVertices(landmarks, FaceLandmarker.FACE_LANDMARKS_TESSELATION))
				this.updateLandmarks(landmarks)
			}
		}
	 }

	 draw(){
		this.drawFaceMask();
		this.drawMesh();
	 }
}

export { MediaPipeProcessor };
