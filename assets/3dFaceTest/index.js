import * as THREE from "three";
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js'
import data from "./data.json";

import { DrawingUtils, FilesetResolver, FaceLandmarker } from "@mediapipe/tasks-vision";

// import vision from "./tasks_vision.js";
// const { FaceLandmarker, FilesetResolver, DrawingUtils } = vision;


let lastVideoTime = -1;
let drawingUtils = null;
let app = {
  el: document.getElementById("app"),
  video: document.getElementById("webcam"),
  faceLandmarker: null,
  faceMeshVertices: [],
  faceMesh: null,
  results: null,
  scene: null,
  renderer: null,
  camera: null,
  controls: null
};

const initLandmarker = async () => {
  const filesetResolver = await FilesetResolver.forVisionTasks(
    "https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@0.10.3/wasm"
  );
  app.faceLandmarker = await FaceLandmarker.createFromOptions(filesetResolver, {
    baseOptions: {
      modelAssetPath: `https://storage.googleapis.com/mediapipe-models/face_landmarker/face_landmarker/float16/1/face_landmarker.task`,
      delegate: "GPU"
    },
    outputFaceBlendshapes: true,
    runningMode: "VIDEO",
    numFaces: 1
  });
  // drawingUtils = new DrawingUtils(canvasCtx);
    await app.faceLandmarker.setOptions({ runningMode: "VIDEO" });
    // getUsermedia parameters.
    const constraints = {
      video: true
    };
  
    // Activate the webcam stream.
    navigator.mediaDevices.getUserMedia(constraints).then((stream) => {
      app.video.srcObject = stream;
      app.video.addEventListener("loadeddata", () => render());
    });
}

const init = () => {
  THREE.CullFaceNone = true;
  app.renderer = new THREE.WebGLRenderer();
  app.renderer.cullFace =THREE.CullFaceNone;
  console.log(app.renderer);
  app.renderer.setSize(window.innerWidth, window.innerHeight);
  app.el.appendChild(app.renderer.domElement);

  app.scene = new THREE.Scene();
  const light = new THREE.AmbientLight( 0x404040 ); // soft white light
  app.scene.add( light );
  const pLight = new THREE.DirectionalLight( 0xffffff, 1 ); // soft white light
  app.scene.add( pLight );
  const geometry = new THREE.BufferGeometry();

  // const imgSize = { w: 1280, h: 720 };
  const imgSize = { w: 1, h: 1 };
  const points = [];
  // data.sort((a,b) => a.start.index >= b.start.index ? -1 : 1)
  console.log(data)
  data.forEach((p) => points.push(p.start.x, -p.start.y, p.start.z*1000));
  // console.log(points);
  const vertices = new Float32Array(points);
  const indices = data.map((p, i) => i);

  geometry.setIndex(indices);
  geometry.setAttribute("position", new THREE.BufferAttribute(vertices, 3));
  // geometry.setDrawRange(0, 2000)
  // const material = new THREE.LineBasicMaterial({ color: 0xff0000 });
  const material = new THREE.MeshPhongMaterial({
    // color: "white",
    color: 'white',
    emissive: 'red',
    wireframeLinewidth: 1,
    flatShading: true,
    // flatShading: false,
    shininess: 1,
    side: THREE.DoubleSide
  });
  // app.faceMesh = new THREE.Line(geometry, material);
  app.faceMesh = new THREE.Mesh(geometry, material);
  app.scene.add(app.faceMesh);

  app.camera = new THREE.PerspectiveCamera(
    75,
    window.innerWidth / window.innerHeight,
    0.1,
    1000
  );
  app.controls = new OrbitControls( app.camera, app.renderer.domElement );
  app.controls.target = new THREE.Vector3(points[0], points[1], points[2])
  pLight.target = app.faceMesh
};

const render = () => {
  predictWebcam().then(() => {
  })
  .catch((e) => console.error("Error ", e))
  .finally(() => {
    app.controls.update();
    app.renderer.render(app.scene, app.camera);
    requestAnimationFrame(() => render())
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
      const positionAttribute = app.faceMesh.geometry.getAttribute( 'position' );
      for ( let i = 0; i < positionAttribute.count; i ++ ) {
        const p = app.faceMeshVertices[i]?.start;
        if(!p) continue;
        positionAttribute.setXYZ( i, p.x, -p.y, p.z );
        // x += ( Math.random() - 0.5 ) * 30;
        // y += ( Math.random() - 0.5 ) * 30;
        // z += ( Math.random() - 0.5 ) * 30;
      }
      positionAttribute.needsUpdate = true;
      // console.log(landmarks)
    }
  }
}


const getVertices = (points, landmarkVIndexes, imgSize=null) => {
  imgSize ??= {width: 1280, height: 720};
  return landmarkVIndexes.map(line => {
    const start = points[line.start];
    const end = points[line.end]
    return {
      start: {index: line.start, x: start.x*imgSize.width, y: start.y*imgSize.height, z: start.z*1000},
      end: {index: line.end, x: end.x*imgSize.width, y: end.y*imgSize.height, z: end.z*1000}
    }
  });
}


initLandmarker().then(() => {
  init();
  // render();
});
// init();
// render();
