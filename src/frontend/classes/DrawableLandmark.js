import { FACE_LANDMARKS } from "../../backend/Definitions.js";
const DEF_TIME = 0.04;
class Interpolation {
	static clamp = (a, min = 0, max = 1) => Math.min(max, Math.max(min, a));
	static linear = (x) => x;
	static lerp = (start, end, d) => start + (end - start) * d;
	static ease = (x) => (Math.cos(Math.PI * x) + 1) / 2;
	static easeIn = (x) => x * x;
	static flip = (x) => 1 - x;
	static easeOut = (x) => Interpolation.flip(Interpolation.flip(x) * Interpolation.flip(x));
	static easeInOut = (x) => Interpolation.lerp(Interpolation.easeIn(x), Interpolation.easeOut(x), x);
	static spikeInterpolation = function (x) {
		if (x <= 0.5) {
			return Interpolation.easeIn(x / 0.5);
		}
		return x;
	};
	static easeOutBounce = (x) => {
		const n1 = 7.5625;
		const d1 = 2.75;

		if (x < 1 / d1) {
			return n1 * x * x;
		} else if (x < 2 / d1) {
			return n1 * (x -= 1.5 / d1) * x + 0.75;
		} else if (x < 2.5 / d1) {
			return n1 * (x -= 2.25 / d1) * x + 0.9375;
		} else {
			return n1 * (x -= 2.625 / d1) * x + 0.984375;
		}
	};
	static invlerp = (from, to, a) => Interpolation.clamp((a - from) / (to - from));
	static range = (from, to, a) => Interpolation.lerp(to[0], to[1], Interpolation.invlerp(from[0], from[1], a));
	static rangeXY = (fromX, fromY, toX, toY, a) => Interpolation.lerp(toX, toY, Interpolation.invlerp(fromX, fromY, a));
}

// https://gizma.com/easing/
const INTERP_FUNCTIONS = {
	linear: { name: "Linear", fun: Interpolation.linear },
	ease: { name: "Ease", fun: Interpolation.ease },
	invlerp: { name: "Inverse Linear", fun: Interpolation.invlerp },
	range: { name: "Range", fun: Interpolation.range },
	rangeXY: { name: "rangeXY", fun: Interpolation.rangeXY },
	ease: { name: "Ease", fun: Interpolation.ease },
	easeIn: { name: "Ease-In", fun: Interpolation.easeIn },
	flip: { name: "Flip", fun: Interpolation.rangeXY },
	easeOut: { name: "Ease-Out", fun: Interpolation.easeOut },
	easeInOut: { name: "Ease In and Out", fun: Interpolation.easeInOut },
	easeOutBounce: { name: "easeOutBounce", fun: Interpolation.easeOutBounce },
	spike: { name: "Spike Interpolation", fun: Interpolation.spikeInterpolation },
};

class AnimatedValue {
	constructor(value, props) {
		this.currentValue = value;
		this._to = value;
		this._from = value;
		this.props = props;
		this.elapsed = 0;
		this.onCompleted = () => {};
	}

	get interpTime() {
		return this.props.interpTime;
	}

	get interpFun() {
		return this.props.interpFun;
	}

	get value() {
		return this.currentValue;
	}

	set value(val) {
		this.currentValue = val;
	}

	clamp(a, min = 0, max = 1) {
		return Math.min(max, Math.max(min, a));
	}

	lerp(start, end, d) {
		return start + (end - start) * d;
	}

