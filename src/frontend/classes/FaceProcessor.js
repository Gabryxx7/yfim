import VideoProcessor from "./VideoProcessor.js";
// import * as faceapi from "face-api.js"; // Updated face-api, check below
import * as faceapi from '@vladmandic/face-api/dist/face-api.esm.js'; // https://github.com/vladmandic/face-api
import { CustomLandmarks } from "./DrawableLandmark.js"


// faceapi doc: https://justadudewhohacks.github.io/face-api.js/docs/index.html
class FaceProcessor extends VideoProcessor {
	constructor(overrides = null, canvas = null, video=null, landmarksData=null) {
		super(overrides, canvas), video;
		// this.landmarksData = landmarksData ?? structuredClone(CustomLandmarks); // Gives an error with structuredClone, hopefully the import is not a reference...
		this.landmarksData = landmarksData ?? CustomLandmarks;
		this.detections = null;
		this.detectionsUpdated = false;
		this.ctx = null;
		this.allVisible = true;
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
		for (let l of this.landmarksData) {
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
				this.allVisible = true;
				for (let l of this.landmarksData) {
					this.allVisible = this.allVisible && l.visible;
				}
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
			let imHeight = this.detections.detection.imageHeight;
			let imWidth = this.detections.detection.imageWidth;
			let cHeight = this.ctx.canvas.clientHeight;
			let cWidth = this.ctx.canvas.clientWidth;
			let videoElHeight = this.video.getBoundingClientRect().height;
			let videoElWidth = this.video.getBoundingClientRect().width;

			// console.log("IMG: ", {imHeight, imWidth})
			// console.log("Client", {height: this.video.getBoundingClientRect().height, width: this.video.getBoundingClientRect().width})
			// console.log("CANVS", {ctxHeight, ctxWidth})
			const finalHeight = videoElHeight;
			const finalWidth = videoElWidth;
			if(finalWidth <= 1 || finalHeight <= 1){
				return;
			}
			this.canvas.height = finalHeight;
			this.canvas.width = finalWidth;
			this.ctx.canvas.height = finalHeight;
			this.ctx.canvas.width = finalWidth;
			let resized = faceapi.resizeResults(this.detections, { width: finalWidth, height: finalHeight }); // For some reason it's not quite centered
			
			// console.log(`Image: ${imWidth} x ${imHeight}\nClient: ${cWidth} x ${cHeight}\nCtx: ${ctxWidth} x ${ctxHeight}\nBounding: ${bWidth} x ${bHeight}`)
			// detections = faceapi.resizeResults(detections, { width: this.ctx.canvas.clientWidth, height: this.ctx.canvas.clientHeight })
			const landmarks = resized.landmarks;
			// console.log("landmarks", landmarks);
			for (let l of this.landmarksData) {
				l.updatePointsFromLandmark(landmarks.positions);
				l.setRotation(resized.angle.roll);
			}
			// I need to draw the cutout/clipping maskes first and then draw the landmarks on top, i can't do both in the same loop as the clipping masks of the next
			// Points would override the previous landmark points
			if(!this.allVisible){
				var canvasCleared = false;
				for (let l of this.landmarksData) {
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
			}
			this.detectionsUpdated = false;
		}

		for(let l of this.landmarksData){
		  l.drawPoints(this.ctx)
		  l.drawCentroid(this.ctx, false)
		}

		// This is just a quick test to check whether the animated value/points structure works
		// if(updateCenterOffsetInterval == null) updateCenterOffsetInterval = setInterval(() => {centerOffset = randomInRange(-200, 200)}, 2000);
		// centerLandmarkPoint.updatePoints([ {x: imgWidthR * 0.5 + centerOffset, y: imgHeightR * 0.5 + centerOffset}]);
		// centerLandmarkPoint.drawPoints(ctx);
		// window.requestAnimationFrame(() => drawCanvas());
	}
}

export { FaceProcessor};
