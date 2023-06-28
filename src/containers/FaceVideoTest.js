import React, { Component } from "react";
import MediaContainer from "./MediaContainer";
const { SOCKET_CMDS, DATA_TYPES, NAMESPACES } = require('../managers/SocketCommands')

class FaceVideoTest extends Component {
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
  }
  render() {
    return (
        <div>
          <MediaContainer
            media={(media) => (this.media = media)}
            getUserMedia={this.getUserMedia}
          />
        </div>
    );
  }
}

export default FaceVideoTest;