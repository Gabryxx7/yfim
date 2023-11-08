import { CMDS, DATA, USER } from "./Definitions.js";
import console from "../utils/colouredLogger.js";
import fs from "fs";

/**
 * For this specific project there will only be two users at any time in one room:
 * - A host user with a generic "host" id
 * - A guest user with a generic "guest" id
 * Obviously the "this.Type" field is not really needed but just in case we'd like to expand this project to have more people in one room...
 * **/

const userUploadsRoot = "./uploads/";
class User {
	static TYPE = {
		NONE: "none",
		HOST: "host",
		GUEST: "guest",
	};
	static STATUS = {
		NONE: "none",
    	READY: "ready",
		IN_SESSION: "in_session",
	};
	constructor(socket, nsManager) {
		this.socket = socket;
		this.nsManager = nsManager;
		this.room = null;
		this.type = User.TYPE.NONE;
		this.id = this.socket.id; // Just for the purpose of this project
		this.order = -1; // Order in which the user entered the room
		this.name = null;
		this.status = USER.STATUS.NONE;
		this.rating = null;
		this.record = null;
		this.data = {};
		for (const dType in DATA.TYPE) {
			this.data[dType] = {
				ready: false,
				content: null,
			};
		}
		this.socket.onAny((eventName, data) => {
			if (eventName != CMDS.SOCKET.FACE_DETECTED && eventName != CMDS.SOCKET.RTC_COMMUNICATION) {
				console.debug(`Received event ${eventName} from ${this.constructor.name} ${this.id}`, data);
			}
		});
		this.setupCommonCallbacks();
		this.setupCallbacks();
	}

  getData(){
    return {
      id: this.id,
		order: this.order,
      name: this.name,
      role: this.type,
      status: this.status,
      room: this.room?.id
    }
  }

	get [Symbol.toStringTag]() {
		return `User ${this.type}, (socket) id: ${this.id} , nsp: ${this.socket?.nsp?.name}) in room '${this.room?.id}`;
	}

  isReady(){
    return this.status == USER.STATUS.READY;
  }

  setStatus(status){
    this.status = status;
  }

	setupCommonCallbacks() {
		this.socket.on(CMDS.SOCKET.DISCONNECT, () => this.disconnect());
		this.socket.on(CMDS.SOCKET.CONNECT_ERROR, () => this.connectError());
		this.socket.on(CMDS.SOCKET.SURVEY_CONNECT, (data) => this.surveyConnect(data));
		this.socket.on(CMDS.SOCKET.DATA_CONNECT, () => this.dataConnect());
		// this.socket.on(CMDS.SOCKET.SURVEY_START, (data) => this.surveyStart(data));
		this.socket.on(CMDS.SOCKET.SURVEY_END, (data) => this.surveyEnd(data));
		this.socket.on(CMDS.SOCKET.RESET, (data) => this.reset(data));
		this.socket.on(CMDS.SOCKET.FACE_DETECTED, (data) => this.onFaceDetected(data));
		this.socket.on(CMDS.SOCKET.PROCESS_CONTROL, (data) => this.onProcessControl(data));
		this.socket.on(CMDS.SOCKET.PROCESS_READY, (data) => this.onProcessReady(data));
		this.socket.on(CMDS.SOCKET.CONTROL, (data) => this.onControl(data));
		this.socket.on(CMDS.SOCKET.DATA_SEND, (data_get) => this.onDataSend(data_get));
	}

