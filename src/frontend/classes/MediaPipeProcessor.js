import VideoProcessor from "./VideoProcessor.js";
import { DrawingUtils, FilesetResolver, FaceLandmarker } from "@mediapipe/tasks-vision";
import { CustomLandmarks } from "./DrawableLandmark.js"
const runningMode = "VIDEO";

 class MediaPipeProcessor extends VideoProcessor {
	constructor(overrides = null, canvas = null, video=null, landmarksData=null) {
		super(overrides, canvas), video;

		this.landmarksData = landmarksData ?? CustomLandmarks;
		this.faceLandmarker = null;
		this.ctx = null;
		this.results = null;
		this.lastVideoTime = -1;
	}

   setMaskData(maskFeatures=null){
		this.allVisible = true;
		if(maskFeatures == null || maskFeatures?.length <= 0){
			for (let l of this.landmarksData){
				l.visible = true;
			}
		}
		else{
			for (let l of this.landmarksData){
				l.visible = false;
				for(let feature of maskFeatures){
					if(l.name.toUpperCase() == feature.toUpperCase()){
						l.visible = true;
						break;
					}
				}
				this.allVisible = this.allVisible && l.visible;
				// console.log(`Updated Mask Data ${l.name} ${l.visible}` )
			}
		}
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
			const drawingUtils = new DrawingUtils(this.ctx);
		  for (const landmarks of this.results.faceLandmarks) {
			 drawingUtils.drawConnectors(
				landmarks,
				FaceLandmarker.FACE_LANDMARKS_TESSELATION,
				{ color: "#C0C0C070", lineWidth: 1 }
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
		}
	 }
	
}

export { MediaPipeProcessor };
