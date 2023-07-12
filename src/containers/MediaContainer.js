import React, { Component } from "react";
import { PropTypes } from "prop-types";
import store from "../store";
// import * as faceapi from "face-api.js"; // Updated face-api, check below
import * as faceapi from "@vladmandic/face-api"; // https://github.com/justadudewhohacks/face-api.js/issues?q=undefined+backend+#issuecomment-681001997
import getFeatureAttributes from "../utils/getFeatureAttributes";
import { connect } from "react-redux";
import GYModal from "../components/Modal";
import Introduction from "../components/Introduction";
import IntroFaceDetect from "../components/IntroFaceDetect";
import Thankyou from "../components/Thankyou";
import Sidebar from "../components/Sidebar";
import { CMDS, DATA} from '../managers/Communications'
import { DrawableLandmark, INTERP_FUNCTIONS } from "../classes/DrawableLandmark";
import { TIMES } from "../managers/TimesDefinitions";
var FileSaver = require("file-saver");
import {TimedEvent} from "../classes/TimedEvent";
import SurveyPage from "./SurveyPage";
import SurveyComponent from "../components/SurveyComponent";

const RECORD_AUDIO = true;
const RECORD_VIDEO = true;

const introduction =
  "Welcome to `Your Face is Muted`! This experience consists of three stages. In each, the screen in front of you will show a prompt with a topic to discuss with your conversation partner.\
Throughout the discussion, different parts of your face will be obfuscated. The iPad next to you will occasionally prompt you with questions about you and your partner's current emotion. Let's see how accurate you can read how they feel! \
Sounds good? \
Then click the start button on the iPad and converse away!";
const loseface_notify =
  "Ooops! We can not detect your face, please make sure to look at the screen during\
the experience. Otherwise, the conversation may be terminated.";

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

const init_mask = {
  occlusion_mask: false, //Switch
  feature_show: {
    eyes: {
      toggle: false,
      sliderIndex: 0,
    },
    mouth: {
      toggle: false,
      sliderIndex: 0,
    },
    nose: {
      toggle: false,
      sliderIndex: 0,
    },
    bar: {
      toggle: false,
      direction: false,
      sliderIndex: 0,
      position: 0,
    },
  },
  video: true,
  audio: true,
  recording: false,
};

class MediaBridge extends Component {
  constructor(props) {
    super(props);
    this.state = {
      statusRef: {update: "NONE", data: {}},
      user: props.username,
      recording: false,
      process_cfg: null,
      attention:
        "Ooops! We can not detect your face, please look at the screen during\
      the process. Or the conversation will be terminated.",
      visible: false,
      ready: false,
      loading: false,
      intro: {
        visible: false,
        content: introduction,
      },
      result: "",
      controlData: {},
      survey_in_progress: false,
    };
    this.socket = this.props.socket != undefined ? this.props.socket : null;
    this.record = {
      record_count: 0,
      record_detail: [],
    };
    this.canvasRef = null;
    this.currentVideoSource = null;
    this.remoteVideo = null;
    this.emo_result = [];
    this.survey_count = 0;
    this.controlParams = props.controlParams;
    this.faceApiLoaded = true;
    this.detections = null;
    this.detectionsUpdated = true;
    this.endTime = 0;
    this.mask_configuration = [];
    this.losingface = 0;
    // this.setControlParams = this.setControlParams.bind(this);
  }
  componentDidMount() {
    this.loadModel();
    this.props.media(this);
    this.props.getUserMedia.then(
      (stream) => {
        console.log("Setting local video source stream");
        this.localVideo.srcObject = this.localStream = stream;
      }
    );
    
    if(this.socket != null){
      this.socket.on(CMDS.SOCKET.ROOM_UPDATE, (data) => this.onJoinFeedback(data));
      this.socket.on(CMDS.SOCKET.PROCESS_START, (data) => this.onProcessStart(data));
      this.socket.on(CMDS.SOCKET.PROCESS_STOP, (data) => this.onProcessStop(data));
      this.socket.on(CMDS.SOCKET.PROCESS_CONTROL, (data) => this.onProcessControl(data));
      this.socket.on(CMDS.SOCKET.RESET, (data) => this.onReset(data));
      this.socket.on(CMDS.SOCKET.STAGE_CONTROL, (data) => this.onStageControl(data));
      this.socket.on(CMDS.SOCKET.UPLOAD_FINISH, (data) => this.onUploadingFinish(data));
      this.socket.on(CMDS.SOCKET.SESSION_UPDATE, (data) => this.onSessionUpdate(data));
      this.socket.on(CMDS.SOCKET.SURVEY_END, (data) => this.onSurveyEnd(data));
      this.socket.on(CMDS.SOCKET.FACE_DETECTED, (data) => this.onFace(data));

      this.socket.on(CMDS.SOCKET.RECORDING, (data) => this.startRecording(data));
    }
    if(this.remoteVideo != null){
      this.remoteVideo.addEventListener("play", () => {
        console.log("Remote Video Play");
        // start detect remote's face and process
        this.tryStartFaceDetection().catch((error) => {
          console.warn(`Error attempting to start face detection emotion: ${error}`)
        });
      });
    }

  }

