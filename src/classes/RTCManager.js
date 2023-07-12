
import { CMDS } from '../managers/Communications'
import { TIMES } from '../managers/TimesDefinitions'

export default class WebRTCManager {
	constructor(socketRef, sessionMap) {
    	this.socketRef = socketRef;
		this.sessionMap = sessionMap;
		this.remoteStream = null;
		this.localStream = null;
		this.pc = null;
		this.dc = null;
		this.reconnectTimer = null;
		this.autoacceptTimer = null;
		this.lastUserIdRequest = null;
		this.recording = false;
		this.onAddStream = () => {};
	}

  handleRTCCommunication(data){
    console.log("Received RTC Communication", data)
    switch(data.bridge){
      case CMDS.RTC.ACTIONS.START_CALL: {
        break;
      }
      case CMDS.RTC.ACTIONS.HOST_APPROVAL_REQUEST: {
			console.log(`Received approval request for auth/join request from user ${data.userId}`)
		  this.lastUserIdRequest = data.userId
        // this.setState({ message, sid });
        this.autoacceptTimer = setTimeout(() => {
          try{
            this.socketRef.current.emit(CMDS.SOCKET.RTC_COMMUNICATION, {bridge: CMDS.RTC.ACTIONS.ACCEPT_JOIN_REQUEST, userId: this.lastUserIdRequest});
				this.lastUserIdRequest = null;
            // this.hideAuth();
          }catch(error){
            console.error(`Error emitting accept `, error)
          }
        }, TIMES.AUTOACCEPT_WAIT);
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
        	// this.socketRef.current.emit(CMDS.SOCKET.RTC_COMMUNICATION, {bridge: CMDS.RTC.ACTIONS.AUTH_REQUEST, state: this.state});
        // this.hideAuth();
        break;
      }
      case CMDS.RTC.ACTIONS.MESSAGE: {
			this.onMessage(data);
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
	console.log("Got new message ", message);
    if (message.type === "offer") {
      // set remote description and answer
      this.pc
        .setRemoteDescription(new RTCSessionDescription(message))
        .then(() => this.pc.createAnswer())
		  .then((answer) => this.pc.setLocalDescription(answer))
        .then(() => this.sendDescription())
        .catch((event) => console.error("Error sending Answer ", event)); // An error occurred, so handle the failure to connect
    } else if (message.type === "answer") {
      // set remote description
      this.pc.setRemoteDescription(new RTCSessionDescription(message));
    } else if (message.type === "candidate") {
      // add ice candidate
		const candidate = message.candidate ?? {};
      this.pc.addIceCandidate(candidate)
			.catch((error) => console.error("Error adding ice candidate ", candidate, error))
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
	  } else this.localVideo.play();

	//   if (controlData.recording == true && this.recording == false) {
	// 	 this.startRecording();
	//   }
	//   if (controlData.recording == false && this.recording == true) {
	// 	 this.stopRecording();
	//   }
	  // if (controlData.audio == false) {
	  //   this.localVideo.muted = true;
	  // } else this.localVideo.muted = false;
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


 startRecording() {
	// event.preventDefault();
	if (RECORD_AUDIO) {
	  // wipe old data chunks
	  this.chunks = [];
	  // start recorder with 10ms buffer
	  this.mediaRecorder.start(10);
	  // say that we're recording
	  this.setState({ recording: true });
	} else {
	  console.info("- AUDIO RECORDING IS DISABLED");
	  this.setState({ recording: false });
	}
 }

 stopRecording(accident_stop) {
	// event.preventDefault();
	if (RECORD_AUDIO) {
	  console.log("stopping recording");
	  // stop the recorder
	  this.mediaRecorder.stop();
	  // say that we're not recording
	  this.setState({ recording: false });
	  // save the video to memory
	  if (!accident_stop) {
		 this.saveVideo();
	  }
	}
 }

 saveVideo() {
	if (RECORD_VIDEO) {
	  // convert saved chunks to blob
	  const blob = new Blob(this.chunks, { type: "video/webm" });
	  // generate video url from blob
	  // const videoURL = window.URL.createObjectURL(blob);
	  // append videoURL to list of saved videos for rendering
	  let filename = this.sessionId + "_" + this.state.user;
	  FileSaver.saveAs(blob, filename);
	  // const videos = this.state.videos.concat([videoURL]);
	  // this.setState({ videos });
	} else {
	  console.info("- VIDEO RECORDING IS DISABLED");
	}
 }

	// send the offer to a server to be forwarded to the other peer
	sendDescription() {
		if (this.socketRef.current != null) {
			console.log("Sending description ", this.pc.localDescription)
			this.socketRef.current.emit(CMDS.SOCKET.RTC_COMMUNICATION, {bridge: CMDS.RTC.ACTIONS.MESSAGE, data: this.pc.localDescription});
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

	 onRemoteVideoPlay = () => {
		console.log("Remote Video Play");
		// start detect remote's face and process
		// this.tryStartFaceDetection().catch((error) => {
		//   console.warn(`Error attempting to start face detection emotion: ${error}`)
		// });
	 }


   startVideoCall() {      
      // call if we were the last to connect (to increase
      // chances that everything is set up properly at both ends)
      // console.log(`State user: ${this.state.user}`);
		navigator.mediaDevices.getUserMedia({
			audio: true,
			video: {
				width: { min: 1280, ideal: 1280 },
				height: { min: 720, ideal: 720 },
				zoom: true,
		},
		}).then((stream) => {
			this.localStream = stream;
			this.localVideo.srcObject = stream;
			this.localVideo.addEventListener("play",  () => this.onLocalVideoPlay());
			// attach local media to the peer connection
			stream.getTracks().forEach((track) => {
				console.log('Adding track ', track);
				this.pc.addTrack(track, this.localStream)
			});
			try{
				if(this.sessionMap.session.user.role.toLowerCase() === "host"){
					this.initiateCall()
				}
			}
			catch(error){
				console.error(`Error initiating call: `, error);
			}
		})
		.catch((event) => console.error("Error getting user media: " + e));
		
   }
	
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
		console.log("RTCPeerCOnnection created");

		this.pc.onconnectionstatechange = (event) => this.onIceConnectionStateChange(event);
		this.pc.addEventListener("iceconnectionstatechange", (event) => this.onIceConnectionStateChange(event));
		this.pc.onicecandidate = (event) => this.onIceCandidate(event);
		this.pc.ontrack = (event) => this.onTrack(event);
		this.pc.onaddstream = (event) => this.onAddStream(event);
		this.pc.ondatachannel = (event) => this.onDataChannel(event);
		console.log("RTCPeerCOnnection listeners added, initiating call...");
		this.startVideoCall();
	}

	onTrack(event) {
		console.log("ontrack", event);
	}

	onDataChannel(event) {
		console.log('ondatachannel', event);
		// data channel
		this.dc = event.channel;
		this.setupDataHandlers();
		this.sendData({
			peerMediaStream: {
				video: this.localStream.getVideoTracks()[0].enabled,
			},
		});
		//sendData('hello');
	}


	onIceCandidate(event) {
		console.log("onicecandidate", event);
		if (event.candidate) {
			if (this.socketRef.current != null) {
				this.socketRef.current.send({
					type: "candidate",
					candidate: event.candidate,
				});
			}
		}
	}
	onConnectionStateChange(event) {
		console.log("onconnectionstatechange change ", event);
	}
	onIceConnectionStateChange(event) {
		let pcstate = this.pc.iceConnectionState;
		console.log("iceconnection change ", pcstate);
		if (pcstate === "failed" || pcstate === "closed" || pcstate === "disconnected") {
			/* possibly reconfigure the connection in some way here */
			/* then request ICE restart */
			this.reconnectTimer = setInterval(() => {
				console.log("iceconnection trying to reconnect");
				location.reload();
			}, TIMES.ICE_RECONNECTION_INTERVAL);
		} else {
			clearInterval(this.reconnectTimer);
		}
	}

	sendData(msg) {
		if (this.dc != undefined && this.dc != null) {
			this.dc.send(JSON.stringify(msg));
		}
	}
}
