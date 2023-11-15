import * as THREE from "three";
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls.js";
import { GUI } from "three/examples/jsm/libs/lil-gui.module.min";
// import * as guiControls from "./GUIControls.js"
import data from "./data.json";

/** */

const constants = {
	materials: {
		MeshBasicMaterial: "MeshBasicMaterial",
		MeshLambertMaterial: "MeshLambertMaterial",
		MeshMatcapMaterial: "MeshMatcapMaterial",
		MeshPhongMaterial: "MeshPhongMaterial",
		MeshToonMaterial: "MeshToonMaterial",
		MeshStandardMaterial: "MeshStandardMaterial",
		MeshPhysicalMaterial: "MeshPhysicalMaterial",
		MeshDepthMaterial: "MeshDepthMaterial",
		MeshNormalMaterial: "MeshNormalMaterial",
		LineBasicMaterial: "LineBasicMaterial",
	},
	combine: {
		"THREE.MultiplyOperation": THREE.MultiplyOperation,
		"THREE.MixOperation": THREE.MixOperation,
		"THREE.AddOperation": THREE.AddOperation,
	},
	side: {
		"THREE.DoubleSide": THREE.DoubleSide,
		"THREE.FrontSide": THREE.FrontSide,
		"THREE.BackSide": THREE.BackSide,
	},
	blendingMode: {
		"THREE.NoBlending": THREE.NoBlending,
		"THREE.NormalBlending": THREE.NormalBlending,
		"THREE.AdditiveBlending": THREE.AdditiveBlending,
		"THREE.SubtractiveBlending": THREE.SubtractiveBlending,
		"THREE.MultiplyBlending": THREE.MultiplyBlending,
		"THREE.CustomBlending": THREE.CustomBlending,
	},
	equations: {
		"THREE.AddEquation": THREE.AddEquation,
		"THREE.SubtractEquation": THREE.SubtractEquation,
		"THREE.ReverseSubtractEquation": THREE.ReverseSubtractEquation,
	},
	destinationFactors: {
		"THREE.ZeroFactor": THREE.ZeroFactor,
		"THREE.OneFactor": THREE.OneFactor,
		"THREE.SrcColorFactor": THREE.SrcColorFactor,
		"THREE.OneMinusSrcColorFactor": THREE.OneMinusSrcColorFactor,
		"THREE.SrcAlphaFactor": THREE.SrcAlphaFactor,
		"THREE.OneMinusSrcAlphaFactor": THREE.OneMinusSrcAlphaFactor,
		"THREE.DstAlphaFactor": THREE.DstAlphaFactor,
		"THREE.OneMinusDstAlphaFactor": THREE.OneMinusDstAlphaFactor,
	},
	sourceFactors: {
		"THREE.DstColorFactor": THREE.DstColorFactor,
		"THREE.OneMinusDstColorFactor": THREE.OneMinusDstColorFactor,
		"THREE.SrcAlphaSaturateFactor": THREE.SrcAlphaSaturateFactor,
	},
};

function getObjectsKeys(obj) {
	const keys = [];
	for (const key in obj) {
		if (obj.hasOwnProperty(key)) {
			keys.push(key);
		}
	}
	return keys;
}

const textureLoader = new THREE.TextureLoader();
const cubeTextureLoader = new THREE.CubeTextureLoader();

const envMaps = (function () {
	const path = "../../examples/textures/cube/SwedishRoyalCastle/";
	const format = ".jpg";
	const urls = [
		path + "px" + format,
		path + "nx" + format,
		path + "py" + format,
		path + "ny" + format,
		path + "pz" + format,
		path + "nz" + format,
	];

	const reflectionCube = cubeTextureLoader.load(urls);

	const refractionCube = cubeTextureLoader.load(urls);
	refractionCube.mapping = THREE.CubeRefractionMapping;

	return {
		none: null,
		reflection: reflectionCube,
		refraction: refractionCube,
	};
})();

