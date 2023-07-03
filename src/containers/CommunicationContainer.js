import React from "react";
import { PropTypes } from "prop-types";
import MediaContainer from "./MediaContainer";
import Communication from "../components/Communication";
import store from "../store";
import { connect } from "react-redux";
import { SOCKET_CMDS } from '../managers/SocketCommands'
import { TIMES } from '../managers/TimesDefinitions'


class CommunicationContainer extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      sid: "",
      message: "",
      audio: true,
      video: true,
    };
    this.handleInvitation = this.handleInvitation.bind(this);
    this.handleHangup = this.handleHangup.bind(this);
    this.handleInput = this.handleInput.bind(this);
    this.toggleVideo = this.toggleVideo.bind(this);
    this.toggleAudio = this.toggleAudio.bind(this);
    this.send = this.send.bind(this);
  }
  hideAuth() {
    this.props.media.setState({ bridge: "connecting" });
  }
  full() {
    console.log(`Room is full!`)
    this.props.media.setState({ bridge: "full" });
  }
  componentDidMount() {
    const socket = this.props.socket;

    socket.on(SOCKET_CMDS.HELLO, () => {
      console.log(`SOCKET CONNECTED (hello received): ${this.props?.socket?.id} ${this.props?.socket?.nsp}`)
      // console.log(`SOCKET CONNECTED (hello received): ${socket?.id} ${socket?.nsp}`)
    })

    socket.onAny((eventName, ...args) => {
      if(eventName !== SOCKET_CMDS.FACE_DETECTED){
        console.log(`Received event ${eventName}`)
      }
    });

    socket.on(SOCKET_CMDS.CONNECT_ERROR, (err) => {
      console.log(`connect_error on ${this} due to ${err.message}`);
    });
    this.setState({
      video: this.props.video,
      audio: this.props.audio,
      zoom: this.props.zoom,
    });
    console.log(this.props);

    socket.on(SOCKET_CMDS.ROOM_FULL, this.full);
    socket.on(SOCKET_CMDS.BRIDGE, (role) => {
      console.log("Received bridge");
      this.props.media.init();
    });
    socket.on(SOCKET_CMDS.ROOM_JOIN_FEEDBACK, (data) => {
      if(data.error){
        console.warn(`Could not join room: ${JSON.stringify(data)}`);
        return;
      }

      this.props.setRoomData(data);
      console.log(`Role assigned ${JSON.stringify(data)}`);
      this.props.media.setState({ user: data.userRole, bridge: data.bridge });
      if(data.bridge == "join"){
        this.props.socket.emit(SOCKET_CMDS.AUTH, this.state);
        this.hideAuth();
        console.log('Emitting Auth');
      }
    });
    socket.on(SOCKET_CMDS.APPROVE, ({ message, sid }) => {
      console.log(`Received approve from ${sid}: ${message}`)
      this.props.media.setState({ bridge: "approve" });
      this.setState({ message, sid });
      setTimeout(() => {
        console.log(`Emitting ${SOCKET_CMDS.ACCEPT} ${sid}`)
        try{
          this.props.socket.emit(SOCKET_CMDS.ACCEPT, sid);
          this.hideAuth();
        }catch(error){
          console.error(`Error emitting accept `, error)
        }
      }, TIMES.AUTOACCEPT_WAIT);
    });

    socket.emit(SOCKET_CMDS.JOIN_ROOM);
    this.props.getUserMedia.then((stream) => {
      this.localStream = stream;
      const videoTracks = stream.getVideoTracks();
      console.log("VideoTracks: ",videoTracks);
      this.track = videoTracks[0];
      try{
        this.track.applyConstraints({
          advanced: [{ ["zoom"]: this.props.zoom }],
        }).catch( ( error ) => {
          console.warn(`Error applying constraints to track: `, error)
        });
        this.localStream.getVideoTracks()[0].enabled = this.state.video;
        this.localStream.getAudioTracks()[0].enabled = this.state.audio;
      }catch(error){
        console.warn(`Error applying constraints to track: `, error)
      }
    });
  }
  componentDidUpdate() {
    try{
      this.track.applyConstraints({
        advanced: [{ ["zoom"]: this.props.zoom }],
      }).catch( ( error ) => {
        console.warn(`Error applying constraints to track: `, error)
      });
    }catch(error){
      console.warn(`Error applying constraints to track: `, error)
    }
  }
  handleInput(e) {
    this.setState({ [e.target.dataset.ref]: e.target.value });
  }
  send(e) {
    e.preventDefault();
    this.props.socket.emit(SOCKET_CMDS.AUTH, this.state);
    this.hideAuth();
  }
  handleInvitation(e) {
    e.preventDefault();
    console.log(`Emitting Invitation accept ${e.target.dataset.ref}: ${this.state.sid}`)
    this.props.socket.emit(e.target.dataset.ref, this.state.sid); // I'm not sure why so many emit() had an array [cmd] as command
    this.hideAuth();
  }
  toggleVideo() {
    const video = (this.localStream.getVideoTracks()[0].enabled =
      !this.state.video);
    this.setState({ video: video });
    this.props.setVideo(video);
  }
  toggleAudio() {
    const audio = (this.localStream.getAudioTracks()[0].enabled =
      !this.state.audio);
    this.setState({ audio: audio });
    this.props.setAudio(audio);
  }
  handleHangup() {
    this.props.media.hangup();
  }
  render() {
    // this.track.applyConstraints({
    //   advanced: [{ ["zoom"]: this.props.zoom }],
    // });
    return (
      <Communication
        {...this.state}
        toggleVideo={this.toggleVideo}
        toggleAudio={this.toggleAudio}
        send={this.send}
        handleHangup={this.handleHangup}
        handleInput={this.handleInput}
        handleInvitation={this.handleInvitation}
      />
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
});

CommunicationContainer.propTypes = {
  socket: PropTypes.object.isRequired,
  getUserMedia: PropTypes.object.isRequired,
  audio: PropTypes.bool.isRequired,
  video: PropTypes.bool.isRequired,
  setVideo: PropTypes.func.isRequired,
  setRoomData: PropTypes.func.isRequired,
  setAudio: PropTypes.func.isRequired,
  media: PropTypes.instanceOf(MediaContainer),
};
export default connect(
  mapStateToProps,
  mapDispatchToProps
)(CommunicationContainer);
