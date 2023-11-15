import VideoProcessor from "./VideoProcessor.js";
// import * as faceapi from "face-api.js"; // Updated face-api, check below
import * as faceapi from "@vladmandic/face-api/dist/face-api.esm.js"; // https://github.com/vladmandic/face-api
import { CustomLandmarks } from "./DrawableLandmark.js";
import { FACE_LANDMARKS } from "../../backend/Definitions.js";

// faceapi doc: https://justadudewhohacks.github.io/face-api.js/docs/index.html
class FaceProcessor extends VideoProcessor {
	getLandmarkPoints(landmark, points) {
		return null;
	}

	constructor(overrides = null, canvas = null, video = null, landSettings = null) {
		super(overrides, canvas, video);
		this.landSettings = landSettings ?? CustomLandmarks;
		this.landmarks = null;
		this.showPoints = false;
		this.allVisible = true;
		this.invertedMask = false;
	}

	setMaskData(maskFeatures = null) {
		this.allVisible = true;
		if (maskFeatures == null || maskFeatures?.length <= 0) {
			for (let l of this.landSettings) {
				l.visible = true;
			}
		} else {
			for (let l of this.landSettings) {
				l.visible = false;
				for (let feature of maskFeatures) {
					if (l.name.toUpperCase() == feature.toUpperCase()) {
						l.visible = true;
						break;
					}
				}
				this.allVisible = this.allVisible && l.visible;
				// console.log(`Updated Mask Data ${l.name} ${l.visible}` )
			}
		}
	}

	updateLandmarks(landPositions, landData){
		this.landmarks = landPositions;
		this.allVisible = true;
		for (let l of this.landSettings) {
			this.allVisible = this.allVisible && l.visible;
			try {
				if(landPositions){
					l.updatePoints(this.getLandmarkPoints(l, landPositions));
				}
				if (landData) {
					l.setRotation(landData.angle.roll);
				} else {
					l.setRotation(1);
				}
			} catch (error) {
				console.log(`Error updating FaceProcessor landmark points for ${l.name} ${error}`);
			}
		}
	}

	drawLandmarks(){
		if(!this.showPoints) return;
		for (let l of this.landSettings) {
			l.drawPoints(this.ctx);
			l.drawCentroid(this.ctx, false);
		}
	}

	drawFaceMask() {
		// I need to draw the cutout/clipping maskes first and then draw the landmarks on top, i can't do both in the same loop as the clipping masks of the next
		// Points would override the previous landmark points
		if (!this.allVisible && this.landSettings) {
			if (!this.invertedMask) {
				this.ctx.fillStyle = "black";
				this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
				this.ctx.globalCompositeOperation = "destination-out";
			}
			for (let l of this.landSettings) {
				if (!l.visible || !l.drawMask) continue;
				try {
					l.drawClippingMask(this.ctx);
				} catch (error) {
					console.warn("Error drawing clipping mask", error.message);
				}
			}
			this.ctx.globalCompositeOperation = "source-over";
		}
		this.detectionsUpdated = false;
	}
}

export { FaceProcessor };