  componentDidUpdate(prevProps) {
    // console.log(`componentDidUpdate: ${this.props.roomPage.state.session.running}`)
  }

  componentWillUnmount() {
    this.props.media(null);
    if (this.localStream !== undefined) {
      this.localStream.getVideoTracks()[0].stop();
    }
    if(this.socket != null){
      this.socket.emit(CMDS.SOCKET.ROOM_IDLE, { room: this.props.room });
      this.socket.emit(CMDS.SOCKET.LEAVE_ROOM);
    }
  }

  // update sidebar prompt when survey start
  onSessionUpdate(data){
    this.setState({
      ...this.state,
      survey_in_progress: true,
      statusRef: {update: CMDS.SOCKET.SURVEY_START, data: data}
    });
    this.props.roomPage.setState({
      stageType: data.data.type,
      side_prompt: "We have some questions for you...",
    })
  }

  // load faceapi models for detection
  async loadModel() {
    this.faceApiLoaded = false;
    console.info("++ loading model");

    await faceapi.tf.setBackend("webgl"); // Or 'wasm'
    const MODEL_URL = "/models";
    const tinyFaceDetectorModel = await faceapi.loadTinyFaceDetectorModel(
      MODEL_URL
    );
    const faceLandmarkModel = await faceapi.loadFaceLandmarkModel(MODEL_URL);
    const faceRecognitionModel = await faceapi.loadFaceRecognitionModel(
      MODEL_URL
    );
    const faceExpressionModel = await faceapi.loadFaceExpressionModel(
      MODEL_URL
    );
    this.faceApiLoaded = true;

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

  // survey progress control
  // 1. calculate finish time, for clock display
  // 2. update face mask setting and topic
  onSurveyEnd(data) {
    const { duration, stage } = data;
    this.survey_count += 1;
    this.setState({
      ...this.state,
      survey_in_progress: false,
    });
    let startTime = new Date().getTime();
    if (stage == 1) {
      this.endTime = startTime + 1000 * 31;
    }
    if (stage == 2) {
      this.endTime = startTime + 1000 * 60;
    }
    if (stage == 3) {
      this.endTime = startTime + 1000 * 90;
    }
    if (stage == 4) {
      this.endTime = startTime + 1000 * 0;
    }

    const controlData = this.state.controlData.mask;
    const topic = this.state.controlData.topic;
    console.log("print topic", topic);
    let new_topic;
    if (topic.length == 1) {
      new_topic = topic[0];
    } else {
      new_topic = topic[this.state.user == "host" ? 0 : 1];
    }
    console.log(CMDS.SOCKET.SURVEY_END, stage);
    if (stage != 4 && this.survey_count < 3) {
      this.setState({
        ...this.state,
        stage: stage,
      });
      this.props.roomPage.setState({
        side_prompt: new_topic
      })
    }

    setTimeout(() => {
      this.setState({
        ...this.state,
        visible: false,
        attention: loseface_notify,
      });
    }, TIMES.LOSING_FACE_NOTIFY);
    if (topic.length == 1) {
      this.setState({
        ...this.state,
        topic: {
          content: topic[0],
          visible: true,
        },
      });
    } else {
      const index = this.state.user == "host" ? 0 : 1;
      this.setState({
        ...this.state,
        topic: {
          content: topic[index],
          visible: true,
        },
      });
    }
    this.props.updateAll(controlData);

    console.log(CMDS.SOCKET.SURVEY_END, data, this.endTime);
  }

  onJoinFeedback(data){
    if(data.error)
      return;
    this.props.roomPage.setState({
      user_role: data.userRoomId,
    });
  }

  // configure process setting
  onProcessControl() {
    if (!this.props.roomPage.state.session.running) {
      this.setState(
        {
          ...this.state,
        },
        () => {
          console.log(this.state);
          this.onReady();
        }
      );
    } else {
    }
  }
  onReady() {
    console.log("on ready set state");
    this.setState({ ...this.state });
  }

  // accept start time, sync time same with server
  // 1. initilize emotion data variables, endtime(for clock)
  // 2. set up interval that count down the clock

  onProcessStart(data) {
    // hier weitermachen: find the main screen and figure out why it's not triggered by this
    console.log("---** PROCESS STARTED **---")
    const { sessionData, record_by_user } = data;
    this.props.roomPage.state.session.id = sessionData.id;
    this.props.roomPage.state.session.data = sessionData;
    const stageData = sessionData.stage ?? {};
    const newStage = new TimedEvent(stageData.name ??  "UNKNOWN STAGE");
    newStage.id = stageData.id ?? -1;
    newStage.data = stageData;
    newStage.duration = stageData.duration ?? -1;
    newStage.start(stageData.startTime ?? 0, stageData.startDateTime ?? 0, stageData.duration ?? 0);
    this.props.roomPage.state.session.addStage(newStage);
    console.log("set intro invisible");
    console.log("process start", this.props.roomPage.state.session.startDateTime, this.props.roomPage.state.session.startTime, this.props.roomPage.state.session.duration, this.props.roomPage.state.session.id);
    console.log("record", record_by_user, record_by_user[this.state.user]);
    this.setState({
      ...this.state,
      stageData: stageData,
    });
    this.props.roomPage.setState({
      session: this.props.roomPage.state.session
    });
    //init
    this.record = {
      record_count: 0,
      record_detail: [],
    };
    this.emo_result = [];
    if (record_by_user[this.state.user]) {
      this.startRecording();
    }
    console.log("process start counting");
    // this.endTime = startTime + 1000 * 31; // GABRY: Why 31??

    // set interval
    console.log("Starting: " + this.props.roomPage.state.session);
    this.props.roomPage.state.session.addOnUpdate((session) => {
      // this.props.roomPage.setState({
      //   session: session
      // });
      if (!this.state.survey_in_progress && (session.timeRemaining >= 0)){
        this.setState({
          ...this.state,
          sessionId: session.startTime,
          sessionStarted: true,
          recording: record_by_user[this.state.user],
          statusRef: {update: CMDS.SOCKET.PROCESS_START, data: data}
        });
      }
    });
  
    this.props.roomPage.state.session.start(sessionData.starTime, sessionData.startDateTime);
  }
  onReset() {
    this.setState({
      ...this.state,
      statusRef: {update: CMDS.SOCKET.RESET, data: data}
    });
    if(this.socket != null){
      this.socket.emit(CMDS.SOCKET.RESET, { room: this.props.room });
    }
  }
  // reset all parameters when process stop
  onProcessStop(data) {
    this.props.roomPage.state.session.stop();
    let { accident_stop } = data;
    if(accident_stop === undefined || accident_stop === null){
      accident_stop = "From Socket";
    }
    if (this.state.recording) {
      this.stopRecording(accident_stop);
    }

    console.log("media process stop. Accident: ", accident_stop);
    this.setState({
      ...this.state,
      recording: false,
      sessionStarted: false,
      sessionId: "",
      stage: 0,
      visible: false,
      loading: false,
      ready: false,
      topic: {
        content: "Welcome! Please have a seat.",
        visible: false,
      },
      intro: {
        content: introduction,
        visible: false,
      },
      survey_in_progress: false,
      statusRef: {update: CMDS.SOCKET.PROCESS_STOP, data: data}
    });
    this.survey_count = 0;
    this.props.updateAll(init_mask);
    if (!accident_stop) {
      this.sendDataToServer();
      this.setState({
        ...this.state,
        loading: true,
      });
      setTimeout(() => {
        this.setState({
          ...this.state,
          loading: false,
        });
      }, TIMES.PROCESS_STOP_WAIT);
      this.record = {
        record_count: 0,
        record_detail: [],
      };
      this.emo_result = [];
    } else {
      this.record = {
        record_count: 0,
        record_detail: [],
      };
      this.emo_result = [];
    }
  }

  // get data from server, show results for users
  onUploadingFinish(data) {
    let partner = "host";
    if (this.state.user == "host") {
      partner = "guest";
    }
    const your_answers = data[this.state.user];
    const partner_answers = data[partner];
    let correct_count = 0;
    console.log("upload, ", data);
    for (let i = 0; i < 3; i++) {
      try {
        if (
          your_answers[i]["result"]["question2"] ==
          partner_answers[i]["result"]["question1"]
        ) {
          correct_count += 1;
        }
      } catch (err) {
        console.log("someone not pick one option");
      }
    }
    const survey_accuracy = `In the conversation, you made ${correct_count} over 3 correct guess `;
    this.setState({
      ...this.state,
      result: survey_accuracy,
    });
  }

  // update mask and topic and clock time for new stage, triggerred by server socket message
  //
  onStageControl(data) {
    console.info("- onStageControl()", data);

    if (this.props.roomPage.state.session.currentStage >= 0) {
      this.emo_result.push(this.record.record_detail);
      console.info("- stage control, ", this.state, this.emo_result);
    }
    this.record = {
      record_count: 0,
      record_detail: [],
    };
    console.log("stage control receiving", this.emo_result);
    const { mask, topic } = data;
    // update mask when stage change
    const controlData = mask[this.state.user];
    if (topic.length == 1) {
      this.setState({
        ...this.state,
        intro: {
          content: introduction,
          visible: false,
        },
      });
      this.props.roomPage.setState({
        side_prompt: topic[0]
      })
      setTimeout(() => {
        this.setState({
          ...this.state,
          visible: false,
          attention: loseface_notify,
        });
      }, TIMES.LOSING_FACE_NOTIFY);
    }
    this.props.updateAll(controlData);
    this.setState({
      ...this.state,
      stage: 1,
      controlData: {
        mask: mask[this.state.user],
        topic: topic,
      },
    });
  }

  // if losing promote user's face, send socket message to server
  onFaceDetect() {
    // console.info("+ Face detected");
    // console.log(faceapi.nets);
    if(this.socket != null){
      let user;
      if (this.state.user == "guest") {
        user = "host"; //why?
      } else {
        user = "guest";
      }
      this.socket.emit(CMDS.SOCKET.FACE_DETECTED, {
        room: this.props.room,
        user,
      });
    }
  }

  // face detected event listener
  onFace(data) {
    // console.info("- onFace()");
    if (this.state.user == data && !this.props.roomPage.state.session.running) {
      this.setState({
        ...this.state,
        ready: true,
        intro: {
          ...this.state.intro,
          visible: true,
        },
        statusRef: {update: CMDS.SOCKET.FACE_DETECTED, data: data}
      });
    }
  }

  // audio recording

  // main function for chat room
  // 1. faceapi doc: https://justadudewhohacks.github.io/face-api.js/docs/index.html
  // 2. create canvas based on remote video size
  // 3.
  async tryStartFaceDetection(){
    if(!this.faceApiLoaded){
      console.warn("Waiting for face api models to load...");
      setTimeout(async () => await this.tryStartFaceDetection(), TIMES.FACE_DETECTION_RETRY);
      return;
    }

    const canvasTmpLocal = faceapi.createCanvasFromMedia(this.localVideo);

    if(this.remoteVideo != null){
      const canvasTmpRemote = faceapi.createCanvasFromMedia(this.remoteVideo);
      console.log("compare", canvasTmpRemote, canvasTmpLocal);
    }

    const displaySize = {
      width: canvasTmpLocal.width,
      height: canvasTmpLocal.height,
    };
    faceapi.matchDimensions(this.canvasRef, displaySize);
    console.log(this.canvasRef.width, this.canvasRef.height);

    console.log("Triggering face detection..");
    setTimeout(async () => await this.faceDetectionCallback(), TIMES.FACE_DETECTION_DELAY);
    window.requestAnimationFrame(() => this.drawCanvas());
  }

  async faceDetectionCallback() {
    let lose_face_f = false;

    try {
      if(this.currentVideoSource == null){
        if(this.remoteVideo == null){
          this.currentVideoSource = this.localVideo;
          console.warn("No remote video source, using local video for face api detection");
        }
        else{
          this.currentVideoSource = this.remoteVideo;
        }
        console.log(`Using Video Source: ${this.currentVideoSource.id}`, this.currentVideoSource)
      }
      const newDetections = await faceapi
        .detectSingleFace(
          this.currentVideoSource,
          new faceapi.TinyFaceDetectorOptions()
        )
        .withFaceLandmarks()
        .withFaceExpressions();
      if(newDetections != undefined && newDetections != null){
        this.detections = newDetections;
      }
      this.detectionsUpdated = true;
      // console.log("detections", this.detections);
    }catch (err) {
      console.error(`ERROR detecting single face ${err}`);
      this.detectionsUpdated = false;
    }
    // console.log(`Getting face attributes`);
    let utc = new Date().getTime();
    try {
      this.faceAttributes = getFeatureAttributes(this.detections);
      if (!this.props.roomPage.state.session.running) {
        this.onFaceDetect();
      }
      this.losingface = 0;
      if (lose_face_f) {
        this.sendData("recover");
        lose_face_f = false;
      }
    } catch (err) {
      try{
        console.error(`ERROR getting feature attributes ${err}`);

        if (this.state.survey_in_progress) {
          this.losingface += 0.5;
        } else {
          this.losingface += 1;
        }
        this.losingface %= 22; // why? // GABRY: Yeah why?
        if (this.losingface >= 10 && this.losingface < 20) {
          if (this.props.roomPage.state.session.running) {
            // Restart whole process
            if (!lose_face_f) {
              lose_face_f = true;
              this.sendData("lose-face");
            }
          } else {
            if (!lose_face_f) {
              lose_face_f = true;
              this.sendData(CMDS.SOCKET.ROOM_IDLE);
            }
          }

          console.log(            "WARNING: Lost face tracking for more than 10 secs."
          );
        }
        if (this.losingface >= 20 && this.props.roomPage.state.session.running) {
          // Restart whole process
          this.onReset();
          console.log("WARNING: Your partner seems to have left.");
        }
        if (
          this.losingface >= 20 &&
          !this.props.roomPage.state.session.running &&
          !this.state.ready
        ) {
          // Restart whole process
          if(this.socket != null){
            this.socket.emit(CMDS.SOCKET.ROOM_IDLE, { room: this.props.room });
          }
          console.log("The room seems to be idle.");
        }

        console.log("WARNING: Can't detect face on remote side",this.losingface);
      }
      catch(error){
        console.log("Error while losing face: ", error);
      }
    }

    // console.log(`Updating survey or state progress?!`);
    if (this.props.roomPage.state.session.running && !this.state.survey_in_progress) {
      try {
        const emo_data = {
          timeStamp: utc,
          elapsedStage: 0,
          elapsedSession: 0,
          emotion: this.detections.expressions,
        };
        this.record.record_detail.push(emo_data);
        this.record.record_count += 1;
      } catch (err) {
        console.warn(`Error showing emotion: ${err}`);
      }
    }

    setTimeout(async () => await this.faceDetectionCallback(), TIMES.FACE_DETECTION_DELAY);
  }

  // Draw a mask over face/screen
  drawCanvas() {
    const ctx = this.canvasRef.getContext("2d");
    ctx.fillStyle = "black";
    ctx.fillRect(0, 0, this.canvasRef.width, this.canvasRef.height);
    if(this.detections != null){
      let detections = this.detections;
      let imHeight = this.detections.detection.imageHeight;
      let imWidth = this.detections.detection.imageWidth;
      let cHeight = ctx.canvas.clientHeight;
      let cWidth = ctx.canvas.clientWidth;
      let ctxHeight = ctx.canvas.height;
      let ctxWidth = ctx.canvas.width;
      let bHeight = ctx.canvas.getBoundingClientRect().height;
      let bWidth = ctx.canvas.getBoundingClientRect().width;

      let imgWidthR = detections.detection.imageWidth;
      let imgHeightR = detections.detection.imageHeight;
      if(this.detectionsUpdated){
        detections = faceapi.resizeResults(detections, { width: ctxWidth, height: ctxHeight }) // For some reason it's not quite centered
        imgWidthR = detections.detection.imageWidth;
        imgHeightR = detections.detection.imageHeight;

        // console.log(`Image: ${imWidth} x ${imHeight}\nImage Resized: ${imWidthR} x ${imHeightR}\nClient: ${cWidth} x ${cHeight}\nBounding: ${bWidth} x ${bHeight}`)
        // detections = faceapi.resizeResults(detections, { width: ctx.canvas.clientWidth, height: ctx.canvas.clientHeight })
        const landmarks = detections.landmarks;
        // console.log("landmarks", landmarks);
        for(let l of landmarksData){
          l.updatePointsFromLandmark(landmarks.positions);
          l.setRotation(detections.angle.roll);
        }
        this.detectionsUpdated = false;
      }

      // I need to draw the cutout/clipping maskes first and then draw the landmarks on top, i can't do both in the same loop as the clipping masks of the next
      // Points would override the previous landmark points
      for(let l of landmarksData){
        if(l.drawMask){
          l.drawClippingMask(ctx)
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
    }
    window.requestAnimationFrame(() => this.drawCanvas());
  }

  sendData(msg) {
    if(this.dc != undefined && this.dc != null){
      this.dc.send(JSON.stringify(msg));
    }
  }

  sendDataToServer() {
    let eresult = this.record;
    this.emo_result.push(this.record.record_detail);
    console.info("+ finish, sending data, ", this.emo_result, eresult);
    const emo_record = this.emo_result;
    if(this.socket != null){
      console.log("sending data to server ",JSON.parse(JSON.stringify(emo_record)));
      this.socket.emit(CMDS.SOCKET.DATA_SEND, {
        room: this.props.room,
        data_type: DATA.TYPE.EMOTION,
        user: this.state.user,
        data: emo_record,
      });
      this.record.record_detail = [];
      this.record.record_count = 0;
    }
  }

  // components: SideBar, Clock, GYModal(popup window, loseface attention), Introduction, Introduction when face detected, Thankyou, local and remote video
  render() {
    return (
      <div className={`main-room-container`}>
      <div className={`media-bridge`}>
      <canvas className="canvas" ref={(ref) => (this.canvasRef = ref)} />
        {(() => {
          if(this.socket == null) return <></>;
          if(!this.props.roomPage.state.session.running){
            if(this.state.intro.visible)
              return <IntroFaceDetect userRole={this.props.roomPage.state.user_role} />; /* Face detected before process showing details */
            return <Introduction userRole={this.props.roomPage.state.user_role}/>; /* No face detected, showing introduction */
          }
        })()}

        {this.state.loading && <Thankyou result={this.state.result} userRole={this.props.roomPage.state.user_role} />}

        <GYModal title="Attention" visible={this.state.visible}>
          <h1 style={{ color: "white" }}>{this.state.attention}</h1>
        </GYModal>
        
        {this.socket != null &&
          <video
            className="remote-video"
            id="remote-video"
            ref={(ref) => (this.remoteVideo = ref)}
            autoPlay>
          </video>
        }
        <video
          className="local-video"
          id="local-video"
          ref={(ref) => (this.localVideo = ref)}
          autoPlay
          muted>
        </video>
        </div>
       {/* <SurveyPage sessionStatusRef={this.state.statusRef} />  */}
       {/* GABRY: This stupid survey component causes the page to scroll up top at every render... */}
      {/* <div style={{backgroundColor: "white", height: "50vh", width: "100vw"}}/> */}
      </div>
    );
  }
}
MediaBridge.propTypes = {
  socket: PropTypes.object.isRequired,
  getUserMedia: PropTypes.object.isRequired,
  media: PropTypes.func.isRequired,
};
const mapStateToProps = (store) => ({
  video: store.video,
  audio: store.audio,
  controlParams: store.controlParams,
});
const mapDispatchToProps = (dispatch) => ({
  updateAll: (payload) => store.dispatch({ type: "UPDATE_ALL", payload }),
  setVideo: (boo) => store.dispatch({ type: "SET_VIDEO", video: boo }),
  setAudio: (boo) => store.dispatch({ type: "SET_AUDIO", audio: boo }),
});
export default connect(mapStateToProps, mapDispatchToProps)(MediaBridge);
