import { CMDS } from '../../backend/Definitions.js'

export default class WebRTCManager {
	constructor(socketRef, sessionMap) {
    	this.socketRef = socketRef;
		this.sessionMap = sessionMap;
		this.remoteStream = null;
		this.localVideo = null;
		this.pc = null;
		this.dc = null;
		this.lastUserIdRequest = null;
		this.recording = false;
		this.onAddStream = () => {};
		this.onConnectionStateChange = () => {console.log("onconnectionstatechange change ", this.pc.connectionState);};
	}

  handleRTCCommunication(data){
   //  console.log("Received RTC Communication", data)
    switch(data.bridge){
      case CMDS.RTC.ACTIONS.START_CALL: {
        break;
      }
      case CMDS.RTC.ACTIONS.HOST_APPROVAL_REQUEST: {
			console.log(`Received approval request for auth/join request from user ${data.userId}`)
		  this.lastUserIdRequest = data.userId
        // this.setState({ message, sid });
        break;
      }
      case CMDS.RTC.STATUS.CONNECTING: {

        break;
      }
      case CMDS.RTC.STATUS.ESTABLISHED: {

        break;
      }
      case CMDS.RTC.STATUS.FULL: {
        console.log(`Room is full!`)
        break;
      }
      case CMDS.RTC.STATUS.GUEST_HANGUP: {

        break;
      }
      case CMDS.RTC.STATUS.HOST_HANGUP: {
        this.onRemoteHangup(data);

        break;
      }
      case CMDS.RTC.ACTIONS.HANGUP: {
        break;
      }
      case CMDS.RTC.ACTIONS.JOIN_REQUEST: {
			console.log('Received Join request ' + data?.msg);
        // this.hideAuth();
        break;
      }
      case CMDS.RTC.ACTIONS.MESSAGE: {
			this.onMessage(data.data);
        break;
      }
      case CMDS.RTC.STATUS.PENDING_APPROVAL: {
        break;
      }
      case CMDS.RTC.STATUS.ACCEPTED: {
			this.initCall();
        break;
      }
      default: {

        return;
      }
    }
  }

  initiateCall(){
		this.pc.createDataChannel("chat");
		this.pc
			.createOffer({ iceRestart: true })
			.then((offer) => this.pc.setLocalDescription(offer))
			.then(() => this.sendDescription())
			.catch((event) => console.error("Error sending Offer ", event)); // An error occurred, so handle the failure to connect
  }

  onRemoteHangup() {
    this.setState({ ...this.state, bridge: CMDS.RTC.STATUS.HOST_HANGUP });
  }

  hangup() {
    this.setState({ ...this.state, bridge: CMDS.RTC.STATUS.GUEST_HANGUP });
    this.pc.close();
    if(this.socketRef.current != null){
      this.socketRef.current.emit(CMDS.SOCKET.ROOM_IDLE, { room: this.room });
      this.socketRef.current.emit(CMDS.SOCKET.LEAVE_ROOM);
    }
  }

  onMessage(message) {
	// console.log("Got new Message ", message);
    if (message.type === "offer") {
		// console.log("Got new OFFER ", message?.sdp);
      // set remote description and answer
      this.pc
        .setRemoteDescription(new RTCSessionDescription(message))
        .then(() => this.pc.createAnswer())
		  .then((answer) => this.pc.setLocalDescription(answer))
        .then(() => this.sendDescription())
        .catch((event) => console.error("Error sending Answer ", event)); // An error occurred, so handle the failure to connect
    } else if (message.type === "answer") {
		// console.log("Got new ANSWER ", message?.sdp);
      // set remote description
      this.pc.setRemoteDescription(new RTCSessionDescription(message));
    } else if (message.type === "candidate") {
		// console.log("Got new CANDIDATE ", message?.candidate?.candidate);
      // add ice candidate
      this.pc.addIceCandidate(message.candidate)
			.catch((error) => console.error("Error adding ice candidate ", message, error))
    }
  }


