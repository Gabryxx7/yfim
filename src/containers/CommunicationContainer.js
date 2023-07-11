import React, { useEffect, useState } from "react";
import Communication from "../components/Communication";
import store from "../store";
import { connect } from "react-redux";
import { CMDS } from '../managers/Communications'
import { TIMES } from '../managers/TimesDefinitions'



export default function CommunicationContainer(props) {
  const socketRef = props.socketRef;
  const [state, setState] = useState({});
  let autoacceptTimer = null;
  const rtcManager = null;
  const [track, setTrack] = useState(null);

  const handleInput = (e) => {
    setState({ [e.target.dataset.ref]: e.target.value });
  }

  const send = (e) => {
    e.preventDefault();
    socketRef.current.emit(CMDS.SOCKET.RTC_COMMUNICATION, {bridge: CMDS.RTC.ACTIONS.AUTH_REQUEST, state: state});
    hideAuth();
  }

  const handleInvitation = (e) => {
    e.preventDefault();
    if(autoacceptTimer != null) clearTimeout(autoacceptTimer);
    console.log(`Emitting Invitation accept ${e.target.dataset.ref}: ${state.sid}`)
    socketRef.current.emit(CMDS.SOCKET.RTC_COMMUNICATION, {bridge: CMDS.RTC.ACTIONS.ACCEPT_JOIN_REQUEST, sessionId: state.sid});
    // socketRef.current.emit(e.target.dataset.ref, state.sid); // I'm not sure why so many emit() calls had an array [cmd] as command
    hideAuth();
  }

  const toggleVideo = () => {
    const video = (localStream.getVideoTracks()[0].enabled =! state.video);
    setState({ video: video });
    // props.setVideo(video);
  }

  const toggleAudio = () => {
    const audio = (localStream.getAudioTracks()[0].enabled =
      !state.audio);
    setState({ audio: audio });
    // props.setAudio(audio);
  }

  const hideAuth = () => {
    this.props.room.setState({ bridge: CMDS.RTC.STATUS.CONNECTING });
  }

  useEffect(() => {

    socket.on(CMDS.SOCKET.HELLO, () => {
      console.log(`SOCKET CONNECTED (hello received): ${this.props?.socket?.id} ${this.props?.socket?.nsp}`)
      // console.log(`SOCKET CONNECTED (hello received): ${socket?.id} ${socket?.nsp}`)
    })



    this.socket.on(CMDS.SOCKET.RTC_COMMUNICATION, (data) => {
      this.RTCManager.handleRTCCommunication(data);
      this.props.room.setState({ bridge: data.bridge });
    })

    setState({
      video: this.props.video,
      audio: this.props.audio,
      zoom: this.props.zoom,
    });
    console.log(this.props);

    socket.on(CMDS.SOCKET.RTC_COMMUNICATION, (role) => {
      console.log("Received bridge");
    });

    // this.props.getUserMedia.then((stream) => {
    //   this.localStream = stream;
    //   const videoTracks = stream.getVideoTracks();
    //   console.log("VideoTracks: ",videoTracks);
    //   setTrack(videoTracks[0]);
    // });
  }, [])

  
	useEffect(() => {
    if(!track) return;
    try{
      track.applyConstraints({
        advanced: [{ ["zoom"]: this.props.zoom }],
      }).catch( ( error ) => {
        console.warn(`Error applying constraints to track: `, error)
      });
    }catch(error){
      console.warn(`Error applying constraints to track: `, error)
    }
	}, [track]);

	return (
    <Communication
      // {...state}
      toggleVideo={() => toggleVideo()}
      toggleAudio={() => toggleAudio()}
      send={() => send()}
      handleInput={(e) => handleInput(e)}
      handleInvitation={(e) => handleInvitation(e)}
    />
  );
}