	setupCallbacks() {
		this.socket.on(CMDS.SOCKET.RTC_COMMUNICATION, (data) => {
      // console.debug(`Received RTC ${data.bridge} from ${this.constructor.name} ${this.id}`, data);
			switch (data.bridge) {
				case CMDS.RTC.ACTIONS.ACCEPT_JOIN_REQUEST: {
					this.sendRequestAnswer(data.userId, true);
					break;
				}
				case CMDS.RTC.ACTIONS.REJECT_JOIN_REQUEST: {
					this.sendRequestAnswer(data.userId, false);
					break;
				}
				case CMDS.RTC.ACTIONS.AUTH_REQUEST: {
					this.handleAuth(data);
					break;
				}
				case CMDS.RTC.CONNECTING: {
					break;
				}
				case CMDS.RTC.ACTIONS.MESSAGE: {
          		console.debug(`Received RTC ${data.data?.type} from ${this.constructor.name} ${this.id}`);
					this.room?.notifyRoom(CMDS.SOCKET.RTC_COMMUNICATION, data, this.socket);
					break;
				}
				case CMDS.RTC.ACTIONS.START_CALL: {
					break;
				}
				case CMDS.RTC.ESTABLISHED: {
					break;
				}
				case CMDS.RTC.FULL: {
					break;
				}
				case CMDS.RTC.GUEST_HANGUP: {
					break;
				}
				case CMDS.RTC.HOST_HANGUP: {
					break;
				}
				case CMDS.RTC.JOIN: {
					break;
				}
				default: {
					break;
				}
			}
		});
		// this.socket.on(CMDS.SOCKET.MESSAGE, (message) => this.room?.notifyRoom(CMDS.SOCKET.MESSAGE, message, this.socket));
		this.socket.on(CMDS.SOCKET.JOIN_ROOM, (userData) => this.joinCreateRoom(userData));
		this.socket.on(CMDS.SOCKET.LEAVE_ROOM, () => this.leaveRoom());
		this.socket.on(CMDS.SOCKET.CONTROL_ROOM, (data) => this.controlRoom(data));
		this.socket.on(CMDS.SOCKET.ROOM_IDLE, (data) => this.roomInIdle(data));
		this.socket.on(CMDS.SOCKET.TOGGLE_SESSION_PAUSE, (data) => this.togglePauseSession());
		// this.socket.on(CMDS.SOCKET.STAGE_COMPLETED, (data) => this.onUserStageCompleted(data));
		this.socket.on(CMDS.SOCKET.STEP_COMPLETED, (data) => this.onStepCompleted(data));
	}

	handleAuth(data) {
		if (this.type == User.TYPE.HOST) {
			data.sid = this.socket.id;
      this.room?.notifyRoom(CMDS.SOCKET.RTC_COMMUNICATION, {
				bridge: CMDS.RTC.ACTIONS.HOST_APPROVAL_REQUEST,
				data: data,
			}, this.socket);
			// console.info("- authenticate client in room " + this.room);
		}
	}

	sendRequestAnswer(userId, accepted) {
		if (this.room != null) {
			var feedback = accepted ? CMDS.RTC.STATUS.ACCEPTED : CMDS.RTC.STATUS.REJECTED;
			console.info(`- Host ${feedback} user ${userId} in room ${this.room?.id}`);
			var user = this.room.getUserById(userId);
			if (accepted) {
				user.socket.join(this.room.id);
        		this.room.session.updateSessionStatus();
			}
      this.room.notifyRoom(CMDS.SOCKET.RTC_COMMUNICATION, { bridge: feedback, user: user.id, userType: user.type });
		}
	}

	connectError(err) {
		console.log(`connect_error on ${this} due to ${err.message}`);
	}

	disconnect() {
		console.info(`- client ${this} disconnected`);
		// console.log(this.socket.rooms);
		this.leaveRoom(this);
		// this.socket.broadcast.to(room).emit("hangup");
		// console.log(`Sockets in room ${this.roomToString(this.nsManager.nsio, this.room.id)}`)
		// clearInterval(timmer);
		this.room?.session.stop("test", `${this} Disconnected`);
	}

	printRooms(namespace, roomId = null) {
		for (let [key, value] of namespace.adapter.rooms) {
			const isRoom = roomId === key ? "[+]" : "-";
			console.log(`${isRoom} ${this.roomToString(namespace, key)}`);
		}
	}