	// D is the distance in time to the total animation time
	// So if the total animation time is 2s and the elapsed time is 1.s then d = 0.5
	// if the interpolation function does nothing then it is essentially the same as a linear interpolation
	update(deltaTime) {
		if (!this.running) {
			return;
		}
		if (this.elapsed < this.interpTime) {
			this.elapsed += deltaTime;
			let elapsedRatio = this.clamp(this.elapsed / this.interpTime, 0, 1);
			// console.log(`Interp time: ${elapsedRatio} (${this.elapsed} / ${this.interpTime})`)
			// console.log(`Interp: value ${this.currentValue} - ${this._to} = ${Math.abs(this.currentValue - this._to)}`);
			this.currentValue = this.lerp(this._from, this._to, this.interpFun.fun(elapsedRatio));
		} else if (Math.abs(this.currentValue - this._to) <= 0.001) {
			this.running = false;
			this.onCompleted(this._to);
			// console.log(`Interp value reached ${this.currentValue} - ${this._to} = ${Math.abs(this.currentValue - this._to)}`);
		} else {
			this.onCompleted(this._to);
			this.running = false;
			// console.log(`Interp time reached: ${this.elapsed} / ${this.interpTime}`)
		}
	}

	updateValue(newValue) {
		this._to = newValue;
		this._from = this.currentValue;
		this.elapsed = 0;
		this.running = true;
	}

	setValue(newValue) {
		this._to = newValue;
		this._from = newValue;
		this.currentValue = newValue;
		this.elapsed = this.interpTime + 1;
		this.running = false;
	}
}

class AnimatedPoint {
	constructor(pX, pY, ...props) {
		this.animX = new AnimatedValue(pX, ...props);
		this.animY = new AnimatedValue(pY, ...props);
	}

	get x() {
		return this.animX.value;
	}

	get y() {
		return this.animY.value;
	}

	set x(value) {
		this.animX.updateValue(value);
	}

	set y(value) {
		this.animY.updateValue(value);
	}

	update(deltaTime) {
		this.animX.update(deltaTime);
		this.animY.update(deltaTime);
	}

	updatePosition(posX, posY) {
		this.animX.updateValue(posX);
		this.animY.updateValue(posY);
	}

	setPosition(posX, posY) {
		this.animX.setValue(posX);
		this.animY.setValue(posY);
	}
}

class DrawableLandmark {
	// new DrawableLandmark({ name:"JawOutline", pointsIdx:[0,1,2,3,...,17], scale:[1, 1], visible:true, pointSize:2, pointColor:"#f00", drawMask:true }),
	setData(data = null) {
		this.name = data.name ?? "Landmark";
		this.scale = data.scale ?? [1, 1];
		this.visible = data.visible ?? true;
		this.showPoints = data.showPoints ?? true;
		this.pointSize = data.pointSize ?? 5;
		this.pointColor = data.pointColor ?? "fff";
		this.drawMask = data.drawMask ?? true;
		this.closedPath = data.closedPath ?? false;
		this.interpFun = data.interpFun ?? INTERP_FUNCTIONS.easeInOut;
		this.interpTime = data.interpTime ?? DEF_TIME;
	}

	reset() {
		this.setData(this.data);
	}
	constructor(data = null) {
		this.name = "Landmark";
		this.scale = [1, 1];
		this.visible = true;
		this.showPoints = true;
		this.closedPath = false;
		this.pointSize = 5;
		this.pointColor = "fff";
		this.drawMask = true;
		this.interpFun = INTERP_FUNCTIONS.easeInOut;
		this.interpTime = DEF_TIME;
		this.data = data ?? {};
		this.setData(this.data);

		this.points = [];
		this.lastPointIdx = 0;
		this.rotation = 1;
		this.centerPoint = new AnimatedPoint(0, 0, this);
		this.radius = new AnimatedValue(0, this);
		this.lastUpdate = performance.now();
		this.deltaTime = 0;
		this.useGradientMask = true;
		// console.log(`New Drawable Landmark ${this.name}. Point: ${this.pointSize} ${this.pointColor}. Interpolation ${this.interpFun.name} ${this.interpTime}`);
	}

	updateAnimations() {
		this.deltaTime = (performance.now() - this.lastUpdate) / 1000;
		this.lastUpdate = performance.now();
		for(let i = 0; i < this.lastPointIdx; i++) {
			let p = this.points[i]
			p?.update(this.deltaTime);
		}
		this.updateCentroid(this.deltaTime);
	}

