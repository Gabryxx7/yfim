import VideoProcessor from "./VideoProcessor.js";
// import * as faceapi from "face-api.js"; // Updated face-api, check below
import * as faceapi from "@vladmandic/face-api"; // https://github.com/justadudewhohacks/face-api.js/issues?q=undefined+backend+#issuecomment-681001997
import { LandmarksData } from "../classes/DrawableLandmark.js"


// faceapi doc: https://justadudewhohacks.github.io/face-api.js/docs/index.html
export default class FaceProcessor extends VideoProcessor {
	constructor(overrides = null, canvas = null, video=null) {
		super(overrides, canvas), video;
		this.detections = null;
		this.detectionsUpdated = false;
		this.ctx = null;
      this.recording = false;
      this.chunks = [];
	}

   setMaskData(maskData){
		for (let l of LandmarksData){
			if(maskData.visibleFeatures == null || maskData.visibleFeatures.length <= 0){
				l.visible = true;
				continue;
			}
			l.visible = false;
			for(let feature of maskData.visibleFeatures){
				if(l.name.toUpperCase() == feature.toUpperCase()){
					l.visible = true;
					break;
				}
			}
			// console.log(`Updated Mask Data ${l.name} ${l.visible}` )
		}
   }

   startRecording(session){
      delete this.chunks;
      this.chunks = [];
		this.chunks.push(session.getSessionData());
      this.recording = true;
   }

   stopRecording(filename){
      this.recording = false;
      // console.log(this.chunks[0])
      // const blob = new Blob(this.chunks, {type: "text/plain;charset=utf-8"});
      const blob = new Blob([JSON.stringify(this.chunks)], {type: "text/plain;charset=utf-8"});
      // FileSaver.saveAs(blob, `${filename}.json`);
		return blob;
      // const videos = this.state.videos.concat([videoURL]);
      // this.setState({ videos });
   }

	async loadModels() {
		// load faceapi models for detection
		console.info("++ loading model");
		await faceapi.tf.setBackend("webgl"); // Or 'wasm'
		const MODEL_URL = "/models";
		const tinyFaceDetectorModel = await faceapi.loadTinyFaceDetectorModel(MODEL_URL);
		const faceLandmarkModel = await faceapi.loadFaceLandmarkModel(MODEL_URL);
		const faceRecognitionModel = await faceapi.loadFaceRecognitionModel(MODEL_URL);
		const faceExpressionModel = await faceapi.loadFaceExpressionModel(MODEL_URL);
	}

	async init() {
		const tmpCanvas = faceapi.createCanvasFromMedia(this.video);

		const displaySize = {
			width: tmpCanvas.width,
			height: tmpCanvas.height,
		};
		faceapi.matchDimensions(this.canvas, displaySize);
		this.ctx = this.canvas.getContext("2d");
		// console.log(this.canvas.width, this.canvas.height);
	}

	async update() {
		// let currentVideoSource = remoteVideo.current;
		// if(remoteVideo == null){
		//    currentVideoSource = localVideo.current;
		//   console.warn("No remote video source, using local video for face api detection");
		// }
		try {
			const newDetections = await faceapi
				.detectSingleFace(this.video, new faceapi.TinyFaceDetectorOptions())
				.withFaceLandmarks()
				.withFaceExpressions();
			if (newDetections != undefined && newDetections != null) {
				this.detections = newDetections;
            if(this.recording){
               const data = {};
               data.landmarks = [];
               for (let l of LandmarksData) {
                  data.landmarks.push({name: l.name, points: l.getUpdatedPoints(this.detections.landmarks.positions)});
               }
               data.expressions = this.detections.expressions.asSortedArray();
               data.class = {name: this.detections.detection.className, score: this.detections.detection.classScore}
               data.score = this.detections.detection.score;
               data.imageDims = this.detections.detection.imageDims;
               data.box = this.detections.detection.box;
               data.angle = this.detections.angle;
               // this.chunks.push(JSON.stringify(data));
               this.chunks.push(data);
            }
			}
			this.detectionsUpdated = true;
			// console.log("detections", this.detections);
		} catch (error) {
			console.error(`ERROR detecting single face ${error}`);
			this.detectionsUpdated = false;
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
	}

	// Draw a mask over face/screen
	draw() {
		if (this.detections != null && this.detectionsUpdated) {
			let imHeight = this.detections.detection.imageHeight;
			let imWidth = this.detections.detection.imageWidth;
			let cHeight = this.ctx.canvas.clientHeight;
			let cWidth = this.ctx.canvas.clientWidth;
			let ctxHeight = this.ctx.canvas.height;
			let ctxWidth = this.ctx.canvas.width;
			let bHeight = this.ctx.canvas.getBoundingClientRect().height;
			let bWidth = this.ctx.canvas.getBoundingClientRect().width;

			let imgWidthR = this.detections.detection.imageWidth;
			let imgHeightR = this.detections.detection.imageHeight;

			let resized = faceapi.resizeResults(this.detections, { width: ctxWidth, height: ctxHeight }); // For some reason it's not quite centered
			imgWidthR = resized.detection.imageWidth;
			imgHeightR = resized.detection.imageHeight;

			// console.log(`Image: ${imWidth} x ${imHeight}\nImage Resized: ${imWidthR} x ${imHeightR}\nClient: ${cWidth} x ${cHeight}\nBounding: ${bWidth} x ${bHeight}`)
			// detections = faceapi.resizeResults(detections, { width: this.ctx.canvas.clientWidth, height: this.ctx.canvas.clientHeight })
			const landmarks = resized.landmarks;
			// console.log("landmarks", landmarks);
			for (let l of LandmarksData) {
				l.updatePointsFromLandmark(landmarks.positions);
				l.setRotation(resized.angle.roll);
			}
			// I need to draw the cutout/clipping maskes first and then draw the landmarks on top, i can't do both in the same loop as the clipping masks of the next
			// Points would override the previous landmark points
         var canvasCleared = false;
			for (let l of LandmarksData) {
            if(!l.visible) continue;
				if (l.drawMask) {
               if(!canvasCleared){
                  this.ctx.fillStyle = "black";
                  this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
                  canvasCleared = true;
               }
					try {
						l.drawClippingMask(this.ctx);
					} catch (error) {
						console.warn("Error drawing clipping mask", error.message);
					}
				}
			}
			this.detectionsUpdated = false;
		}

		// for(let l of LandmarksData){
		//   l.drawPoints(ctx)
		//   l.drawCentroid(ctx, false)
		// }

		// This is just a quick test to check whether the animated value/points structure works
		// if(updateCenterOffsetInterval == null) updateCenterOffsetInterval = setInterval(() => {centerOffset = randomInRange(-200, 200)}, 2000);
		// centerLandmarkPoint.updatePoints([ {x: imgWidthR * 0.5 + centerOffset, y: imgHeightR * 0.5 + centerOffset}]);
		// centerLandmarkPoint.drawPoints(ctx);
		// window.requestAnimationFrame(() => drawCanvas());
	}
}
