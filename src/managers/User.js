const { SOCKET_CMDS, DATA_TYPES, NAMESPACES } = require('./SocketCommands')
const { console  } = require("../utils/colouredLogger")


/** 
 * For this specific project there will only be two users at any time in one room:
 * - A host user with a generic "host" id 
 * - A guest user with a generic "guest" id
 * Obviously the "User.Type" field is not really needed but just in case we'd like to expand this project to have more people in one room... 
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
      this.roomId = null;
      this.userType = User.TYPE.NONE;
      this.userId = this.userType; // Just for the purpose of this project
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
      this.socketId = `${this.userId} (${this.socket.id}) in room '${this.roomId} (nsp: ${this.socket?.nsp?.name})`;
      // console.log(this.socket)
      this.socket.onAny((eventName, ...args) => {
        console.debug(`Received event ${eventName} on a ${this.constructor.name} ${this.userId}`)
      });
      this.setupCommonCallbacks();
      this.setupCallbacks();
    }

    setupCommonCallbacks(){
      this.socket.on(SOCKET_CMDS.DISCONNECT.cmd, () => this.disconnect());
      this.socket.on(SOCKET_CMDS.CONNECT_ERROR.cmd, () => this.connectError());
      this.socket.on(SOCKET_CMDS.SURVEY_CONNECT.cmd, (data) => this.surveyConnect(data));
      this.socket.on(SOCKET_CMDS.DATA_CONNECT.cmd, () => this.dataConnect());
      this.socket.on(SOCKET_CMDS.SURVEY_START.cmd, (data) => this.surveyStart(data));
      this.socket.on(SOCKET_CMDS.SURVEY_END.cmd, (data) => this.surveyEnd(data));
      this.socket.on(SOCKET_CMDS.RESET.cmd, (data) => this.reset(data));
      this.socket.on(SOCKET_CMDS.FACE_DETECTED.cmd, (data) => this.onFaceDetected(data));
      this.socket.on(SOCKET_CMDS.PROCESS_CONTROL.cmd, (data) => this.onProcessControl(data));
      this.socket.on(SOCKET_CMDS.PROCESS_READY.cmd, (data) => this.onProcessReady(data));
      this.socket.on(SOCKET_CMDS.CONTROL.cmd, (data) => this.onControl(data));
      this.socket.on(SOCKET_CMDS.DATA_SEND.cmd, (data_get) => this.onDataSend(data_get));
    }

    setupCallbacks(){
      this.socket.on(SOCKET_CMDS.MESSAGE.cmd, (message) => this.broadcastMessage(SOCKET_CMDS.MESSAGE.cmd, message));
      this.socket.on(SOCKET_CMDS.FIND_ROOM.cmd, () => this.getRoom());
      this.socket.on(SOCKET_CMDS.LEAVE_ROOM.cmd, () => this.leaveRoom());
      this.socket.on(SOCKET_CMDS.AUTH.cmd, (data) => this.auth(data));
      this.socket.on(SOCKET_CMDS.ACCEPT.cmd, (id) => this.accept(id));
      this.socket.on(SOCKET_CMDS.REJECT.cmd, (id) => this.reject(id));
      this.socket.on(SOCKET_CMDS.CONTROL_ROOM.cmd, (data) => this.controlRoom(data));
      this.socket.on(SOCKET_CMDS.ROOM_IDLE.cmd, (data) => this.roomIdle(data));
    }
  
    // sending to all clients in the room (channel) except sender
    broadcastMessage(cmd, message=null){
      const dbg_msg = message?.type ? `Type: ${message?.type}` : `${message}`
      console.log(`Broadcasting ${cmd} to room ${this.roomId}: ${dbg_msg}`);
      if(this.roomId != null){
        if(message == null){
          this.socket.broadcast.to(this.roomId).emit(cmd)
        }else{
          this.socket.broadcast.to(this.roomId).emit(cmd, message)
        }
      }
    }
  
    auth(data){
      data.sid = this.socket.id;
      this.broadcastMessage(SOCKET_CMDS.APPROVE.cmd, data);
      // this.socket.broadcast.to(this.roomId).emit(SOCKET_CMDS.APPROVE.cmd, data);
      console.info("- authenticate client in room " + this.roomId);
    }
  
    accept(id){
      console.info("- accept client in room " + this.roomId);
      this.socket.join(this.roomId);
      // sending to all clients in 'game' room(channel), include sender
      this.manager.nsio.emit(SOCKET_CMDS.BRIDGE.cmd);
      this.sessionManager.startSession(this.manager.rooms[this.roomId]);
    }
  
    reject(id){
      this.socket.emit(SOCKET_CMDS.ROOM_FULL.cmd);
      console.info("- rejected");
    }

    connectError(err){
      console.log(`connect_error on ${this.socketId} due to ${err.message}`);
    }
  
    disconnect(){
      console.info(`- client ${this.socketId} disconnected`);
      console.log(this.socket.rooms);
      this.manager.removeUserFromRoom(this);
      this.broadcastMessage(SOCKET_CMDS.HANGUP.cmd)
      // this.socket.broadcast.to(room).emit("hangup");
      console.info(`- client ${this.socketId} left the room ${this.roomId}`);
      // console.log(`Sockets in room ${this.roomToString(this.manager.nsio, this.roomId)}`)
      // clearInterval(timmer);
      this.sessionManager.onProcessStop("test", `${this.socketId} Disconnected`);
    }

    printRooms(namespace, roomId=null){
      for (let [key, value] of namespace.adapter.rooms) {
        const isRoom = roomId === key ? "[+]" : "-"
        console.log(`${isRoom} ${this.roomToString(namespace, key)}`)
      }
    }
  
    getRoom(){
      this.started = true;
      const url = this.socket.request.headers.referer.split("/");
      this.userType = url[url.length - 1];
      this.userId = this.userType;
      this.roomId = url[url.length - 2];
      this.roomId = `room_${this.roomId}`;
      this.socketId = `${this.userId} (${this.socket.id}) in room '${this.roomId}`;
      console.log(`Socket ID: ${this.socketId} \t URL: ${url}`)
      this.manager.findUserRoom(this);
    }
  
    controlRoom(data){
      const room = data.room;
      console.info("- received control-room message for room: " + room);
      this.sessionManager.createRoom(room, this.socket, Room.TYPE.CONTROL)
      // control_room_list[room] = this.socket;
    }
  
  
    roomIdle(data){
      const { room } = data;
      // console.log(`room ${room} is idle now`);
      controlio.emit(SOCKET_CMDS.ROOM_IDLE.cmd);
      console.info("- room idle: " + this.roomId + " -> initiate process stop");
      this.sessionManager.onProcessStop(room, `${this.socketId} RoomIdle`);
    }
  
    surveyConnect(data){
      console.log("Received survey connect")
      const { room, user } = data;
      this.socket.join("survey-" + this.roomId);
      // survey_socket[user] = socket;
      console.info("+ a survey was connected in room: " + this.roomId + ", user: " + user);
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
      this.socket.broadcast.to(params_room).emit(SOCKET_CMDS.SURVEY_START.cmd);
      this.socket.broadcast.to("survey-" + params_room).emit(SOCKET_CMDS.SURVEY_START.cmd);
      console.info('+ send survey and room control in room: " ' + this.roomId);
    };
  
    surveyEnd(data){
      const { room, user } = data;
      console.log('- survey was ended in room: " ' + this.roomId + ", user: " + user);
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
        this.manager.nsio.emit(SOCKET_CMDS.SURVEY_END.cmd, { stage_startTime, duration, stage });
        projectio.emit(SOCKET_CMDS.STAGE_CONTROL.cmd, { stage });
      }
    };
  
    reset(data){
      const { room } = data;
      console.info("- resetting room: " + this.roomId);
      this.manager.onProcessStop(room, `${this.socketId} RESET`);
    };
  
    onFaceDetected(data){
      const { room, user } = data;
      // console.info("- face-detected received in room: " + room + ", user: " + user);
  
      // this.manager.nsio.emit(SOCKET_CMDS.FACE_DETECTED.cmd);
      this.manager.nsio.emit(SOCKET_CMDS.FACE_DETECTED.cmd, user);
    };
  
    onProcessControl(data){
      const params_room = data.room;
  
      current_cfg = data.cfg;
      current_rating = data.topic;
  
      console.info("+ process-control received: ");
      console.log(current_cfg);
      console.log(current_rating);
  
      this.socket.broadcast.to(params_room).emit(SOCKET_CMDS.PROCESS_CONTROL.cmd);
    };
  
  
    onProcessReady(data){
      // const { roomId, userId, rating, record } = data;
      this.sessionManager.onProcessReady(data);
    }
  
  
    onDataSend(received){
      console.info(`- data-send: ${received}`);
  
      const { dataType, data, userId, roomId } = received;
      var user = this.sessionManager.rooms[roomId].getUser(userId);
      user.data[dataType].ready = true;
      user.data[dataType].content = data;
      
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
      this.socket.broadcast.to(params_room).emit(SOCKET_CMDS.CONTROL.cmd, params_data);
    }
  }
  
module.exports = { User }