	// The centroid and the radius are not animated by themselves, they just take the value updated by the animated points
	// So it should be automatically animated if the points it's calculated from are animated
	updateCentroid(deltaTime, animated = false) {
		if (!animated) {
			let updatedCenter = this.getCenterPoint(this.points);
			// console.log(`${this.name} Updated Center x: ${updatedCenter.x}, y: ${updatedCenter.y}`)
			this.centerPoint.setPosition(updatedCenter.x, updatedCenter.y);
			this.radius.setValue(updatedCenter.radius);
		} else {
			let prevX = this.centerPoint.x;
			let prevY = this.centerPoint.y;
			let prevRadius = this.radius.value;
			this.centerPoint.update(this.deltaTime);
			this.radius.update(this.deltaTime);
			// console.log(`Delta Time: ${this.deltaTime}`)
			// console.log(`${this.name} Center x: ${prevX} -> ${this.centerPoint.x}, y: ${prevY} -> ${this.centerPoint.y}, radius: ${prevRadius} -> ${this.radius.value}`)
		}
	}

	updatePoints(newPoints) {
		if(newPoints){
			if (this.points.length > 0 && newPoints.length > this.points.length) {
				console.warn(
					`Number of new points does not match the number of points for landmark ${this.name}. Landmark Points: ${this.points.length} \n New points: ${newPoints.length}`
				);
			}
			for(let i = 0; i < newPoints.length; i++) {
				const newP = newPoints[i];
				// console.log(`P[${i}]`, newP)
				if(!newP) continue;
				if (i >= this.points.length) {
					this.points.push(new AnimatedPoint(newP.x, newP.y, this, this));
				}
				// this.points[i].setPosition(newP.x, newP.y); // Immediate
				this.points[i].updatePosition(newP.x, newP.y); // Goes through the interpolation
			}
			this.lastPointIdx = newPoints.length;
		}
		this.updateAnimations();
	}


	setRotation(degrees) {
		this.rotation = degrees * (Math.PI / 180);
	}

	getDistance(x1, y1, x2, y2) {
		let y = y2 - y1;
		let x = x2 - x1;
		return Math.sqrt(x * x + y * y);
	}

	getCenterPoint(p) {
		if (p.length == 1) {
			return { x: p[0].x, y: p[0].y, radius: 0 };
		}
		//Set initial min and max values
		var minX = p[0].x,
			maxX = p[0].x,
			minY = p[0].y,
			maxY = p[0].y;

		for (var i = 0; i < p.length; i++) {
			if (p[i].x < minX) {
				minX = p[i].x;
			}
			if (p[i].x > maxX) {
				maxX = p[i].x;
			}
			if (p[i].y < minY) {
				minY = p[i].y;
			}
			if (p[i].y > maxY) {
				maxY = p[i].y;
			}
		}
		var maxDist = this.getDistance(maxX, maxY, minX, minY);
		return { x: (maxX + minX) / 2, y: (maxY + minY) / 2, radius: maxDist };
	}