const diffuseMaps = (function () {
	const bricks = textureLoader.load("../../examples/textures/brick_diffuse.jpg");
	bricks.wrapS = THREE.RepeatWrapping;
	bricks.wrapT = THREE.RepeatWrapping;
	bricks.repeat.set(9, 1);

	return {
		none: null,
		bricks: bricks,
	};
})();

const roughnessMaps = (function () {
	const bricks = textureLoader.load("../../examples/textures/brick_roughness.jpg");
	bricks.wrapT = THREE.RepeatWrapping;
	bricks.wrapS = THREE.RepeatWrapping;
	bricks.repeat.set(9, 1);

	return {
		none: null,
		bricks: bricks,
	};
})();

const matcaps = (function () {
	return {
		none: null,
		porcelainWhite: textureLoader.load("../../examples/textures/matcaps/matcap-porcelain-white.jpg"),
	};
})();

const alphaMaps = (function () {
	const fibers = textureLoader.load("../../examples/textures/alphaMap.jpg");
	fibers.wrapT = THREE.RepeatWrapping;
	fibers.wrapS = THREE.RepeatWrapping;
	fibers.repeat.set(9, 1);

	return {
		none: null,
		fibers: fibers,
	};
})();

const gradientMaps = (function () {
	const threeTone = textureLoader.load("../../examples/textures/gradientMaps/threeTone.jpg");
	threeTone.minFilter = THREE.NearestFilter;
	threeTone.magFilter = THREE.NearestFilter;

	const fiveTone = textureLoader.load("../../examples/textures/gradientMaps/fiveTone.jpg");
	fiveTone.minFilter = THREE.NearestFilter;
	fiveTone.magFilter = THREE.NearestFilter;

	return {
		none: null,
		threeTone: threeTone,
		fiveTone: fiveTone,
	};
})();

const envMapKeys = getObjectsKeys(envMaps);
const envMapKeysPBR = envMapKeys.slice(0, 2);
const diffuseMapKeys = getObjectsKeys(diffuseMaps);
const roughnessMapKeys = getObjectsKeys(roughnessMaps);
const matcapKeys = getObjectsKeys(matcaps);
const alphaMapKeys = getObjectsKeys(alphaMaps);
const gradientMapKeys = getObjectsKeys(gradientMaps);

function generateVertexColors(geometry) {
	const positionAttribute = geometry.attributes.position;

	const colors = [];
	const color = new THREE.Color();

	for (let i = 0, il = positionAttribute.count; i < il; i++) {
		color.setHSL((i / il) * Math.random(), 0.5, 0.5);
		colors.push(color.r, color.g, color.b);
	}

	geometry.setAttribute("color", new THREE.Float32BufferAttribute(colors, 3));
}

function handleColorChange(color) {
	return function (value) {
		if (typeof value === "string") {
			value = value.replace("#", "0x");
		}

		color.setHex(value);
	};
}

function needsUpdate(material, geometry) {
	return function () {
		material.side = parseInt(material.side); //Ensure number
		material.needsUpdate = true;
		if(geometry.attributes.position) geometry.attributes.position.needsUpdate = true;
		if(geometry.attributes.normal) geometry.attributes.normal.needsUpdate = true;
		if(geometry.attributes.color) geometry.attributes.color.needsUpdate = true;
	};
}

function updateCombine(material) {
	return function (combine) {
		material.combine = parseInt(combine);
		material.needsUpdate = true;
	};
}

function updateTexture(material, materialKey, textures) {
	return function (key) {
		material[materialKey] = textures[key];
		material.needsUpdate = true;
	};
}

function guiScene(gui, scene) {
	const folder = gui.addFolder("Scene");

	const data = {
		background: "#000000",
		"ambient light": app.light.color.getHex(),
	};

	folder.addColor(data, "ambient light").onChange(handleColorChange(app.light.color));

	guiSceneFog(folder, scene);
}

