import React, { Component } from "react";
import SurveyComponent from "../components/SurveyComponent";

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
          <MediaContainer
            media={(media) => (this.media = media)}
            getUserMedia={this.getUserMedia}
          />
    );
  }
}


class SurveyTest extends Component {
  constructor(props) {
    super(props);
  }
  render() {
    return (
      <SurveyComponent />
    );
  }
}

export { FaceVideoTest, SurveyTest};