	drawEllipticalGradient(ctx, x, y, radius, pScaleX, pScaleY) {
		let boundingRectW = radius.value * pScaleX; // Hardcoding widescreen width scaling... Oh well...
		let boundingRectH = radius.value * pScaleY;
		let rx = boundingRectW * 0.5 * (Math.cos(this.rotation) + 1); //smaller than the max width
		let ry = boundingRectH * 0.5 * (Math.sin(this.rotation) + 1);
		let scaleX = 1;
		let invScaleX = 1;
		let scaleY = 1;
		let invScaleY = 1;
		let center1 = { x: x, y: y };
		let center2 = { x: x, y: y };
		let radius1 = 0;
		let radius2 = 0;
		if (rx >= ry) {
			radius2 = rx;
			scaleY = ry / rx;
			invScaleY = rx / ry;
			center1.x = x;
			center1.y = y * invScaleY;
			center2.x = x;
			center2.y = y * invScaleY;
		} else {
			radius2 = ry;
			scaleX = rx / ry;
			invScaleX = ry / rx;
			center1.x = x * invScaleX;
			center1.y = y;
			center2.x = x * invScaleX;
			center2.y = y;
		}
		// console.log("Radial gradient ", center1.x, center1.y, radius1, center2.x, center2.y, radius2)
		const maskGradient = ctx.createRadialGradient(center1.x, center1.y, radius1, center2.x, center2.y, radius2);
		// const maskGradient = ctx.createRadialGradient(x, y, 0, x, y, Math.min(rx, ry));
		// Opaque white in the middle, Transparent white at the borders
		const baseColor = "0,0,0"; //"255,255,255";
		maskGradient.addColorStop(0.0, `rgba(${baseColor}, 1)`);
		maskGradient.addColorStop(0.5, `rgba(${baseColor}, 0.7)`);
		maskGradient.addColorStop(0.9, `rgba(${baseColor}, 0.1)`);
		maskGradient.addColorStop(1.0, `rgba(${baseColor}, 0)`);

		ctx.fillStyle = maskGradient;
		ctx.setTransform(scaleX, 0, 0, scaleY, 0, 0);
		boundingRectW = boundingRectW * 2; // Need to increase the size of the bounding box to avoid the ellipse being clipped abruptly
		boundingRectH = boundingRectH * 2; // Need to increase the size of the bounding box to avoid the ellipse being clipped abruptly
		ctx.fillRect(
			(x - boundingRectW * 0.5) * invScaleX,
			(y - boundingRectH * 0.5) * invScaleY,
			boundingRectW * invScaleX,
			boundingRectH * invScaleY
		);
		ctx.setTransform(1, 0, 0, 1, 0, 0);
	}

	drawEllipse(ctx, x, y, radius, scaleX, scaleY) {
		let boundingRectW = radius.value * 0.5 * scaleX;
		let boundingRectH = radius.value * 0.5 * scaleY;
		let ellipseRadiusX = boundingRectW * (Math.cos(this.rotation) + 1);
		let ellipseRadiusY = boundingRectH * (Math.sin(this.rotation) + 1);
		ctx.ellipse(x, y, ellipseRadiusX, ellipseRadiusY, 0, 0, 2 * Math.PI);
		ctx.fill(); // Could be called outside
	}
	// https://developer.mozilla.org/en-US/docs/Web/API/Canvas_API/Tutorial/Compositing
	// https://www.w3schools.com/jsref/tryit.asp?filename=tryhtml5_canvas_globalcompop_all
	/**
	 * The canvas is actually just an overlay
	 * The image of the video itself is a <video> HTML component underneath
	 * What we need to do is to draw a full black rectangle and cutting out the areas where the landmarks are
	 * In this case we can draw a full black rectangle with "fillRect" and then cut out the "holes" with "destination-out"
	 */
	drawClippingMask(ctx, debug = false) {
		// ctx.globalCompositeOperation = "destination-out";
		// console.log(`${this.name}: [${this.centerData.x}, ${this.centerData.y}], radius: ${this.centerData.radius}` );
		ctx.beginPath();

		/**
		 * So I've tried to use the angle given by face api, Roll seems to be the one that detects the face rotating on the screen
		 * However, that gave weird results with the ellipse, so I changed it to calculating the ellipse width and height according to that rotation instead
		 */
		const elScale = 1.6;
		if (this.useGradientMask) {
			this.drawEllipticalGradient(
				ctx,
				this.centerPoint.x,
				this.centerPoint.y,
				this.radius,
				this.scale[0] * elScale,
				this.scale[1] * elScale
			);
		} else {
			this.drawEllipse(ctx, this.centerPoint.x, this.centerPoint.y, this.radius, this.scale[0], this.scale[1]);
		}

		ctx.closePath();
		// ctx.globalCompositeOperation = "source-over";
	}

	drawCentroid(ctx, debug = false) {
		if (!this.showPoints) return;
		ctx.beginPath();
		ctx.fillStyle = "blue";
		ctx.arc(this.centerPoint.x, this.centerPoint.y, this.pointSize, 0, 2 * Math.PI);
		ctx.fill();
		ctx.closePath();
	}

