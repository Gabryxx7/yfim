const { SOCKET_CMDS, DATA_TYPES, NAMESPACES } = require('./SocketCommands')
const { console  } = require("../utils/colouredLogger");
const e = require('express');


/** 
 * For this specific project there will only be two users at any time in one room:
 * - A host user with a generic "host" id 
 * - A guest user with a generic "guest" id
 * Obviously the "this.Type" field is not really needed but just in case we'd like to expand this project to have more people in one room... 
 * **/
class User {
    static TYPE = {
      NONE: "none",
      HOST: "host",
      GUEST: "guest"
    }
    constructor(socket, manager, sessionManager) {
      this.socket = socket;
      this.manager = manager;
      this.sessionManager = sessionManager;
      this.room = null;
      this.type = User.TYPE.NONE;
      this.id = this.type; // Just for the purpose of this project
      this.joined = false;
      this.ready = false;
      this.rating = null;
      this.record = null;
      this.data = {};
      for (const dType in DATA_TYPES) {
        this.data[dType] = {
          ready: false,
          content: null
        }
      }
      this.socket.onAny((eventName, ...args) => {
        if(eventName != SOCKET_CMDS.FACE_DETECTED){
          console.debug(`Received event ${eventName} on a ${this.constructor.name} ${this.id}`)
        }
      });
      this.setupCommonCallbacks();
      this.setupCallbacks();
    }

    get [Symbol.toStringTag]() {
      return `${this.id} (SOCKET: ${this.socket.id}, nsp: ${this.socket?.nsp?.name}) in room '${this.room}`;
    }

    setupCommonCallbacks(){
      this.socket.on(SOCKET_CMDS.DISCONNECT, () => this.disconnect());
      this.socket.on(SOCKET_CMDS.CONNECT_ERROR, () => this.connectError());
      this.socket.on(SOCKET_CMDS.SURVEY_CONNECT, (data) => this.surveyConnect(data));
      this.socket.on(SOCKET_CMDS.DATA_CONNECT, () => this.dataConnect());
      this.socket.on(SOCKET_CMDS.SURVEY_START, (data) => this.surveyStart(data));
      this.socket.on(SOCKET_CMDS.SURVEY_END, (data) => this.surveyEnd(data));
      this.socket.on(SOCKET_CMDS.RESET, (data) => this.reset(data));
      this.socket.on(SOCKET_CMDS.FACE_DETECTED, (data) => this.onFaceDetected(data));
      this.socket.on(SOCKET_CMDS.PROCESS_CONTROL, (data) => this.onProcessControl(data));
      this.socket.on(SOCKET_CMDS.PROCESS_READY, (data) => this.onProcessReady(data));
      this.socket.on(SOCKET_CMDS.CONTROL, (data) => this.onControl(data));
      this.socket.on(SOCKET_CMDS.DATA_SEND, (data_get) => this.onDataSend(data_get));
    }

    setupCallbacks(){
      this.socket.on(SOCKET_CMDS.MESSAGE, (message) => this.broadcastMessage(SOCKET_CMDS.MESSAGE, message));
      this.socket.on(SOCKET_CMDS.JOIN_ROOM, () => this.getRoom());
      this.socket.on(SOCKET_CMDS.LEAVE_ROOM, () => this.leaveRoom());
      this.socket.on(SOCKET_CMDS.AUTH, (data) => this.auth(data));
      this.socket.on(SOCKET_CMDS.ACCEPT, (id) => this.accept(id));
      this.socket.on(SOCKET_CMDS.REJECT, (id) => this.reject(id));
      this.socket.on(SOCKET_CMDS.CONTROL_ROOM, (data) => this.controlRoom(data));
      this.socket.on(SOCKET_CMDS.ROOM_IDLE, (data) => this.roomInIdle(data));
    }

    // sending to all clients in the room (channel) except sender
    broadcastMessage(cmd, message=null){
      const dbg_msg = message?.type ? `Type: ${message?.type}` : `${message}`
      console.log(`Broadcasting ${cmd} to room ${this.room}: ${dbg_msg}`);
      if(this.room !== null){
        if(message == null){
          this.socket.broadcast.to(this.room.id).emit(cmd)
        }else{
          this.socket.broadcast.to(this.room.id).emit(cmd, message)
        }
      }
    }
  