function guiSceneFog(folder, scene) {
	const fogFolder = folder.addFolder("scene.fog");

	const fog = new THREE.Fog(0x3f7b9d, 0, 60);

	const data = {
		fog: {
			"THREE.Fog()": false,
			"scene.fog.color": fog.color.getHex(),
		},
	};

	fogFolder.add(data.fog, "THREE.Fog()").onChange(function (useFog) {
		if (useFog) {
			scene.fog = fog;
		} else {
			scene.fog = null;
		}
	});

	fogFolder.addColor(data.fog, "scene.fog.color").onChange(handleColorChange(fog.color));
}

function guiMaterial(gui, mesh, material, geometry) {
	const folder = gui.addFolder("THREE.Material");
  material.side = THREE.DoubleSide;
  material.color = new THREE.Color("#b32d00");
  material.emissive = new THREE.Color("#000000");
  material.specular = new THREE.Color("#f50000");
  material.flatShading = true;
	folder.add(material, "transparent").onChange(needsUpdate(material, geometry));
	folder.add(material, "opacity", 0, 1).step(0.01);
	// folder.add( material, 'blending', constants.blendingMode );
	// folder.add( material, 'blendSrc', constants.destinationFactors );
	// folder.add( material, 'blendDst', constants.destinationFactors );
	// folder.add( material, 'blendEquation', constants.equations );
	folder.add(material, "depthTest");
	folder.add(material, "depthWrite");
	// folder.add( material, 'polygonOffset' );
	// folder.add( material, 'polygonOffsetFactor' );
	// folder.add( material, 'polygonOffsetUnits' );
	folder.add(material, "alphaTest", 0, 1).step(0.01).onChange(needsUpdate(material, geometry));
	folder.add(material, "alphaHash").onChange(needsUpdate(material, geometry));
	folder.add(material, "visible");
	folder.add(material, "side", constants.side).onChange(needsUpdate(material, geometry));
}

function guiMeshBasicMaterial(gui, mesh, material, geometry) {
	const data = {
		color: material.color.getHex(),
		envMaps: envMapKeys[0],
		map: diffuseMapKeys[0],
		alphaMap: alphaMapKeys[0],
	};

	const folder = gui.addFolder("THREE.MeshBasicMaterial");

	folder.addColor(data, "color").onChange(handleColorChange(material.color));
	folder.add(material, "wireframe");
	folder.add(material, "vertexColors").onChange(needsUpdate(material, geometry));
	folder.add(material, "fog").onChange(needsUpdate(material, geometry));

	folder.add(data, "envMaps", envMapKeys).onChange(updateTexture(material, "envMap", envMaps));
	folder.add(data, "map", diffuseMapKeys).onChange(updateTexture(material, "map", diffuseMaps));
	folder.add(data, "alphaMap", alphaMapKeys).onChange(updateTexture(material, "alphaMap", alphaMaps));
	folder.add(material, "combine", constants.combine).onChange(updateCombine(material));
	folder.add(material, "reflectivity", 0, 1);
	folder.add(material, "refractionRatio", 0, 1);
}

function guiMeshDepthMaterial(gui, mesh, material) {
	const data = {
		alphaMap: alphaMapKeys[0],
	};

	const folder = gui.addFolder("THREE.MeshDepthMaterial");

	folder.add(material, "wireframe");

	folder.add(data, "alphaMap", alphaMapKeys).onChange(updateTexture(material, "alphaMap", alphaMaps));
}

function guiMeshNormalMaterial(gui, mesh, material, geometry) {
	const folder = gui.addFolder("THREE.MeshNormalMaterial");

	folder.add(material, "flatShading").onChange(needsUpdate(material, geometry));
	folder.add(material, "wireframe");
}

