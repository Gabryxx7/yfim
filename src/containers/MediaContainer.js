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
import { SOCKET_CMDS, DATA_TYPES, NAMESPACES } from '../managers/SocketCommands'
import { DrawableLandmark, INTERP_FUNCTIONS } from "../components/DrawableLandmark";
import { TIMES } from "../managers/TimesDefinitions";
var FileSaver = require("file-saver");
import {TimedEvent} from "../components/TimedEvent";

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
      session: new TimedEvent("MainSession"),
      bridge: "",
      user: props.username,
      recording: false,
      side_prompt: "",
      user_role: "",
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
    this.remoteStream = null;
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
      (stream) => (this.localVideo.srcObject = this.localStream = stream)
    );
    
    if(this.socket != null){
      this.socket.on(SOCKET_CMDS.ROOM_JOIN_FEEDBACK, (data) => this.onJoinFeedback(data));
      this.socket.on(SOCKET_CMDS.PROCESS_START, (data) => this.onProcessStart(data));
      this.socket.on(SOCKET_CMDS.PROCESS_STOP, (data) => this.onProcessStop(data));
      this.socket.on(SOCKET_CMDS.PROCESS_CONTROL, (data) => this.onProcessControl(data));
      this.socket.on(SOCKET_CMDS.RESET, (data) => this.onReset(data));
      this.socket.on(SOCKET_CMDS.STAGE_CONTROL, (data) => this.onStageControl(data));
      this.socket.on(SOCKET_CMDS.UPLOAD_FINISH, (data) => this.onUploadingFinish(data));
      this.socket.on(SOCKET_CMDS.SURVEY_START, (data) => this.onSurveyStart(data));
      this.socket.on(SOCKET_CMDS.SURVEY_END, (data) => this.onSurveyEnd(data));
      this.socket.on(SOCKET_CMDS.FACE_DETECTED, (data) => this.onFace(data));

      this.socket.on(SOCKET_CMDS.MESSAGE, (data) => this.onMessage(data));
      this.socket.on(SOCKET_CMDS.HANGUP, (data) => this.onRemoteHangup(data));
      this.socket.on(SOCKET_CMDS.CONTROL, (data) => this.onControl(data));
      this.socket.on(SOCKET_CMDS.RECORDING, (data) => this.startRecording(data));
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

    // audio recorder initialize
    this.localVideo.addEventListener("play", () => {
      console.log("Local Video Play");
      let audio_track = this.localStream.getAudioTracks()[0];
      let video_track = this.localStream.getVideoTracks()[0];
      let audio_stream = new MediaStream();
      audio_stream.addTrack(audio_track);
      // audio_stream.addTrack(video_track);
      this.mediaRecorder = new MediaRecorder(this.localStream, {
        mimeType: "video/webm",
      });
      this.chunks = [];
      // listen for data from media recorder
      this.mediaRecorder.ondataavailable = (e) => {
        // not record audio during survey
        if (e.data && e.data.size > 0 && !this.state.survey_in_progress) {
          this.chunks.push(e.data);
        }
      };
      if(this.socket == null){
        this.tryStartFaceDetection().catch((error) => {
          console.warn(`Error attempting to start face detection: ${error}`)
        });
      }
    });
  }

  componentDidUpdate(prevProps) {
    // console.log(`componentDidUpdate: ${this.state.session.running}`)
  }

  componentWillUnmount() {
    this.props.media(null);
    if (this.localStream !== undefined) {
      this.localStream.getVideoTracks()[0].stop();
    }
    if(this.socket != null){
      this.socket.emit(SOCKET_CMDS.ROOM_IDLE, { room: this.props.room });
      this.socket.emit(SOCKET_CMDS.LEAVE_ROOM);
    }
    clearInterval(this.timmer);
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
    console.log(SOCKET_CMDS.SURVEY_END, stage);
    if (stage != 4 && this.survey_count < 3) {
      this.setState({
        ...this.state,
        side_prompt: new_topic,
        stage: stage,
      });
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

    console.log(SOCKET_CMDS.SURVEY_END, data, this.endTime);
  }

  // update sidebar prompt when survey start
  onSurveyStart(data) {
    this.setState({
      ...this.state,
      survey_in_progress: true,
      side_prompt: "We have some questions for you on Ipad",
    });
  }

  onJoinFeedback(data){
    if(data.error)
      return;
    this.setState({
      ...this.state,
      user_role: data.userRoomId,
    });
  }

  // configure process setting
  onProcessControl() {
    if (!this.state.session.running) {
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
    this.state.session.id = sessionData.id;
    this.state.session.data = sessionData;
    const stageData = sessionData.stage ?? {};
    const newStage = new TimedEvent(stageData.name ??  "UNKNOWN STAGE");
    newStage.id = stageData.id ?? -1;
    newStage.data = stageData;
    newStage.duration = stageData.duration ?? -1;
    newStage.start(stageData.startTime ?? 0, stageData.startDateTime ?? 0, stageData.duration ?? 0);
    this.state.session.addStage(newStage);
    console.log("set intro invisible");
    console.log("process start", this.state.session.startDateTime, this.state.session.startTime, this.state.session.duration, this.state.session.id);
    console.log("record", record_by_user, record_by_user[this.state.user]);
    this.setState({
      ...this.state,
      stageData: stageData,
      session: this.state.session
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
    console.log("Starting: " + this.session);
    this.state.session.addOnUpdate((session) => {
      this.setState({
        ...this.state,
        session: session
      })
      if (!this.state.survey_in_progress && (session.timeRemaining >= 0)){
        this.setState({
          ...this.state,
          sessionId: session.startTime,
          sessionStarted: true,
          recording: record_by_user[this.state.user],
        });
      }
    });
    this.state.session.addOnUpdate((session) => {
      // console.log("UPDATE: "+session);
    });
  
    this.state.session.start(sessionData.starTime, sessionData.startDateTime);
  }
  onReset() {
    if(this.socket != null){
      this.socket.emit(SOCKET_CMDS.RESET, { room: this.props.room });
    }
  }
  // reset all parameters when process stop
  onProcessStop(data) {
    this.state.session.stop();
    let { accident_stop } = data;
    if(accident_stop === undefined || accident_stop === null){
      accident_stop = "From Socket";
    }
    if (this.state.recording) {
      this.stopRecording(accident_stop);
    }

    console.log("media process stop. Accident: ", accident_stop);
    clearInterval(this.timmer);
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

    if (this.state.session.currentStage >= 0) {
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
        side_prompt: topic[0],
        intro: {
          content: introduction,
          visible: false,
        },
      });
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

  // get setting and control(mask) data at the beginning of process
  onControl(control_data) {
    console.log("On Control");
    const { user, controlData } = control_data;
    if (user == this.state.user) {
      this.props.updateAll(controlData);
      if (controlData.video == false) {
        this.localVideo.pause();
      } else this.localVideo.play();

      if (controlData.recording == true && this.state.recording == false) {
        this.startRecording();
      }
      if (controlData.recording == false && this.state.recording == true) {
        this.stopRecording();
      }
      // if (controlData.audio == false) {
      //   this.localVideo.muted = true;
      // } else this.localVideo.muted = false;
    } else {
      if(this.remoteVideo != null){
        if (controlData.video == false) {
          this.remoteVideo.pause();
        } else{
          this.remoteVideo.play();
        }
        if (controlData.audio == false) {
          this.remoteVideo.muted = true;
        } else {
          this.remoteVideo.muted = false;
        }
      }
    }
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
      this.socket.emit(SOCKET_CMDS.FACE_DETECTED, {
        room: this.props.room,
        user,
      });
    }
  }

  // face detected event listener
  onFace(data) {
    // console.info("- onFace()");
    if (this.state.user == data && !this.state.session.running) {
      this.setState({
        ...this.state,
        ready: true,
        intro: {
          ...this.state.intro,
          visible: true,
        },
      });
    }
  }

  // audio recording

  startRecording() {
    // e.preventDefault();
    if (RECORD_AUDIO) {
      // wipe old data chunks
      this.chunks = [];
      // start recorder with 10ms buffer
      this.mediaRecorder.start(10);
      // say that we're recording
      this.setState({ recording: true });
    } else {
      console.info("- AUDIO RECORDING IS DISABLED");
      this.setState({ recording: false });
    }
  }

  stopRecording(accident_stop) {
    // e.preventDefault();
    if (RECORD_AUDIO) {
      console.log("stopping recording");
      // stop the recorder
      this.mediaRecorder.stop();
      // say that we're not recording
      this.setState({ recording: false });
      // save the video to memory
      if (!accident_stop) {
        this.saveVideo();
      }
    }
  }

  saveVideo() {
    if (RECORD_VIDEO) {
      // convert saved chunks to blob
      const blob = new Blob(this.chunks, { type: "video/webm" });
      // generate video url from blob
      // const videoURL = window.URL.createObjectURL(blob);
      // append videoURL to list of saved videos for rendering
      let filename = this.sessionId + "_" + this.state.user;
      FileSaver.saveAs(blob, filename);
      // const videos = this.state.videos.concat([videoURL]);
      // this.setState({ videos });
    } else {
      console.info("- VIDEO RECORDING IS DISABLED");
    }
  }

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
      if (!this.state.session.running) {
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
          if (this.state.session.running) {
            // Restart whole process
            if (!lose_face_f) {
              lose_face_f = true;
              this.sendData("lose-face");
            }
          } else {
            if (!lose_face_f) {
              lose_face_f = true;
              this.sendData(SOCKET_CMDS.ROOM_IDLE);
            }
          }

          console.log(            "WARNING: Lost face tracking for more than 10 secs."
          );
        }
        if (this.losingface >= 20 && this.state.session.running) {
          // Restart whole process
          this.onReset();
          console.log("WARNING: Your partner seems to have left.");
        }
        if (
          this.losingface >= 20 &&
          !this.state.session.running &&
          !this.state.ready
        ) {
          // Restart whole process
          if(this.socket != null){
            this.socket.emit(SOCKET_CMDS.ROOM_IDLE, { room: this.props.room });
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
    if (this.state.session.running && !this.state.survey_in_progress) {
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

  onRemoteHangup() {
    this.setState({ ...this.state, bridge: "host-hangup" });
  }
  onMessage(message) {
    if (message.type === "offer") {
      // set remote description and answer
      this.pc
        .setRemoteDescription(new RTCSessionDescription(message))
        .then(() => this.pc.createAnswer())
        .then(() => this.setDescription())
        .then(() => this.sendDescription())
        .catch(() => this.handleError()); // An error occurred, so handle the failure to connect
    } else if (message.type === "answer") {
      // set remote description
      this.pc.setRemoteDescription(new RTCSessionDescription(message));
    } else if (message.type === "candidate") {
      // add ice candidate
      this.pc.addIceCandidate(message.candidate);
    }
  }
  sendData(msg) {
    if(this.dc != undefined && this.dc != null){
      this.dc.send(JSON.stringify(msg));
    }
  }

  // Set up the data channel message handler
  // transfer data from peers
  setupDataHandlers() {
    this.dc.onmessage = (e) => {
      var msg = JSON.parse(e.data);
      if (msg == "lose-face") {
        this.setState({
          ...this.state,
          visible: true,
          ready: this.state.session.running,
        });
      }
      if (msg == "recover") {
        this.setState({
          ...this.state,
          visible: false,
          ready: true,
        });
      }
      if (msg == SOCKET_CMDS.ROOM_IDLE) {
        this.setState({
          ...this.state,
          ready: false,
        });
      }
      console.log("received message over data channel:" + msg);
    };
    this.dc.onclose = () => {
      this.remoteStream.getVideoTracks()[0].stop();
      console.log("The Data Channel is Closed");
    };
  }
  setDescription(offer) {
    return this.pc.setLocalDescription(offer);
  }
  // send the offer to a server to be forwarded to the other peer
  sendDescription() {
    if(this.socket != null){
      this.socket.send(this.pc.localDescription);
    }
  }
  hangup() {
    this.setState({ ...this.state, bridge: "guest-hangup" });
    this.pc.close();
    if(this.socket != null){
      this.socket.emit(SOCKET_CMDS.ROOM_IDLE, { room: this.props.room });
      this.socket.emit(SOCKET_CMDS.LEAVE_ROOM);
    }
  }
  handleError(e) {
    console.log(e);
  }
  sendDataToServer() {
    let eresult = this.record;
    this.emo_result.push(this.record.record_detail);
    console.info("+ finish, sending data, ", this.emo_result, eresult);
    const emo_record = this.emo_result;
    if(this.socket != null){
      console.log("sending data to server ",JSON.parse(JSON.stringify(emo_record)));
      this.socket.emit(SOCKET_CMDS.DATA_SEND, {
        room: this.props.room,
        data_type: DATA_TYPES.EMOTION,
        user: this.state.user,
        data: emo_record,
      });
      this.record.record_detail = [];
      this.record.record_count = 0;
    }
  }

  init() {
    console.log('Initializing Media');
    try {
      // wait for local media to be ready
      const attachMediaIfReady = () => {
        console.log('Attach media if ready ()');
        this.dc = this.pc.createDataChannel("chat");
        this.setupDataHandlers();
        console.log("attachMediaIfReady");
        this.pc
          .createOffer({ iceRestart: true })
          .then(() => this.setDescription())
          .then(() => this.sendDescription())
          .catch(() => this.handleError()); // An error occurred, so handle the failure to connect
      };
      // set up the peer connection
      // this is one of Google's public STUN servers
      // make sure your offer/answer role does not change. If user A does a SLD
      // with type=offer initially, it must do that during  the whole session
      this.pc = new RTCPeerConnection({
        iceServers: [
          {
            urls: "stun:stun.l.google.com:19302",
          },
          {
            urls: "turn:139.180.183.4:3478",
            username: "hao",
            credential: "158131hh2232A",
          }
        ],
      });
      console.log('RTCPeerCOnnection created');
      this.pc.onconnectionstatechange = (event) => {
        console.log("onconnectionstatechange change ", event);
      };
      
      this.pc.addEventListener("iceconnectionstatechange", (event) => {
        let pcstate = this.pc.iceConnectionState;
        console.log("iceconnection change ", pcstate);
        if (
          pcstate === "failed" ||
          pcstate === "closed" ||
          pcstate === "disconnected"
        ) {
          /* possibly reconfigure the connection in some way here */
          /* then request ICE restart */
          this.reconnecttimer = setInterval(() => {
            console.log("iceconnection trying to reconnect");
            location.reload();
          }, TIMES.ICE_RECONNECTION_INTERVAL);
        } else {
          clearInterval(this.reconnecttimer);
        }
      });
      // when our browser gets a candidate, send it to the peer
      this.pc.onicecandidate = (e) => {
        // console.log("onicecandidate", e);
        if (e.candidate) {
          if(this.socket != null){
            this.socket.send({
              type: "candidate",
              candidate: e.candidate,
            });
          }
        }
      };

      this.pc.ontrack = (event) => {
        console.log("ontrack", event);
      };
      // when the other side added a media stream, show it on screen
      this.pc.onaddstream = (e) => {
        console.log("onaddstream", e);
        if(this.remoteVideo != null){
          this.remoteStream = e.stream;
          this.remoteVideo.srcObject = this.remoteStream = e.stream;
          this.setState({ ...this.state, bridge: "established" });
        }
      };
      this.pc.ondatachannel = (e) => {
        // console.log('ondatachannel', e);
        // data channel
        this.dc = e.channel;
        this.setupDataHandlers();
        this.sendData({
          peerMediaStream: {
            video: this.localStream.getVideoTracks()[0].enabled,
          },
        });
        //sendData('hello');
      };
      console.log('RTCPeerCOnnection listeners added');
      // attach local media to the peer connection
      this.localStream
        .getTracks()
        .forEach((track) => {
          console.log('Adding track ', track);
          this.pc.addTrack(track, this.localStream)
        });
      // call if we were the last to connect (to increase
      // chances that everything is set up properly at both ends)
      if (this.state.user === "host") {
        this.props.getUserMedia
          .then(attachMediaIfReady)
          .catch((error) => {
            console.warn(`Error Getting user media: `, error)
          });
      }
    } catch (error) {
      console.error("ERROR: Could not init WebRTC", error);
    }
  }
  // components: SideBar, Clock, GYModal(popup window, loseface attention), Introduction, Introduction when face detected, Thankyou, local and remote video
  render() {
    return (
      <div className={`media-bridge ${this.state.bridge}`}>
      <canvas className="canvas" ref={(ref) => (this.canvasRef = ref)} />
           <Sidebar
            state={this.state}
            session={this.session}
          />
        {(() => {
          if(this.socket == null) return <></>;
          if(!this.state.session.running){
            if(this.state.intro.visible)
              return <IntroFaceDetect userRole={this.state.user_role} />; /* Face detected before process showing details */
            return <Introduction userRole={this.state.user_role}/>; /* No face detected, showing introduction */
          }
        })()}

        {this.state.loading && <Thankyou result={this.state.result} userRole={this.state.user_role} />}

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