    auth(data){
      data.sid = this.socket.id;
      this.broadcastMessage(SOCKET_CMDS.APPROVE, data);
      // this.socket.broadcast.to(this.room.id).emit(SOCKET_CMDS.APPROVE, data);
      console.info("- authenticate client in room " + this.room);
    }
  
    accept(id){
      console.info("- accept client in room " + this.room);
      this.socket.join(this.room.id);
      // sending to all clients in 'game' room(channel), include sender
      this.manager.nsio.emit(SOCKET_CMDS.BRIDGE);
      this.sessionManager.startSession(this.manager.rooms[this.room.id]);
    }
  
    reject(id){
      this.socket.emit(SOCKET_CMDS.ROOM_FULL);
      console.info("- rejected");
    }

    connectError(err){
      console.log(`connect_error on ${this} due to ${err.message}`);
    }
  
    disconnect(){
      console.info(`- client ${this} disconnected`);
      console.log(this.socket.rooms);
      this.leaveRoom(this);
      this.broadcastMessage(SOCKET_CMDS.HANGUP)
      // this.socket.broadcast.to(room).emit("hangup");
      console.info(`- client ${this} left the room ${this.room}`);
      // console.log(`Sockets in room ${this.roomToString(this.manager.nsio, this.room.id)}`)
      // clearInterval(timmer);
      this.sessionManager.onProcessStop("test", `${this} Disconnected`);
    }

    printRooms(namespace, roomId=null){
      for (let [key, value] of namespace.adapter.rooms) {
        const isRoom = roomId === key ? "[+]" : "-"
        console.log(`${isRoom} ${this.roomToString(namespace, key)}`)
      }
    }

    leaveRoom(){
      try{
        if(this.room === null || this.room === undefined){
          console.warn(`Cannot remove user ${this.id} from room ${this.room}: Room does not exist`)
          return false;
        }
        const removed = this.room.removeUser(this);

        if(!removed){
            console.warn(`Cannot remove user ${this.id} from room ${this.room}: User not in room`)
            return false;
        }

        if(this.rooms[this.room.id].size <= 0){
          this.manager.deleteRoom(this.room);
        }
        this.room = null;
      }catch(error){
        console.warn(`Cannot remove user ${this.id} from room ${this.room}: Room does not exist`)
      }
    }
  
    getRoom(){
      this.started = true;
      const url = this.socket.request.headers.referer;
      const urlRoomData = url.split("/room")[1];
      const roomId = "room_"+urlRoomData.split("/")[1]
      // console.log(this.room.id, urlRoomData)
      // this.type = url[url.length - 1];
      let userRoom = this.manager.getRoom(roomId);
      if(userRoom === null){
        userRoom = this.manager.createRoom(roomId);
      }
      let userRoomId = '';
      if(userRoom.size <= 0){
        userRoomId = `HOST`;
        this.type = User.TYPE.HOST;
      }
      else{
        userRoomId = `Guest_${userRoom.size}`
        this.type = User.TYPE.GUEST;
      }
      this.id = `${userRoomId} (${this.socket.id})`
      const joinFeedback = userRoom.addUser(this);
      console.warn(`Adding user ${this.id} to room ${roomId}: ${joinFeedback.code} = '${joinFeedback.msg}`);
      console.warn(userRoom.toString());
      joinFeedback.room = roomId;
      if(joinFeedback.code <= 0){
        this.type = User.TYPE.NONE;
        this.id = this.type;
        joinFeedback.error = true;
      }
      else{
        joinFeedback.error = false;
        this.room = userRoom;
        if(userRoom.size <= 1){
          // If this is the first user then this will be the host which created the room
          console.log(`User ${this.id} is the host and created the room ${roomId}`);
          joinFeedback.userRole = User.TYPE.HOST;
          joinFeedback.userRoomId = userRoomId;
          joinFeedback.bridge = "create";
        }
        else{
          // Only emit "ROOM_JOIN_FEEDBACK" if this is not the first user, so not the host
          console.log(`User ${this.id} is a guest and created the room ${roomId}`);
          joinFeedback.userRole = User.TYPE.GUEST;
          joinFeedback.userRoomId = userRoomId;
          joinFeedback.bridge = "join";
        }
      }
      this.socket.emit(SOCKET_CMDS.ROOM_JOIN_FEEDBACK, joinFeedback);
      console.log(`Socket ID: ${this} \t URL: ${url}`)
    }
  
