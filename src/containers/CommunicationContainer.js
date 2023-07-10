import React from "react";
import { PropTypes } from "prop-types";
import MediaContainer from "./MediaContainer";
import Communication from "../components/Communication";
import store from "../store";
import { connect } from "react-redux";
import { SOCKET_CMDS, RTC_CMDS } from '../managers/SocketCommands'
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
    this.autoacceptTimer = null;
    this.rtcManager = null;
  }

  
  hideAuth() {
    this.props.room.setState({ bridge: RTC_CMDS.STATUS.CONNECTING });
  }

  componentDidMount() {
    const socket = this.props.socket.current;

    socket.on(SOCKET_CMDS.HELLO, () => {
      console.log(`SOCKET CONNECTED (hello received): ${this.props?.socket?.id} ${this.props?.socket?.nsp}`)
      // console.log(`SOCKET CONNECTED (hello received): ${socket?.id} ${socket?.nsp}`)
    })

    socket.onAny((eventName, ...args) => {
      if(eventName !== SOCKET_CMDS.FACE_DETECTED){
        console.log(`Received event ${eventName}`, args)
      }
    });


    this.socket.on(SOCKET_CMDS.RTC_COMMUNICATION, (data) => {
      this.RTCManager.handleRTCCommunication(data);
      this.props.room.setState({ bridge: data.bridge });
    })

    socket.on(SOCKET_CMDS.CONNECT_ERROR, (err) => {
      console.log(`connect_error on ${this} due to ${err.message}`);
    });
    this.setState({
      video: this.props.video,
      audio: this.props.audio,
      zoom: this.props.zoom,
    });
    console.log(this.props);

    socket.on(SOCKET_CMDS.RTC_COMMUNICATION, (role) => {
      console.log("Received bridge");
      this.props.room.init();
    });
    socket.on(SOCKET_CMDS.ROOM_JOIN_FEEDBACK, (data) => {
      if(data.error){
        console.warn(`Could not join room: ${JSON.stringify(data)}`);
        return;
      }

      this.props.setRoomData(data);
      console.log(`Role assigned ${JSON.stringify(data)}`);
      this.props.room.setState({ bridge: data.bridge, user: data.userRoomId });
    });
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
    this.props.socket.emit(SOCKET_CMDS.RTC_COMMUNICATION, {bridge: RTC_CMDS.ACTIONS.REQUEST_JOIN, state: this.state});
    this.hideAuth();
  }
  handleInvitation(e) {
    e.preventDefault();
    if(this.autoacceptTimer != null) clearTimeout(this.autoacceptTimer);
    console.log(`Emitting Invitation accept ${e.target.dataset.ref}: ${this.state.sid}`)
    this.props.socket.emit(SOCKET_CMDS.RTC_COMMUNICATION, {bridge: RTC_CMDS.ACTIONS.ACCEPT_JOIN_REQUEST, sessionId: this.state.sid});
    // this.props.socket.emit(e.target.dataset.ref, this.state.sid); // I'm not sure why so many emit() calls had an array [cmd] as command
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
  render() {
    // this.track.applyConstraints({
    //   advanced: [{ ["zoom"]: this.props.zoom }],
    // });
    return (
      <Communication
        {...this.state}
        toggleVideo={() => this.toggleVideo()}
        toggleAudio={() => this.toggleAudio()}
        send={() => this.send()}
        handleInput={(e) => this.handleInput(e)}
        handleInvitation={(e) => this.handleInvitation(e)}
      />
    );
  }
}


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
export default connect(
  mapStateToProps,
  mapDispatchToProps
)(CommunicationContainer);
