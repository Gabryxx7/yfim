const { SOCKET_CMDS, RTC_CMDS } = require('../managers/SocketCommands')
import { TIMES } from '../managers/TimesDefinitions'

export default class WebRTCManager {
	constructor(socketRef) {
    this.socketRef = socketRef;
		this.pc = null;
		this.dc = null;
		this.reconnectTimer = null;
		this.autoacceptTimer = null;
	}

  handleRTCCommunication(data){
    console.log("Received RTC Communication", data)
    switch(data.bridge){
      case RTC_CMDS.ACTIONS.START_CALL: {
        this.initCall();
        break;
      }
      case RTC_CMDS.ACTIONS.APPROVE_REQUEST: {
        console.log(data);
        const { message, sid } = data.data;
        console.log(`Received approve request from ${sid}: ${message}`)
        // this.setState({ message, sid });
        this.autoacceptTimer = setTimeout(() => {
          try{
            this.socketRef.current.emit(SOCKET_CMDS.RTC_COMMUNICATION, {bridge: RTC_CMDS.ACTIONS.ACCEPT_JOIN_REQUEST, sid: sid});
            // this.hideAuth();
          }catch(error){
            console.error(`Error emitting accept `, error)
          }
        }, TIMES.AUTOACCEPT_WAIT);
        break;
      }
      case RTC_CMDS.STATUS.CONNECTING: {

        break;
      }
      case RTC_CMDS.STATUS.ESTABLISHED: {

        break;
      }
      case RTC_CMDS.STATUS.FULL: {
        console.log(`Room is full!`)
        break;
      }
      case RTC_CMDS.STATUS.GUEST_HANGUP: {

        break;
      }
      case RTC_CMDS.STATUS.HOST_HANGUP: {
        this.onRemoteHangup(data);

        break;
      }
      case RTC_CMDS.ACTIONS.HANGUP: {
        break;
      }
      case RTC_CMDS.ACTIONS.JOIN_CALL: {
        this.socketRef.current.emit(SOCKET_CMDS.RTC_COMMUNICATION, {bridge: RTC_CMDS.ACTIONS.REQUEST_JOIN, state: this.state});
        // this.hideAuth();
        console.log('Emitting Auth');
        break;
      }
      case RTC_CMDS.ACTIONS.MESSAGE: {

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
    this.setState({ ...this.state, bridge: RTC_CMDS.STATUS.HOST_HANGUP });
  }

  hangup() {
    this.setState({ ...this.state, bridge: RTC_CMDS.STATUS.GUEST_HANGUP });
    this.pc.close();
    if(this.socketRef.current != null){
      this.socketRef.current.emit(SOCKET_CMDS.ROOM_IDLE, { room: this.room });
      this.socketRef.current.emit(SOCKET_CMDS.LEAVE_ROOM);
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
			this.socketRef.current.send(SOCKET_CMDS.RTC_COMMUNICATION, {bridge: RTC_CMDS.ACTIONS.MESSAGE, data: this.pc.localDescription});
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
			if (msg == SOCKET_CMDS.ROOM_IDLE) {
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
			this.setState({ ...this.state, bridge: RTC_CMDS.STATUS.ESTABLISHED });
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
