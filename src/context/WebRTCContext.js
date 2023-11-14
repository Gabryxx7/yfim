import React, { createContext, useReducer, useCallback, useContext, useState, useEffect, useRef, forwardRef } from "react";
import { TIMES, CMDS, STAGE, KEY_SHORTCUTS } from '../backend/Definitions.js';
import { TOASTS } from "../frontend/components/ToastCommunications.js";
import { useSocket } from "./useSocket.js";
import { useUser, useSession } from "./AppContext.js";

const renderLog = (trigger) => console.log("WEBRTC UPDATED! Triggered by: "+trigger);
// The context is some sort of "global static" object that can be retrieved by any component at any time
export const WebRTCContext = createContext()

// The provider here is just a wrapper on top of the default provider to customise the data that we can get from it
export const WebRTCProvider = (props) => {
	const socket = props.socket ?? useSocket(props.namespace ?? CMDS.NAMESPACES.CHAT);
   const [bridge, setBridge] = useState(null);
   const [dataChannel, setDataChannel] = useState(null);
   const [stream, setStream] = useState(null);
   const {user, updateUser} = useUser();
   const userRef = useRef(user); // Very annoying issue with retrieving last state inside socket.io callbacks: https://medium.com/@kishorkrishna/cant-access-latest-state-inside-socket-io-listener-heres-how-to-fix-it-1522a5abebdb
   const {session} = useSession();
   const {localVideo, remoteVideo} = session;
   const [peerConnection, setPeerConnection] = useState(new RTCPeerConnection({
      iceServers: [
         { urls: "stun:stun.l.google.com:19302" },
         {
            urls: "turn:139.180.183.4:3478",
            username: "hao",
            credential: "158131hh2232A",
         },
      ],
   }));
   const peerConnectionRef = useRef(peerConnection);

   useEffect(() => {
      socket.on(CMDS.SOCKET.MESSAGE, (data) => onMessage(data));
      socket.on(CMDS.SOCKET.CONTROL, (data) => onControl(data));
      socket.on(CMDS.SOCKET.RTC_COMMUNICATION, (data) => handleRTCCommunication(data, user));
   }, [])

   useEffect(() => {
		// console.log(`RTC: PeerConnection created`);
		// peerConnection.onconnectionstatechange = (event) => onConnectionStateChange(event);
		peerConnection.oniceconnectionstatechange = (event) => onIceConnectionStateChange(event);
		// peerConnection.onsignalingstatechange = (event) => {console.log("Signaling state: " +peerConnection.signalingState)}
		peerConnection.onicecandidate = (event) => onIceCandidate(event);
		peerConnection.ontrack = (event) => onTrack(event);
		peerConnection.onaddstream = (event) => onAddStream(event);
		peerConnection.ondatachannel = (event) => setDataChannel(event.channel);
		// console.log(`RTC: PeerConnection listeners added, initiating call...`);
      peerConnectionRef.current = peerConnection;
   }, [peerConnection])

   useEffect(() => {
      renderLog('user');
      userRef.current = user;
   }, [user])

	const createPeerConnection = () => {
	};

	const hangup = () => {};

	const onMessage = (message, peerConnection) => {
		// console.log("Got new Message ", message);
		if (message.type === "offer") {
			// console.log("Got new OFFER ", message?.sdp);
			// set remote description and answer
			peerConnection
				.setRemoteDescription(new RTCSessionDescription(message))
				.then(() => peerConnection.createAnswer())
				.then((answer) => peerConnection.setLocalDescription(answer))
				.then(() => sendDescription())
				.catch((event) => console.error("Error sending Answer ", event)); // An error occurred, so handle the failure to connect
		} else if (message.type === "answer") {
			// console.log("Got new ANSWER ", message?.sdp);
			// set remote description
			peerConnection.setRemoteDescription(new RTCSessionDescription(message));
		} else if (message.type === "candidate") {
			// console.log("Got new CANDIDATE ", message?.candidate?.candidate);
			// add ice candidate
			peerConnection
				.addIceCandidate(message.candidate)
				.catch((error) => console.error("Error adding ice candidate ", message, error));
		}
	};

	// get setting and control(mask) data at the beginning of process
	const onControl = (control_data) => {
		console.log("On Control");
		const { user, controlData } = control_data;
		if (user == state.user) {
			props.updateAll(controlData);
			if (controlData.video == false) {
				localVideo.current.pause();
			} else {
				localVideo.current.play();
			}
		} else {
			if (remoteVideo != null) {
				if (controlData.video == false) {
					remoteVideo.pause();
				} else {
					remoteVideo.play();
				}
				if (controlData.audio == false) {
					remoteVideo.muted = true;
				} else {
					remoteVideo.muted = false;
				}
			}
		}
	};

   const onAddStream = (event) => {
      setStream(event.stream);
      setBridge(CMDS.RTC.STATUS.ESTABLISHED)
   }

	// audio recorder initialize

	const onLocalVideoPlay = () => {
		console.log("Local Video Play");
		let audio_track = localStream.getAudioTracks()[0];
		let video_track = localStream.getVideoTracks()[0];
		let audio_stream = new MediaStream();
		audio_stream.addTrack(audio_track);
		// audio_stream.addTrack(video_track);
		mediaRecorder = new MediaRecorder(localStream, {
			mimeType: "video/webm",
		});
		chunks = [];
		// listen for data from media recorder
		mediaRecorder.ondataavailable = (event) => {
			// not record audio during survey
			if (event.data && event.data.size > 0 && !state.survey_in_progress) {
				chunks.push(event.data);
			}
		};
	};

	const onIceConnectionStateChange = (event) => {
		let pcstate = peerConnection?.iceConnectionState;
		if (pcstate === "failed" || pcstate === "closed" || pcstate === "disconnected") {
			console.log("onconnectionstatechange change ", peerConnection?.connectionState);
		} else if (pcstate == "connected") {
			TOASTS.USER_JOINED.show();
		} else if (pcstate == "disconnected") {
			TOASTS.USER_LEFT.show();
		}
	};

	const handleRTCCommunication = (data) => {
      const user = userRef.current;
      const peerConnection = peerConnectionRef.current;
		console.log("RTC connection updated", data);
		switch (data?.bridge) {
			case CMDS.RTC.ACTIONS.HOST_APPROVAL_REQUEST: {
				console.log(`Received approval request for auth/join request from user ${data.userId}`);
				TOASTS.JOIN_REQUEST.show({
					onAction: () => {
						// console.log(`RTC: ${answer}ing join request from ${ data.userId}`);
						socket?.emit(CMDS.SOCKET.RTC_COMMUNICATION, {
							bridge: CMDS.RTC.ACTIONS.ACCEPT_JOIN_REQUEST,
							userId: data.userId,
						});
						setBridge({ bridge: CMDS.RTC.STATUS.CONNECTING });
					},
				});
				break;
			}
			case CMDS.RTC.STATUS.FULL: {
				console.log(`Room is full!`);
				break;
			}
			case CMDS.RTC.STATUS.HOST_HANGUP: {
				setBridge({ bridge: CMDS.RTC.STATUS.HOST_HANGUP });
				break;
			}
			case CMDS.RTC.ACTIONS.HANGUP: {
				// setPeerConnection(CMDS.RTC.STATUS.GUEST_HANGUP);
				peerConnection.close();
				socket?.emit(CMDS.SOCKET.ROOM_IDLE, { room: room });
				socket?.emit(CMDS.SOCKET.LEAVE_ROOM);
				break;
			}
			case CMDS.RTC.ACTIONS.JOIN_REQUEST: {
				console.log("Received Join request " + data?.msg);
				// hideAuth();
				break;
			}
			case CMDS.RTC.ACTIONS.MESSAGE: {
				onMessage(data?.data, peerConnection);
				break;
			}
			case CMDS.RTC.STATUS.PENDING_APPROVAL: {
				TOASTS.PENDING_APPROVAL.show();
				break;
			}
			case CMDS.RTC.STATUS.ACCEPTED: {
				localVideo?.current?.srcObject.getTracks().forEach((track) => {
					// console.log(`RTC: Adding local video track ${track.label} to PeerConnection`);
					peerConnection?.addTrack(track, localVideo?.current?.srcObject);
				});
				console.log("initializing call from user", user);
				if (user.role.toLowerCase() === "host") {
					peerConnection.createDataChannel("chat");
					peerConnection.createOffer({ iceRestart: true })
						.then((offer) => peerConnection?.setLocalDescription(offer))
						.then(sendDescription)
						.catch((event) => console.error("Error sending Offer ", event)); // An error occurred, so handle the failure to connect
				}
				break;
			}
			case CMDS.RTC.STATUS.GUEST_HANGUP:
			case CMDS.RTC.ACTIONS.START_CALL:
			case CMDS.RTC.STATUS.CONNECTING:
			case CMDS.RTC.STATUS.ESTABLISHED:
			default: {
				return;
			}
		}
	};

	// useEffect(() => {
	// 	if (!rtcConnection) return;
	// 	// console.log(`RTC: Bridge Updated`,bridge);
	// 	if (rtcConnection == "none") {
	// 		TOASTS.WAITING.show();
	// 		return;
	// 	}
	// 	TOASTS.WAITING.dismiss();
	// 	if (rtcConnection == CMDS.RTC.ACTIONS.HOST_APPROVAL_REQUEST) {
	// 		TOASTS.JOIN_REQUEST.show({ onAction: () => onJoinRequestAnswer });
	// 	} else if (rtcConnection == CMDS.RTC.STATUS.PENDING_APPROVAL) {
	// 		TOASTS.PENDING_APPROVAL.show();
	// 	} else {
	// 		TOASTS.PENDING_APPROVAL.dismiss();
	// 	}
	// }, [rtcConnection]);

	// send the offer to a server to be forwarded to the other peer
	const sendDescription = () => {
		// console.log(`RTC: Sending Local description`)
		socket?.emit(CMDS.SOCKET.RTC_COMMUNICATION, {
			bridge: CMDS.RTC.ACTIONS.MESSAGE,
			data: peerConnection?.localDescription,
		});
	};

	const onTrack = (event) => {
		// console.log("ontrack", event);
	};

	useEffect(() => {
		if (!dataChannel) return;
		// Set up the data channel message handler transfer data from peers
		dataChannel.onmessage = (event) => {
			// var msg = JSON.parse(event.data);
			// if (msg == "lose-face") {
			// 	setState({
			// 		...state,
			// 		visible: true,
			// 		ready: state.session.running,
			// 	});
			// }
			// if (msg == "recover") {
			// 	setState({
			// 		...state,
			// 		visible: false,
			// 		ready: true,
			// 	});
			// }
			// if (msg == CMDS.SOCKET.ROOM_IDLE) {
			// 	setState({
			// 		...state,
			// 		ready: false,
			// 	});
			// }
			console.log("received message over data channel:" + msg);
		};
		dataChannel.onclose = () => {
			remoteStream.getVideoTracks()[0].stop();
			console.log("The Data Channel is Closed");
		};
		dataChannel.send(
			JSON.stringify({
				peerMediaStream: {
					video: localVideo.current.srcObject.getVideoTracks()[0].enabled,
				},
			})
		);
	}, [dataChannel]);

	const onIceCandidate = (event) => {
		// console.log(`RTC: New ICE Candidate: ${event?.candidate?.candidate}`);
		if (event.candidate) {
			socket?.emit(CMDS.SOCKET.RTC_COMMUNICATION, {
				bridge: CMDS.RTC.ACTIONS.MESSAGE,
				data: {
					type: "candidate",
					candidate: event.candidate,
				},
			});
		}
	};

   return <WebRTCContext.Provider
      value={{
         stream, setStream,
         bridge, setBridge,
         socket,
         peerConnection,
         dataChannel
      }}>
         {props.children}
      </WebRTCContext.Provider>;
}