	drawPoints(ctx, debug = false) {
		if (!this.showPoints) return;
		if (debug) {
			console.log(this.name, this.points);
		}
		ctx.fillStyle = this.pointColor;
		ctx.strokeStyle = "#ffffff"
		ctx.lineWidth = 2;

		ctx.beginPath();
		for(let i = 0; i < this.lastPointIdx; i++) {
			let p = this.points[i];
			if(!p) continue;
			if(i <= 0){
				ctx.moveTo(p.x, p.y);
			} else{
				ctx.lineTo(p.x, p.y);
			}
		}
		if(this.closedPath) ctx.lineTo(this.points[0].x, this.points[0].y)
		ctx.stroke();
		ctx.closePath();
		
		for(let i = 0; i < this.lastPointIdx; i++) {
			let p = this.points[i];
			if(!p) continue;
			ctx.beginPath();
			ctx.arc(p.x, p.y, this.pointSize, 0, 2 * Math.PI);
			ctx.fill();
			ctx.closePath();
		}
	}
}

// Points positions are defined here: https://github.com/justadudewhohacks/face-api.js/blob/master/src/frontend/classes/FaceLandmarks68.ts
// Alternatively, one could use reflection to just call the function by name. I just find it easier to pass the list of points and let the landmark object updates itself
// PointsRange (now PointsIdx) refers to which points belong to the landmark in the list of landmark positions so pointsIdx=[i1, i2, i3] would use the points landmarks[i1], landmarks[i2] etc...
// If pointsRange (now PointsIdx) is [] or [0,0] or in general i and j are such that j <= i, the whole list of given positions will be used
const defLandData = {
	name: "Test",
	scale: [1, 1],
	pointSize: 2,
	pointColor: "#f00",
	drawMask: true,
	interpFun: INTERP_FUNCTIONS.easeInOut,
	interpTime: DEF_TIME,
	visible: false,
	closedPath: false,
	showPoints: true
};

let CustomLandmarkSettings = {};

console.log("Loading json module");
// https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Operators/import
// if (typeof window === "undefined") {
//   myModule = await import("module-used-on-server");
// } else {
//   myModule = await import("module-used-in-browser");
// }
try {
	let settings = await import("../../../data/CustomLandmarkSettings.json");
	CustomLandmarkSettings = settings.default;
	console.log(CustomLandmarkSettings);
} catch (e) {
	console.error("Exception loading module CustomLandmarkSettings.json: " + e, e);
}
// CustomLandmarkSettings = JSON.parse(jsonData)
// import CustomLandmarkSettings from "../../../data/CustomLandmarkSettings.json"

const range = (from, to) => Array(to-from).fill(0).map((_, i) => from+i)
let CustomLandmarks = [
	{ ...defLandData, name: FACE_LANDMARKS.JAWOUTLINE, 	 },
	{ ...defLandData, name: FACE_LANDMARKS.LEFTEYEBROW, 	 },
	{ ...defLandData, name: FACE_LANDMARKS.RIGHTEYEBROW, 	 },
	{ ...defLandData, name: FACE_LANDMARKS.NOSE, 			 scale: [0.5, 1], 	 },
	{ ...defLandData, name: FACE_LANDMARKS.LEFTEYE, 		 scale: [1.5, 1.35], 	closedPath: true },
	{ ...defLandData, name: FACE_LANDMARKS.RIGHTEYE, 		 scale: [1.5, 1.35], 	closedPath: true },
	{ ...defLandData, name: FACE_LANDMARKS.MOUTH, 			 scale: [0.8, 0.8], 		closedPath: true },
];

CustomLandmarks = CustomLandmarks.map((l, i) => {
	if (l.name in CustomLandmarkSettings) {
		// l = {...l, ...CustomLandmarkSettings[l.name]}
		l = { ...l, scale: CustomLandmarkSettings[l.name]?.scale };
	}
	return new DrawableLandmark(l);
});

export { CustomLandmarks, DEF_TIME };