function guiLineBasicMaterial(gui, mesh, material, geometry) {
	const data = {
		color: material.color.getHex(),
	};

	const folder = gui.addFolder("THREE.LineBasicMaterial");

	folder.addColor(data, "color").onChange(handleColorChange(material.color));
	folder.add(material, "linewidth", 0, 10);
	folder.add(material, "linecap", ["butt", "round", "square"]);
	folder.add(material, "linejoin", ["round", "bevel", "miter"]);
	folder.add(material, "vertexColors").onChange(needsUpdate(material, geometry));
	folder.add(material, "fog").onChange(needsUpdate(material, geometry));
}

function guiMeshLambertMaterial(gui, mesh, material, geometry) {
	const data = {
		color: material.color.getHex(),
		emissive: material.emissive.getHex(),
		envMaps: envMapKeys[0],
		map: diffuseMapKeys[0],
		alphaMap: alphaMapKeys[0],
	};

	const folder = gui.addFolder("THREE.MeshLambertMaterial");

	folder.addColor(data, "color").onChange(handleColorChange(material.color));
	folder.addColor(data, "emissive").onChange(handleColorChange(material.emissive));

	folder.add(material, "wireframe");
	folder.add(material, "vertexColors").onChange(needsUpdate(material, geometry));
	folder.add(material, "fog").onChange(needsUpdate(material, geometry));

	folder.add(data, "envMaps", envMapKeys).onChange(updateTexture(material, "envMap", envMaps));
	folder.add(data, "map", diffuseMapKeys).onChange(updateTexture(material, "map", diffuseMaps));
	folder.add(data, "alphaMap", alphaMapKeys).onChange(updateTexture(material, "alphaMap", alphaMaps));
	folder.add(material, "combine", constants.combine).onChange(updateCombine(material));
	folder.add(material, "reflectivity", 0, 1);
	folder.add(material, "refractionRatio", 0, 1);
}

function guiMeshMatcapMaterial(gui, mesh, material, geometry) {
	const data = {
		color: material.color.getHex(),
		matcap: matcapKeys[1],
		alphaMap: alphaMapKeys[0],
	};

	const folder = gui.addFolder("THREE.MeshMatcapMaterial");

	folder.addColor(data, "color").onChange(handleColorChange(material.color));

	folder.add(material, "flatShading").onChange(needsUpdate(material, geometry));
	folder.add(data, "matcap", matcapKeys).onChange(updateTexture(material, "matcap", matcaps));
	folder.add(data, "alphaMap", alphaMapKeys).onChange(updateTexture(material, "alphaMap", alphaMaps));
}

function guiMeshPhongMaterial(gui, mesh, material, geometry) {
	const data = {
		color: material.color.getHex(),
		emissive: material.emissive.getHex(),
		specular: material.specular.getHex(),
		envMaps: envMapKeys[0],
		map: diffuseMapKeys[0],
		alphaMap: alphaMapKeys[0],
	};

	const folder = gui.addFolder("THREE.MeshPhongMaterial");

	folder.addColor(data, "color").onChange(handleColorChange(material.color));
	folder.addColor(data, "emissive").onChange(handleColorChange(material.emissive));
	folder.addColor(data, "specular").onChange(handleColorChange(material.specular));

	folder.add(material, "shininess", 0, 100);
	folder.add(material, "flatShading").onChange(needsUpdate(material, geometry));
	folder.add(material, "wireframe");
	folder.add(material, "vertexColors").onChange(needsUpdate(material, geometry));
	folder.add(material, "fog").onChange(needsUpdate(material, geometry));
	folder.add(data, "envMaps", envMapKeys).onChange(updateTexture(material, "envMap", envMaps));
	folder.add(data, "map", diffuseMapKeys).onChange(updateTexture(material, "map", diffuseMaps));
	folder.add(data, "alphaMap", alphaMapKeys).onChange(updateTexture(material, "alphaMap", alphaMaps));
	folder.add(material, "combine", constants.combine).onChange(updateCombine(material));
	folder.add(material, "reflectivity", 0, 1);
	folder.add(material, "refractionRatio", 0, 1);
}

