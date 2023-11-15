import VideoProcessor from "./VideoProcessor.js";
// import * as faceapi from "face-api.js"; // Updated face-api, check below
import * as faceapi from '@vladmandic/face-api/dist/face-api.esm.js'; // https://github.com/vladmandic/face-api
import { CustomLandmarks } from "./DrawableLandmark.js"
import { FACE_LANDMARKS } from "../../backend/Definitions.js";
import { FaceProcessor } from "./FaceProcessor.js";

const range = (from, to) => Array(to-from).fill(0).map((_, i) => from+i)
const landmarksPointsIdx = {
   [FACE_LANDMARKS.JAWOUTLINE]: 		range(0, 17),
   [FACE_LANDMARKS.LEFTEYEBROW]: 	range(17, 22),
   [FACE_LANDMARKS.RIGHTEYEBROW]: 	range(22, 27),
   [FACE_LANDMARKS.NOSE]: 				range(27, 36),
   [FACE_LANDMARKS.LEFTEYE]: 			range(36, 42),
   [FACE_LANDMARKS.RIGHTEYE]: 		range(42, 48),
   [FACE_LANDMARKS.MOUTH]: 			range(48, 68),
}

// faceapi doc: https://justadudewhohacks.github.io/face-api.js/docs/index.html
class FaceApiProcessor extends FaceProcessor {
	getLandmarkPoints(landmark, points){
		if(!points) return;
		const newPointsIdx = landmarksPointsIdx[landmark.name];
		if(!newPointsIdx) return;
		const newPoints = newPointsIdx.map(i => points[i])
		// console.log(landmark.name, newPointsIdx, newPoints.map(p =>[p.x, p.y]))
		return newPoints
	}

	async init() {
		// load faceapi models for detection
		console.info("++ loading model");
	  	await faceapi.tf?.setWasmPaths(`https://cdn.jsdelivr.net/npm/@tensorflow/tfjs-backend-wasm@${faceapi.tf.version_core}/dist/`);

		await faceapi.tf.setBackend("webgl"); // Or 'wasm'
		await faceapi.tf.ready();
		if (faceapi.tf?.ENV.flagRegistry.CANVAS2D_WILL_READ_FREQUENTLY){
			faceapi.tf.ENV.set('CANVAS2D_WILL_READ_FREQUENTLY', true);
		}
		if (faceapi.tf?.ENV.flagRegistry.WEBGL_EXP_CONV){
			faceapi.tf.ENV.set('WEBGL_EXP_CONV', true);
		}
		
		const MODEL_URL = "/models";
		await faceapi.nets.ssdMobilenetv1.load(MODEL_URL);
		await faceapi.nets.faceLandmark68TinyNet.load(MODEL_URL)
		await faceapi.nets.faceLandmark68Net.load(MODEL_URL);
		await faceapi.nets.faceRecognitionNet.load(MODEL_URL);
		// await faceapi.nets.ageGenderNet.load(MODEL_URL);
		// await faceapi.nets.faceExpressionNet.load(MODEL_URL);
	}

	get lastFrame(){
		const data = {};
		data.landmarks = [];
		for(let l of this.landSettings) {
			data.landmarks.push({name: l.name, points: l.getUpdatedPoints(this.detections.landmarks.positions), visible: (this.allVisible || l.visible)});
		}
		data.expressions = this.detections.expressions.asSortedArray();
		data.class = {name: this.detections.detection.className, score: this.detections.detection.classScore}
		data.score = this.detections.detection.score;
		data.imageDims = this.detections.detection.imageDims;
		data.box = this.detections.detection.box;
		data.angle = this.detections.angle;
		return data;
	}

	async update() {
		try {
			const newDetections = await faceapi
				.detectSingleFace(this.video, new faceapi.SsdMobilenetv1Options())
				.withFaceLandmarks()
				// .withFaceExpressions();
			if (newDetections != undefined && newDetections != null) {
				this.detections = newDetections;
			}
			this.detectionsUpdated = true;
			// console.log("detections", this.detections);
		} catch (error) {
			console.error(`ERROR detecting single face ${error}`);
			this.detectionsUpdated = false;
		}
	}

	// Draw a mask over face/screen
	draw() {
		if (this.detections != null && this.detectionsUpdated) {
			let videoElHeight = this.video.getBoundingClientRect().height;
			let videoElWidth = this.video.getBoundingClientRect().width;

			// console.log("IMG: ", {imHeight, imWidth})
			// console.log("Client", {height: this.video.getBoundingClientRect().height, width: this.video.getBoundingClientRect().width})
			// console.log("CANVS", {ctxHeight, ctxWidth})
			if(videoElWidth <= 1 || videoElHeight <= 1){
				return;
			}
			this.canvas.height = this.video.videoHeight;
			this.canvas.width = this.video.videoWidth;
			let resized = faceapi.resizeResults(this.detections, { width: videoElWidth, height: videoElHeight }); // For some reason it's not quite centered
			resized = this.detections;
			// console.log(`Image: ${imWidth} x ${imHeight}\nClient: ${cWidth} x ${cHeight}\nCtx: ${ctxWidth} x ${ctxHeight}\nBounding: ${bWidth} x ${bHeight}`)
			// detections = faceapi.resizeResults(detections, { width: this.ctx.canvas.clientWidth, height: this.ctx.canvas.clientHeight })
			this.updateLandmarks(resized.landmarks.positions, resized);
         this.drawFaceMask();
         this.drawLandmarks();
		}
	}
}

export { FaceApiProcessor };
