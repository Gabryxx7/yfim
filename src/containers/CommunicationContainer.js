import React from "react";
import { PropTypes } from "prop-types";
import MediaContainer from "./MediaContainer";
import Communication from "../components/Communication";
import store from "../store";
import { connect } from "react-redux";
import { SOCKET_CMDS } from '../managers/SocketCommands'


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
    this.setState({
      video: this.props.video,
      audio: this.props.audio,
      zoom: this.props.zoom,
    });
    console.log(this.props);

    socket.on(SOCKET_CMDS.CREATE_ROOM.cmd, () =>
      this.props.media.setState({ user: "host", bridge: "create" })
    );
    socket.on(SOCKET_CMDS.ROOM_FULL.cmd, this.full);
    socket.on("bridge", (role) => this.props.media.init());
    socket.on(SOCKET_CMDS.JOIN_ROOM.cmd, () => {
      this.props.media.setState({ user: "guest", bridge: "join" });
      this.props.socket.emit(SOCKET_CMDS.AUTH.cmd, this.state);
      this.hideAuth();
    });
    socket.on("approve", ({ message, sid }) => {
      this.props.media.setState({ bridge: "approve" });
      this.setState({ message, sid });
      setTimeout(() => {
        this.props.socket.emit(["accept"], sid);
        this.hideAuth();
      }, 5000);
    });

    socket.emit(SOCKET_CMDS.FIND_ROOM.cmd);
    this.props.getUserMedia.then((stream) => {
      this.localStream = stream;
      this.track = stream.getVideoTracks()[0];

      this.track.applyConstraints({
        advanced: [{ ["zoom"]: this.props.zoom }],
      });
      this.localStream.getVideoTracks()[0].enabled = this.state.video;
      this.localStream.getAudioTracks()[0].enabled = this.state.audio;
    });
  }
  componentDidUpdate() {
    console.log(this.props);
    if (this.track) {
      this.track.applyConstraints({
        advanced: [{ ["zoom"]: this.props.zoom }],
      });
    }
  }
  handleInput(e) {
    this.setState({ [e.target.dataset.ref]: e.target.value });
  }
  send(e) {
    e.preventDefault();
    this.props.socket.emit(SOCKET_CMDS.AUTH.cmd, this.state);
    this.hideAuth();
  }
  handleInvitation(e) {
    e.preventDefault();
    this.props.socket.emit([e.target.dataset.ref], this.state.sid);
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
  zoom: store.controlParams.zoom,
});
const mapDispatchToProps = (dispatch) => ({
  setVideo: (boo) => store.dispatch({ type: "SET_VIDEO", video: boo }),
  setAudio: (boo) => store.dispatch({ type: "SET_AUDIO", audio: boo }),
});

CommunicationContainer.propTypes = {
  socket: PropTypes.object.isRequired,
  getUserMedia: PropTypes.object.isRequired,
  audio: PropTypes.bool.isRequired,
  video: PropTypes.bool.isRequired,
  setVideo: PropTypes.func.isRequired,
  setAudio: PropTypes.func.isRequired,
  media: PropTypes.instanceOf(MediaContainer),
};
export default connect(
  mapStateToProps,
  mapDispatchToProps
)(CommunicationContainer);