function guiMeshToonMaterial(gui, mesh, material) {
	const data = {
		color: material.color.getHex(),
		map: diffuseMapKeys[0],
		gradientMap: gradientMapKeys[1],
		alphaMap: alphaMapKeys[0],
	};

	const folder = gui.addFolder("THREE.MeshToonMaterial");

	folder.addColor(data, "color").onChange(handleColorChange(material.color));
	folder.add(data, "map", diffuseMapKeys).onChange(updateTexture(material, "map", diffuseMaps));
	folder.add(data, "gradientMap", gradientMapKeys).onChange(updateTexture(material, "gradientMap", gradientMaps));
	folder.add(data, "alphaMap", alphaMapKeys).onChange(updateTexture(material, "alphaMap", alphaMaps));
}

function guiMeshStandardMaterial(gui, mesh, material, geometry) {
	const data = {
		color: material.color.getHex(),
		emissive: material.emissive.getHex(),
		envMaps: envMapKeysPBR[0],
		map: diffuseMapKeys[0],
		roughnessMap: roughnessMapKeys[0],
		alphaMap: alphaMapKeys[0],
		metalnessMap: alphaMapKeys[0],
	};

	const folder = gui.addFolder("THREE.MeshStandardMaterial");

	folder.addColor(data, "color").onChange(handleColorChange(material.color));
	folder.addColor(data, "emissive").onChange(handleColorChange(material.emissive));

	folder.add(material, "roughness", 0, 1);
	folder.add(material, "metalness", 0, 1);
	folder.add(material, "flatShading").onChange(needsUpdate(material, geometry));
	folder.add(material, "wireframe");
	folder.add(material, "vertexColors").onChange(needsUpdate(material, geometry));
	folder.add(material, "fog").onChange(needsUpdate(material, geometry));
	folder.add(data, "envMaps", envMapKeysPBR).onChange(updateTexture(material, "envMap", envMaps));
	folder.add(data, "map", diffuseMapKeys).onChange(updateTexture(material, "map", diffuseMaps));
	folder.add(data, "roughnessMap", roughnessMapKeys).onChange(updateTexture(material, "roughnessMap", roughnessMaps));
	folder.add(data, "alphaMap", alphaMapKeys).onChange(updateTexture(material, "alphaMap", alphaMaps));
	folder.add(data, "metalnessMap", alphaMapKeys).onChange(updateTexture(material, "metalnessMap", alphaMaps));
}

function guiMeshPhysicalMaterial(gui, mesh, material, geometry) {
	const data = {
		color: material.color.getHex(),
		emissive: material.emissive.getHex(),
		envMaps: envMapKeys[0],
		map: diffuseMapKeys[0],
		roughnessMap: roughnessMapKeys[0],
		alphaMap: alphaMapKeys[0],
		metalnessMap: alphaMapKeys[0],
		sheenColor: material.sheenColor.getHex(),
		specularColor: material.specularColor.getHex(),
		iridescenceMap: alphaMapKeys[0],
	};

	const folder = gui.addFolder("THREE.MeshPhysicalMaterial");

	folder.addColor(data, "color").onChange(handleColorChange(material.color));
	folder.addColor(data, "emissive").onChange(handleColorChange(material.emissive));

	folder.add(material, "roughness", 0, 1);
	folder.add(material, "metalness", 0, 1);
	folder.add(material, "ior", 1, 2.333);
	folder.add(material, "reflectivity", 0, 1);
	folder.add(material, "iridescence", 0, 1);
	folder.add(material, "iridescenceIOR", 1, 2.333);
	folder.add(material, "sheen", 0, 1);
	folder.add(material, "sheenRoughness", 0, 1);
	folder.addColor(data, "sheenColor").onChange(handleColorChange(material.sheenColor));
	folder.add(material, "clearcoat", 0, 1).step(0.01);
	folder.add(material, "clearcoatRoughness", 0, 1).step(0.01);
	folder.add(material, "specularIntensity", 0, 1);
	folder.addColor(data, "specularColor").onChange(handleColorChange(material.specularColor));
	folder.add(material, "flatShading").onChange(needsUpdate(material, geometry));
	folder.add(material, "wireframe");
	folder.add(material, "vertexColors").onChange(needsUpdate(material, geometry));
	folder.add(material, "fog").onChange(needsUpdate(material, geometry));
	folder.add(data, "envMaps", envMapKeysPBR).onChange(updateTexture(material, "envMap", envMaps));
	folder.add(data, "map", diffuseMapKeys).onChange(updateTexture(material, "map", diffuseMaps));
	folder.add(data, "roughnessMap", roughnessMapKeys).onChange(updateTexture(material, "roughnessMap", roughnessMaps));
	folder.add(data, "alphaMap", alphaMapKeys).onChange(updateTexture(material, "alphaMap", alphaMaps));
	folder.add(data, "metalnessMap", alphaMapKeys).onChange(updateTexture(material, "metalnessMap", alphaMaps));
	folder.add(data, "iridescenceMap", alphaMapKeys).onChange(updateTexture(material, "iridescenceMap", alphaMaps));
}

