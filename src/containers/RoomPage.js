import React, { Component } from "react";
import MediaContainer from "./MediaContainer";
import CommunicationContainer from "./CommunicationContainer";
import { connect } from "react-redux";
import store from "../store";
import io from "socket.io-client";
import { surveyJSON } from "../components/Survey_JSON";
import * as Survey from "survey-react";
const { CMDS, DATA} = require('../managers/Communications')
import { ToastContainer, toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import SurveyComponent from "../components/SurveyComponent";
import {TimedEvent} from "../classes/TimedEvent";
import Sidebar from "../components/Sidebar";

const Msg = ({ closeToast, toastProps }) => (
  <div className="grant-acceasfss">
      <p>A peer has sent you a message to join the room:</p>
      <div>{"HEYYY"}</div>
      <button
        onClick={() => {console.log("REJECT")}}
        data-ref="reject"
        className="primary-button"
      >
        Reject
      </button>
      <button
        onClick={() => {console.log("ACCEPT")}}
        data-ref="accept"
        className="primary-button"
      >
        Accept
      </button>
    </div>
)

const notify = () => toast(<Msg/>,{
  position: "bottom-right",
  autoClose: 10000,
  hideProgressBar: false,
  closeOnClick: true,
  pauseOnHover: true,
  draggable: false,
  progress: undefined,
  theme: "colored",
});
class RoomPage extends Component {
  constructor(props) {
    super(props);

    this.getUserMedia = navigator.mediaDevices
      .getUserMedia({
        audio: true,
        video: {
          width: { min: 1280, ideal: 1280 },
          height: { min: 720, ideal: 720 },
          zoom: true,
        },
      })
      .catch((e) => alert("getUserMedia() error: " + e.name));
    this.state = {
      session: new TimedEvent("MainSession"),
      stageType: "video-chat",
      side_prompt: "",
      user_role: "",
      bridge: "",
      survey: false,
      user: ""
    };
    this.socket = io.connect(`/${CMDS.NAMESPACES.CHAT}`);

    console.log(`Created Socket: ${this.socket?.nsp}`, this.socket);
  }


  sendData(msg) {
    if(this.dc != undefined && this.dc != null){
      this.dc.send(JSON.stringify(msg));
    }
  }
  

  init() {      
    // when our browser gets a candidate, send it to the peer
    
    // attach local media to the peer connection
    this.media.localStream
      .getTracks()
      .forEach((track) => {
        console.log('Adding track ', track);
        this.pc.addTrack(track, this.media.localStream)
      });
    // call if we were the last to connect (to increase
    // chances that everything is set up properly at both ends)
    console.log(`State user: ${this.state.user}`);
    if (this.state.user.toLowerCase() === "host") {
      this.getUserMedia
        .then(attachMediaIfReady)
        .catch((error) => {
          console.warn(`Error Getting user media: `, error)
        });
    }
  }

  // get setting and control(mask) data at the beginning of process
  onControl(control_data) {
    console.log("On Control");
    const { user, controlData } = control_data;
    if (user == this.state.user) {
      this.props.updateAll(controlData);
      if (controlData.video == false) {
        this.media.localVideo.pause();
      } else this.media.localVideo.play();

      if (controlData.recording == true && this.media.state.recording == false) {
        this.media.startRecording();
      }
      if (controlData.recording == false && this.media.state.recording == true) {
        this.media.stopRecording();
      }
      // if (controlData.audio == false) {
      //   this.localVideo.muted = true;
      // } else this.localVideo.muted = false;
    } else {
      if(this.media.remoteVideo != null){
        if (controlData.video == false) {
          this.media.remoteVideo.pause();
        } else{
          this.media.remoteVideo.play();
        }
        if (controlData.audio == false) {
          this.media.remoteVideo.muted = true;
        } else {
          this.media.remoteVideo.muted = false;
        }
      }
    }
  }


  componentDidUpdate(){
    console.log("Room Page Update");
  }
  componentDidMount() {
    console.log(this.props.roomData);
    this.socket.on(CMDS.SOCKET.MESSAGE, (data) => this.onMessage(data));
    this.socket.on(CMDS.SOCKET.CONTROL, (data) => this.onControl(data));
    this.props.createRoom();
  }

  
  render() {
    return (
        <div class={`main-call-container ${this.state.bridge} stage-${this.state.stageType}`}>
          <Sidebar
          state={this.state}
        />
        {/* <button onClick={notify}>Notify!</button>
        <ToastContainer
            position="bottom-right"
            autoClose={100000}
            hideProgressBar={false}
            newestOnTop={false}
            closeOnClick
            rtl={false}
            pauseOnFocusLoss
            draggable
            pauseOnHover
            theme="colored"/> */}
          <MediaContainer
            room={this.props.match.params.room}
            roomPage={this}
            session={this.state.session}
            media={(media) => (this.media = media)}
            socket={this.socket}
            getUserMedia={this.getUserMedia}
            username={this.props.match.params.room}
          />
          <SurveyComponent />
          <CommunicationContainer
            socket={this.socket}
            media={this.media}
            room={this}
            getUserMedia={this.getUserMedia}
          />
        </div>
    );
  }
}

const mapStateToProps = (store) => ({
  video: store.video,
  audio: store.audio,
  roomData: store.roomData,
  zoom: store.controlParams.zoom,
});
const mapDispatchToProps = (dispatch) => ({
  setVideo: (boo) => store.dispatch({ type: "SET_VIDEO", video: boo }),
  setAudio: (boo) => store.dispatch({ type: "SET_AUDIO", audio: boo }),
  setRoomData: (roomData) => store.dispatch({ type: "SET_ROOM_DATA", roomData: roomData }),
  createRoom: () => store.dispatch({ type: "ADD_ROOM", room: ownProps.match.params.room }),
});

export default connect(
  mapStateToProps,
  mapDispatchToProps
)(RoomPage);