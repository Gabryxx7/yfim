import React, { Component } from "react";
import MediaContainer from "./MediaContainer";
import CommunicationContainer from "./CommunicationContainer";
import { connect } from "react-redux";
import store from "../store";
import io from "socket.io-client";
import { surveyJSON } from "../components/Survey_JSON";
import * as Survey from "survey-react";
const { SOCKET_CMDS, DATA_TYPES, NAMESPACES } = require('../managers/SocketCommands')
import { ToastContainer, toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import SurveyComponent from "../components/SurveyComponent";

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
      bridge: "",
      survey: false,
      user: ""
    };
    this.socket = io.connect(`/${NAMESPACES.CHAT}`);

    console.log(`Created Socket: ${this.socket?.nsp}`, this.socket);
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

  init() {
    console.log('Initializing Media');
    try {
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
        console.log("onicecandidate", e);
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
        if(this.media.remoteVideo != null){
          this.media.remoteStream = e.stream;
          this.media.remoteVideo.srcObject = this.media.remoteStream = e.stream;
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
            video: this.media.localStream.getVideoTracks()[0].enabled,
          },
        });
        //sendData('hello');
      };
      console.log('RTCPeerCOnnection listeners added');
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
    } catch (error) {
      console.error("ERROR: Could not init WebRTC", error);
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

  onRemoteHangup() {
    this.setState({ ...this.state, bridge: "host-hangup" });
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
  componentDidMount() {
    this.socket.on(SOCKET_CMDS.MESSAGE, (data) => this.onMessage(data));
    this.socket.on(SOCKET_CMDS.HANGUP, (data) => this.onRemoteHangup(data));
    this.socket.on(SOCKET_CMDS.CONTROL, (data) => this.onControl(data));
    this.props.createRoom();
  }
  render() {
    return (
        <div class={`main-call-container ${this.state.bridge}`}>
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
            media={(media) => (this.media = media)}
            socket={this.socket}
            getUserMedia={this.getUserMedia}
            username={this.props.match.params.room}
          />
          <CommunicationContainer
            socket={this.socket}
            media={this.media}
            room={this}
            getUserMedia={this.getUserMedia}
          />
          <SurveyComponent />
        </div>
    );
  }
}
const mapStateToProps = (store) => ({ rooms: new Set([...store.rooms]) });
const mapDispatchToProps = (dispatch, ownProps) => ({
  createRoom: () =>
    store.dispatch({ type: "ADD_ROOM", room: ownProps.match.params.room }),
});
export default connect(mapStateToProps, mapDispatchToProps)(RoomPage);