function chooseMaterial( gui, mesh, geometry, selectedMaterial="MeshBasicMaterial"){
	// const selectedMaterial = window.location.hash.substring(1) || "MeshBasicMaterial";

	let material;

	switch (selectedMaterial) {
		case "MeshBasicMaterial":
			material = new THREE.MeshBasicMaterial({ color: 0x049ef4 });
			guiMaterial(gui, mesh, material, geometry);
			guiMeshBasicMaterial(gui, mesh, material, geometry);
			return material;

		case "MeshLambertMaterial":
			material = new THREE.MeshLambertMaterial({ color: 0x049ef4 });
			guiMaterial(gui, mesh, material, geometry);
			guiMeshLambertMaterial(gui, mesh, material, geometry);

			return material;

		case "MeshMatcapMaterial":
			material = new THREE.MeshMatcapMaterial({ matcap: matcaps.porcelainWhite });
			guiMaterial(gui, mesh, material, geometry);
			guiMeshMatcapMaterial(gui, mesh, material, geometry);

			// no need for lights

			// light1.visible = false;
			// light2.visible = false;
			// light3.visible = false;

			return material;

		case "MeshPhongMaterial":
			material = new THREE.MeshPhongMaterial({ color: 0x049ef4 });
			guiMaterial(gui, mesh, material, geometry);
			guiMeshPhongMaterial(gui, mesh, material, geometry);

			return material;

		case "MeshToonMaterial":
			material = new THREE.MeshToonMaterial({ color: 0x049ef4, gradientMap: gradientMaps.threeTone });
			guiMaterial(gui, mesh, material, geometry);
			guiMeshToonMaterial(gui, mesh, material);

			// only use a single point light

			// light1.visible = false;
			// light3.visible = false;

			return material;

		case "MeshStandardMaterial":
			material = new THREE.MeshStandardMaterial({ color: 0x049ef4 });
			guiMaterial(gui, mesh, material, geometry);
			guiMeshStandardMaterial(gui, mesh, material, geometry);

			// only use scene environment

			light1.visible = false;
			light2.visible = false;
			light3.visible = false;

			return material;

		case "MeshPhysicalMaterial":
			material = new THREE.MeshPhysicalMaterial({ color: 0x049ef4 });
			guiMaterial(gui, mesh, material, geometry);
			guiMeshPhysicalMaterial(gui, mesh, material, geometry);

			// only use scene environment

			light1.visible = false;
			light2.visible = false;
			light3.visible = false;

			return material;

		case "MeshDepthMaterial":
			material = new THREE.MeshDepthMaterial();
			guiMaterial(gui, mesh, material, geometry);
			guiMeshDepthMaterial(gui, mesh, material);

			return material;

		case "MeshNormalMaterial":
			material = new THREE.MeshNormalMaterial();
			guiMaterial(gui, mesh, material, geometry);
			guiMeshNormalMaterial(gui, mesh, material, geometry);

			return material;

		case "LineBasicMaterial":
			material = new THREE.LineBasicMaterial({ color: 0x2194ce });
			guiMaterial(gui, mesh, material, geometry);
			guiLineBasicMaterial(gui, mesh, material, geometry);

			return material;
	}
}