	leaveRoom() {
		try {
			if (this.room === null || this.room === undefined) {
				console.warn(`Cannot remove user ${this.id} from room ${this.room?.id}: Room does not exist`);
				return false;
			}
			const removed = this.room.removeUser(this);

			if (!removed) {
				console.warn(`Cannot remove user ${this.id} from room ${this.room?.id}: User not in room`);
				return false;
			}

      	this.room?.notifyRoom(CMDS.SOCKET.RTC_COMMUNICATION, { bridge: CMDS.RTC.ACTIONS.HANGUP }, this.socket);
			this.room?.notifyRoom(CMDS.SOCKET.ROOM_UPDATE, this.room?.getData());
			if (this.room.size <= 0) {
				this.nsManager.deleteRoom(this.room);
			}
			this.room = null;
		} catch (error) {
			console.warn(`Error removing user ${this.id} from room ${this.room?.id}`, error);
      return false;
		}
		console.info(`- client ${this} left the room ${this.room?.id}`);
    return true;
	}

	notifyClient(error = null) {
		const data = this.getData();
		
		if (error != null) {
			data.error = error;
		}
		this.socket.emit(CMDS.SOCKET.USER_UPDATE, data);
	}

	togglePauseSession() {
		this.room?.togglePauseSession();
	}
	onStepCompleted(data) {
		console.log(`User ${this.name} - ${this.id} completed stage`);
		if (data != null && data != undefined) {
			console.log("User completion data: ", data);
			var uploadDir = userUploadsRoot;
			try{
				if (!fs.existsSync(uploadDir)) {
					fs.mkdirSync(uploadDir);
				}
				uploadDir += this.room.session.id +"/";
				if (!fs.existsSync(uploadDir)) {
					fs.mkdirSync(uploadDir);
				}
				uploadDir += "Stage_" + (this.room.session.currentStageIdx+1) +"/";
				if (!fs.existsSync(uploadDir)) {
					fs.mkdirSync(uploadDir);
				}
			} catch(error){
				console.warn(`Error making dir ${uploadDir}`, error);
				uploadDir = userUploadsRoot;
			}
			fs.writeFileSync(uploadDir + data.filename, JSON.stringify(data.data, null, 3));
		}
    this.status = USER.STATUS.READY;
    this.room?.notifyRoom(CMDS.SOCKET.ROOM_UPDATE, this.room?.getData());
    this.room?.session.updateSessionStatus();
	}

	joinCreateRoom(userData) {
		console.log("Received Join/Create Room Request");
		if (userData.name != null && userData.name != undefined) {
			this.name = userData.name;
		}
		this.started = true;
		const url = this.socket.request.headers.referer;
		const urlRoomData = url.split("/room")[1];
		const roomId = "room_" + urlRoomData.split("/")[1];
		// console.log(this.room.id, urlRoomData)
		// this.type = url[url.length - 1];
		let userRoom = this.nsManager.getRoom(roomId);
		if (userRoom === null) {
			userRoom = this.nsManager.createRoom(roomId);
		}
		const joinFeedback = userRoom.addUser(this);
		console.warn(`Adding [${this.type}] ${this.id} to room ${roomId}: ${joinFeedback.code} = '${joinFeedback.msg}`);
		userRoom.printDebug();
		this.notifyClient(joinFeedback.code <= 0 ? joinFeedback : null);

		if (joinFeedback.code > 0) {
      this.status = USER.STATUS.READY;
      this.room?.notifyRoom(CMDS.SOCKET.ROOM_UPDATE, this.room?.getData());
			if (userRoom.size > 1) {
        // Broadcast to room this.room.id except for the sender
        this.room.notifyRoom(CMDS.SOCKET.RTC_COMMUNICATION, {bridge: CMDS.RTC.ACTIONS.JOIN_REQUEST, msg: `User ${this} is requesting to join the call`}, this.socket);

        // Only send this to the user who requested the approval, NOT a broadcast
				this.socket.emit(CMDS.SOCKET.RTC_COMMUNICATION, { bridge: CMDS.RTC.STATUS.PENDING_APPROVAL, msg: `Waiting for host to approve request`});

        userRoom.notifyHost(CMDS.SOCKET.RTC_COMMUNICATION, {
					bridge: CMDS.RTC.ACTIONS.HOST_APPROVAL_REQUEST,
					userId: this.id,
					userName: this.name,
				});
			} else {
				this.socket.emit(CMDS.SOCKET.RTC_COMMUNICATION, { bridge: CMDS.RTC.ACTIONS.START_CALL }); // Broadcast to room this.room.id except for the sender
			}
		}
	}