  // get setting and control(mask) data at the beginning of process
  onControl(control_data) {
	console.log("On Control");
	const { user, controlData } = control_data;
	if (user == this.state.user) {
	  this.props.updateAll(controlData);
	  if (controlData.video == false) {
		 this.localVideo.pause();
	  } else{
		this.localVideo.play();
	  }
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


	// send the offer to a server to be forwarded to the other peer
	sendDescription() {
		if (this.socketRef.current != null) {
			// console.log(`RTC: Sending Local description`)
			this.socketRef.current.emit(CMDS.SOCKET.RTC_COMMUNICATION, {bridge: CMDS.RTC.ACTIONS.MESSAGE, data:this.pc.localDescription});
		}
	}

    // audio recorder initialize

	 onLocalVideoPlay = () => {
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
      this.mediaRecorder.ondataavailable = (event) => {
        // not record audio during survey
        if (event.data && event.data.size > 0 && !this.state.survey_in_progress) {
          this.chunks.push(event.data);
        }
      };
      // if(this.socket == null){
      //   this.tryStartFaceDetection().catch((error) => {
      //     console.warn(`Error attempting to start face detection: ${error}`)
      //   });
      // }
	 }

   // startVideoCall() {      
   //    // call if we were the last to connect (to increase
   //    // chances that everything is set up properly at both ends)
   //    // console.log(`State user: ${this.state.user}`);
	// 	navigator.mediaDevices.getUserMedia({
	// 		audio: true,
	// 		video: {
	// 			width: { min: 1280, ideal: 1280 },
	// 			height: { min: 720, ideal: 720 },
	// 			zoom: true,
	// 	},
	// 	}).then((stream) => {
	// 		this.localStream = stream;
	// 		this.localVideo.srcObject = stream;
	// 		this.localVideo.addEventListener("play",  () => this.onLocalVideoPlay());
	// 		// attach local media to the peer connection
	// 		stream.getTracks().forEach((track) => {
	// 			console.log('Adding track ', track);
	// 			this.pc.addTrack(track, this.localStream)
	// 		});
	// 		try{
	// 			if(this.sessionMap.session.user.role.toLowerCase() === "host"){
	// 				this.initiateCall()
	// 			}
	// 		}
	// 		catch(error){
	// 			console.error(`Error initiating call: `, error);
	// 		}
	// 	})
	// 	.catch((event) => console.error("Error getting user media: " + e));
		
   // }
	
	// Set up the data channel message handler
	// transfer data from peers
	setupDataHandlers() {
		this.dc.onmessage = (event) => {
			// var msg = JSON.parse(event.data);
			// if (msg == "lose-face") {
			// 	this.setState({
			// 		...this.state,
			// 		visible: true,
			// 		ready: this.state.session.running,
			// 	});
			// }
			// if (msg == "recover") {
			// 	this.setState({
			// 		...this.state,
			// 		visible: false,
			// 		ready: true,
			// 	});
			// }
			// if (msg == CMDS.SOCKET.ROOM_IDLE) {
			// 	this.setState({
			// 		...this.state,
			// 		ready: false,
			// 	});
			// }
			console.log("received message over data channel:" + msg);
		};
		this.dc.onclose = () => {
			this.remoteStream.getVideoTracks()[0].stop();
			console.log("The Data Channel is Closed");
		};
	}

	initCall() {
		// set up the peer connection
		// this is one of Google's public STUN servers
		// make sure your offer/answer role does not change. If user A does a SLD
		// with type=offer initially, it must do that during  the whole session
		this.pc = new RTCPeerConnection({
			iceServers: [
				{ urls: "stun:stun.l.google.com:19302" },
				{
					urls: "turn:139.180.183.4:3478",
					username: "hao",
					credential: "158131hh2232A",
				},
			],
		});
		// console.log(`RTC: PeerConnection created`);

		// this.pc.onconnectionstatechange = (event) => this.onConnectionStateChange(event);
		this.pc.oniceconnectionstatechange = (event) => this.onIceConnectionStateChange(event);
		// this.pc.onsignalingstatechange = (event) => {console.log("Signaling state: " +this.pc.signalingState)}
		this.pc.onicecandidate = (event) => this.onIceCandidate(event);
		this.pc.ontrack = (event) => this.onTrack(event);
		this.pc.onaddstream = (event) => this.onAddStream(event);
		this.pc.ondatachannel = (event) => this.onDataChannel(event);
		// console.log(`RTC: PeerConnection listeners added, initiating call...`);

		this.localVideo.srcObject.getTracks().forEach((track) => {
			// console.log(`RTC: Adding local video track ${track.label} to PeerConnection`);
			this.pc.addTrack(track, this.localVideo.srcObject)
		});
		try{
			if(this.sessionMap.session.user.role.toLowerCase() === "host"){
				this.initiateCall()
			}
		}
		catch(error){
			console.error(`Error initiating call: `, error);
		}
	}

	onTrack(event) {
		// console.log("ontrack", event);
	}

	onDataChannel(event) {
		// console.log('ondatachannel', event);
		// data channel
		this.dc = event.channel;
		this.setupDataHandlers();
		if (this.dc != undefined && this.dc != null) {
			const msg = JSON.stringify({
				peerMediaStream: {
					video: this.localVideo.srcObject.getVideoTracks()[0].enabled,
				},
			});
			this.dc.send(msg);
		}
	}


	onIceCandidate(event) {
		// console.log(`RTC: New ICE Candidate: ${event?.candidate?.candidate}`);
		if (event.candidate) {
			if (this.socketRef.current != null) {
				this.socketRef.current.emit(CMDS.SOCKET.RTC_COMMUNICATION, {
					bridge: CMDS.RTC.ACTIONS.MESSAGE,
					data:{
						type: "candidate",
						candidate: event.candidate
					}
				});
			}
		}
	}
	onIceConnectionStateChange(event) {
		let pcstate = this.pc.iceConnectionState;
		this.onConnectionStateChange(pcstate);
		// console.log("iceconnection change ", pcstate);
		if (pcstate === "failed" || pcstate === "closed" || pcstate === "disconnected") {
			this.onConnectionStateChange(pcstate);
		}
	}
}