//

/** */
import { DrawingUtils, FilesetResolver, FaceLandmarker } from "@mediapipe/tasks-vision";

// import vision from "./tasks_vision.js";
// const { FaceLandmarker, FilesetResolver, DrawingUtils } = vision;

const depth = 1000;
const targetPoint = new THREE.Vector3(0,0, -500);
const targetRotation = new THREE.Vector3(-0.1, Math.PI, 0)
let lastVideoTime = -1;
let drawingUtils = null;
let app = {
	el: document.getElementById("app"),
	video: document.getElementById("webcam"),
	faceLandmarker: null,
	faceMeshVertices: [],
  light: null,
	faceMesh: null,
	results: null,
	scene: null,
	renderer: null,
	camera: null,
	controls: null,
  gui: null
};

const initLandmarker = async () => {
	const filesetResolver = await FilesetResolver.forVisionTasks(
		"https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@0.10.3/wasm"
	);
	app.faceLandmarker = await FaceLandmarker.createFromOptions(filesetResolver, {
		baseOptions: {
			modelAssetPath: `https://storage.googleapis.com/mediapipe-models/face_landmarker/face_landmarker/float16/1/face_landmarker.task`,
			delegate: "GPU",
		},
		outputFaceBlendshapes: true,
		runningMode: "VIDEO",
		numFaces: 1,
	});
	// drawingUtils = new DrawingUtils(canvasCtx);
	await app.faceLandmarker.setOptions({ runningMode: "VIDEO" });
	// getUsermedia parameters.
	const constraints = {
		video: true,
	};

	// Activate the webcam stream.
	navigator.mediaDevices.getUserMedia(constraints).then((stream) => {
		app.video.srcObject = stream;
		app.video.addEventListener("loadeddata", () => render());
	});
};

const init = () => {
	THREE.CullFaceNone = true;
	app.renderer = new THREE.WebGLRenderer({ alpha: true })
  // app.renderer.setClearColor( 0x000000, 0 ); // the default
	app.renderer.cullFace = THREE.CullFaceNone;
	console.log(app.renderer);
	app.renderer.setSize(window.innerWidth, window.innerHeight);
	app.el.appendChild(app.renderer.domElement);

	app.scene = new THREE.Scene();
	const light = new THREE.AmbientLight(0x404040); // soft white light
	app.scene.add(light);
	app.light = new THREE.DirectionalLight(0xffffff, 0.5); // soft white light
	app.scene.add(app.light);
	const geometry = new THREE.BufferGeometry();

	// const imgSize = { w: 1280, h: 720 };
	const imgSize = { w: 1, h: 1 };
	const points = [];
	// data.sort((a,b) => a.start.index >= b.start.index ? -1 : 1)
	console.log(data);
	data.forEach((p) => points.push(p.start.x, -p.start.y, p.start.z*depth));
	// console.log(points);
	const vertices = new Float32Array(points);
	const indices = data.map((p, i) => i);

	geometry.setIndex(indices);
	geometry.setAttribute("position", new THREE.BufferAttribute(vertices, 3));
	// geometry.setDrawRange(0, 2000)
	// const material = new THREE.LineBasicMaterial({ color: 0xff0000 });
	const material = new THREE.MeshPhongMaterial({
		// color: "white",
		color: "white",
		emissive: "red",
		wireframeLinewidth: 1,
		flatShading: true,
    specular: 'white',
		// flatShading: false,
		shininess: 100,
		side: THREE.DoubleSide,
	});
	// app.faceMesh = new THREE.Line(geometry, material);
	app.faceMesh = new THREE.Mesh(geometry, material);
	app.scene.add(app.faceMesh);

	app.camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.001, 5000);
	app.controls = new OrbitControls(app.camera, app.renderer.domElement);
	app.light.target = app.faceMesh;
  app.controls.target = targetPoint;

  app.gui = new GUI();
  guiScene(app.gui, app.scene);
  app.faceMesh.material = chooseMaterial( app.gui, app.faceMesh, app.faceMesh.geometry, constants.materials.MeshPhongMaterial );

};