	controlRoom(data) {
		const room = data.room;
		console.info("- received control-room message for room: " + room);
		this.room.session.createRoom(room, this.socket, Room.TYPE.CONTROL);
		// control_room_list[room] = this.socket;
	}

	roomInIdle(data) {
		const { room } = data;
		// console.log(`room ${room} is idle now`);
		this.room.session.controlnsManager.nsio.to(this.room.id).emit(CMDS.SOCKET.ROOM_IDLE);
		console.info("- room idle: " + this.room + " -> initiate process stop");
		// this.room.session.stop(room, `${this} RoomIdle`);
	}

	surveyConnect(data) {
		console.log("Received survey connect");
		const { room, user } = data;
		this.socket.join("survey-" + this.room);
		// survey_socket[user] = socket;
		console.info("+ a survey was connected in room: " + this.room + ", user: " + user);
	}

	dataConnect() {
		db.view("search", "all", function (err, data) {
			const len = data.rows.length;
			console.info("- on data-connect()");
			console.log(data.rows, len);
			this.socket.emit("data-retrieve", data.rows);
		});
	}

	// survey send and control
	surveyStart(data) {
		console.log("survey start", data);
		const params_room = data.room;
		this.socket.broadcast.to(params_room).emit(CMDS.SOCKET.SURVEY_START);
		this.socket.broadcast.to("survey-" + params_room).emit(CMDS.SOCKET.SURVEY_START);
		console.info('+ send survey and room control in room: " ' + this.room);
	}

	surveyEnd(data) {
		const { room, user } = data;
		console.log('- survey was ended in room: " ' + this.room + ", user: " + user);
		survey_ready[user] = true;
		console.info("- Who`s ready? Guest: " + survey_ready["guest"] + ", Host: " + survey_ready["host"]);
		if (survey_ready["guest"] && survey_ready["host"]) {
			survey_in_progress = false;
			survey_ready = { host: false, guest: false };
			let stage_startTime = new Date().getTime();
			let extend_time = 0;
			if (stage == 2) {
				extend_time = 150;
			}
			if (stage == 3) {
				extend_time = 90;
			}
			let duration = extend_time;
			console.log("moving on: after", duration);
			this.nsManager.nsio.to(this.room.id).emit(CMDS.SOCKET.SURVEY_END, { stage_startTime, duration, stage });
			projectio.emit(CMDS.SOCKET.STAGE_CONTROL, { stage });
		}
	}

	reset(data) {
		if (this.room != null) {
			const { room } = data;
			console.info("- resetting room: " + this.room);
			this.room.session.stop(room, `${this} RESET`);
		}
	}

	onFaceDetected(data) {
		const { room, user } = data;
		// console.info("- face-detected received in room: " + room + ", user: " + user);

		// this.nsManager.nsio.emit(CMDS.SOCKET.FACE_DETECTED);
		this.nsManager.nsio.to(this.room.id).emit(CMDS.SOCKET.FACE_DETECTED, user);
	}

	onProcessControl(data) {
		const params_room = data.room;

		current_cfg = data.cfg;
		current_rating = data.topic;

		console.info("+ process-control received: ");
		console.log(current_cfg);
		console.log(current_rating);

		this.socket.broadcast.to(params_room).emit(CMDS.SOCKET.PROCESS_CONTROL);
	}

	onProcessReady(data) {
		// const { roomId, userId, rating, record } = data;
		this.room.session.onProcessReady(data);
	}

	onControl(data) {
		console.info("- control");
		console.log(data);

		const params_room = data.room;
		const params_data = data.data;
		this.socket.broadcast.to(params_room).emit(CMDS.SOCKET.CONTROL, params_data);
	}
}

export { User };
