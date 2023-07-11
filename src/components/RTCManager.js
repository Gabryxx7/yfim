const { CMDS } = require('../managers/Communications')
import { TIMES } from '../managers/TimesDefinitions'

export default class WebRTCManager {
	constructor(socketRef) {
    this.socketRef = socketRef;
		this.pc = null;
		this.dc = null;
		this.reconnectTimer = null;
		this.autoacceptTimer = null;
		this.lastUserIdRequest = null;
	}

  handleRTCCommunication(data){
    console.log("Received RTC Communication", data)
    switch(data.bridge){
      case CMDS.RTC.ACTIONS.START_CALL: {
        this.initCall();
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

        break;
      }
      default: {

        return;
      }
    }
  }

	attachMediaIfReady() {
		this.setupDataChannel();
		this.pc
			.createOffer({ iceRestart: true })
			.then(() => this.setDescription())
			.then(() => this.sendDescription())
			.catch(() => this.handleError()); // An error occurred, so handle the failure to connect
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

	setDescription(offer) {
		return this.pc.setLocalDescription(offer);
	}
	// send the offer to a server to be forwarded to the other peer
	sendDescription() {
		if (this.socketRef.current != null) {
			this.socketRef.current.send(CMDS.SOCKET.RTC_COMMUNICATION, {bridge: CMDS.RTC.ACTIONS.MESSAGE, data: this.pc.localDescription});
		}
	}
	handleError(e) {
		console.log(e);
	}
	// Set up the data channel message handler
	// transfer data from peers
	setupDataChannel() {
		this.dc = this.pc.createDataChannel("chat");
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
			if (msg == CMDS.SOCKET.ROOM_IDLE) {
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
		this.pc.onicecandidate = (e) => (event) => this.onIceCandidate(event);
		this.pc.ontrack = (e) => (event) => this.onTrack(event);
		this.pc.onaddstream = (e) => (event) => this.onAddStream(event);
		this.pc.ondatachannel = (e) => (event) => this.onDataChannel(event);
		console.log("RTCPeerCOnnection listeners added");
	}

	onTrack(event) {
		console.log("ontrack", event);
	}

	onDataChannel(event) {
		// console.log('ondatachannel', e);
		// data channel
		this.dc = e.channel;
		this.setupDataChannel();
		this.sendData({
			peerMediaStream: {
				video: this.media.localStream.getVideoTracks()[0].enabled,
			},
		});
		//sendData('hello');
	}

	// when the other side added a media stream, show it on screen
	onAddStream(event) {
		console.log("onaddstream", e);
		if (this.media.remoteVideo != null) {
			this.media.remoteStream = e.stream;
			this.media.remoteVideo.srcObject = this.media.remoteStream = e.stream;
			this.setState({ ...this.state, bridge: CMDS.RTC.STATUS.ESTABLISHED });
		}
	}

	onIceCandidate(event) {
		console.log("onicecandidate", event);
		if (e.candidate) {
			if (this.socketRef.current != null) {
				this.socketRef.current.send({
					type: "candidate",
					candidate: e.candidate,
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
