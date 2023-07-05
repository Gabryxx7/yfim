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
      survey: false,
    };
    this.socket = io.connect(`/${NAMESPACES.CHAT}`);

    console.log(`Created Socket: ${this.socket?.nsp}`, this.socket);
  }
  componentDidMount() {
    this.props.createRoom();
  }
  render() {
    return (
        <div class="main-call-container">
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
            getUserMedia={this.getUserMedia}
          />
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