    controlRoom(data){
      const room = data.room;
      console.info("- received control-room message for room: " + room);
      this.sessionManager.createRoom(room, this.socket, Room.TYPE.CONTROL)
      // control_room_list[room] = this.socket;
    }
  
  
    roomInIdle(data){
      const { room } = data;
      // console.log(`room ${room} is idle now`);
      this.sessionManager.controlManager.nsio.emit(SOCKET_CMDS.ROOM_IDLE);
      console.info("- room idle: " + this.room + " -> initiate process stop");
      // this.sessionManager.onProcessStop(room, `${this} RoomIdle`);
    }
  
    surveyConnect(data){
      console.log("Received survey connect")
      const { room, user } = data;
      this.socket.join("survey-" + this.room);
      // survey_socket[user] = socket;
      console.info("+ a survey was connected in room: " + this.room + ", user: " + user);
    }
  
    dataConnect(){
      db.view("search", "all", function (err, data) {
        const len = data.rows.length;
        console.info("- on data-connect()");
        console.log(data.rows, len);
        this.socket.emit("data-retrieve", data.rows);
      });
    }
  
    // survey send and control
    surveyStart(data){
      console.log("survey start", data);
      const params_room = data.room;
      this.socket.broadcast.to(params_room).emit(SOCKET_CMDS.SURVEY_START);
      this.socket.broadcast.to("survey-" + params_room).emit(SOCKET_CMDS.SURVEY_START);
      console.info('+ send survey and room control in room: " ' + this.room);
    };
  
    surveyEnd(data){
      const { room, user } = data;
      console.log('- survey was ended in room: " ' + this.room + ", user: " + user);
      survey_ready[user] = true;
      console.info("- Who`s ready? Guest: " +
          survey_ready["guest"] +
          ", Host: " +
          survey_ready["host"]);
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
        this.manager.nsio.emit(SOCKET_CMDS.SURVEY_END, { stage_startTime, duration, stage });
        projectio.emit(SOCKET_CMDS.STAGE_CONTROL, { stage });
      }
    };
  
    reset(data){
      const { room } = data;
      console.info("- resetting room: " + this.room);
      this.manager.onProcessStop(room, `${this} RESET`);
    };
  
    onFaceDetected(data){
      const { room, user } = data;
      // console.info("- face-detected received in room: " + room + ", user: " + user);
  
      // this.manager.nsio.emit(SOCKET_CMDS.FACE_DETECTED);
      this.manager.nsio.emit(SOCKET_CMDS.FACE_DETECTED, user);
    };
  
    onProcessControl(data){
      const params_room = data.room;
  
      current_cfg = data.cfg;
      current_rating = data.topic;
  
      console.info("+ process-control received: ");
      console.log(current_cfg);
      console.log(current_rating);
  
      this.socket.broadcast.to(params_room).emit(SOCKET_CMDS.PROCESS_CONTROL);
    };
  
  
    onProcessReady(data){
      // const { roomId, userId, rating, record } = data;
      this.sessionManager.onProcessReady(data);
    }
  
  
    onDataSend(received){
      console.info(`- data-send: ${received}`);
  
      const { dataType, data, userId, roomId } = received;
      var user = this.sessionManager.rooms[roomId].getUser(userId);
      this.data[dataType].ready = true;
      this.data[dataType].content = data;
      
      setTimeout(() => {
        console.log("waiting for data uploading");
        if (
          emotion_ready["host"] &&
          emotion_ready["guest"] &&
          question_ready["host"] &&
          question_ready["guest"]
        ) {
          console.info("- call store data");
          storeData(room);
        }
      }, 5000);
    };
  
    onControl(data){
      console.info("- control");
      console.log(data);
  
      const params_room = data.room;
      const params_data = data.data;
      this.socket.broadcast.to(params_room).emit(SOCKET_CMDS.CONTROL, params_data);
    }
  }
  
module.exports = { User }