const render = () => {
	predictWebcam()
		.then(() => {})
		.catch((e) => console.error("Error ", e))
		.finally(() => {
      app.light.rotateY(0.2);
      app.faceMesh.geometry.center();
      app.faceMesh.position.set(...targetPoint.toArray())
      // app.faceMesh.rotateOnWorldAxis(new THREE.Vector3(0,1,0), 0.01);
      // app.faceMesh.rotateOnAxis(new THREE.Vector3(0,1,0), 0.01);
      app.faceMesh.rotation.x = targetRotation.x;
      app.faceMesh.rotation.y = targetRotation.y;
      app.faceMesh.rotation.z = targetRotation.z;
      // const midVertex = app.faceMeshVertices[Math.round(app.faceMeshVertices.length)*0.5]?.start;
      // if(midVertex){
      //   app.controls.target = new THREE.Vector3(midVertex.x, -midVertex.y, midVertex.z);
      // }
			app.controls.update();
			app.renderer.render(app.scene, app.camera);
			requestAnimationFrame(() => render());
		});
};

async function predictWebcam() {
	const video = app.video;
	const videoWidth = 1280;
	const radio = video.videoHeight / video.videoWidth;
	video.style.width = videoWidth + "px";
	video.style.height = videoWidth * radio + "px";
	// canvasElement.style.width = videoWidth + "px";
	// canvasElement.style.height = videoWidth * radio + "px";
	// canvasElement.width = video.videoWidth;
	// canvasElement.height = video.videoHeight;
	// Now let's start detecting the stream.
	let startTimeMs = performance.now();
	if (lastVideoTime !== video.currentTime) {
		lastVideoTime = video.currentTime;
		app.results = app.faceLandmarker.detectForVideo(video, startTimeMs);
	}
	if (app.results?.faceLandmarks) {
		for (const landmarks of app.results?.faceLandmarks) {
			app.faceMeshVertices = getVertices(landmarks, FaceLandmarker.FACE_LANDMARKS_TESSELATION);
			// console.log(app.faceMeshVertices)
			const positionAttribute = app.faceMesh.geometry.getAttribute("position");
			for (let i = 0; i < positionAttribute.count; i++) {
				const p = app.faceMeshVertices[i]?.start;
				if (!p) continue;
				positionAttribute.setXYZ(i, p.x, -p.y, p.z);
				// x += ( Math.random() - 0.5 ) * 30;
				// y += ( Math.random() - 0.5 ) * 30;
				// z += ( Math.random() - 0.5 ) * 30;
			}
			positionAttribute.needsUpdate = true;
			// console.log(landmarks)
		}
	}
}

const getVertices = (points, landmarkVIndexes, imgSize = null) => {
	imgSize ??= { width: 1280, height: 720 };
	return landmarkVIndexes.map((line) => {
		const start = points[line.start];
		const end = points[line.end];
		return {
			start: { index: line.start, x: start.x * imgSize.width, y: start.y * imgSize.height, z: start.z * depth },
			end: { index: line.end, x: end.x * imgSize.width, y: end.y * imgSize.height, z: end.z * depth },
		};
	});
};

initLandmarker().then(() => {
	init();
	// render();
});
// init();
// render();
