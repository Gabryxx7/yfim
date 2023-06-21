const { SOCKET_CMDS, DATA_TYPES, NAMESPACES } = require('../managers/SocketCommands')

class ChatSocket {
  constructor(socket, manager, sessionManager) {
    this.socket = socket;
    this.manager = manager;
    this.sessionManager = sessionManager;
    this.roomId = null;
    this.setupSocket()
  }
  setupSocket(){
    this.socket.on(SOCKET_CMDS.DISCONNECT.cmd, () => this.disconnect());
    this.socket.on(SOCKET_CMDS.MESSAGE.cmd, (message) => this.broadcastMessage(SOCKET_CMDS.MESSAGE.cmd, message));
    this.socket.on(SOCKET_CMDS.FIND_ROOM.cmd, () => this.leaveRoom());
    this.socket.on(SOCKET_CMDS.LEAVE_ROOM.cmd, (id) => this.reject(id));
    this.socket.on(SOCKET_CMDS.AUTH.cmd, (data) => this.auth(data));
    this.socket.on(SOCKET_CMDS.ACCEPT.cmd, (id) => this.accept(id));
    this.socket.on(SOCKET_CMDS.REJECT.cmd, (id) => this.reject(id));
    this.socket.on(SOCKET_CMDS.CONTROL_ROOM.cmd, (data) => this.controlRoom(data));
    this.socket.on(SOCKET_CMDS.ROOM_IDLE.cmd, (data) => this.roomIdle(data));
    this.socket.on(SOCKET_CMDS.SURVEY_CONNECT.cmd, (data) => this.surveyConnect(data));
    this.socket.on(SOCKET_CMDS.DATA_CONNECT.cmd, () => this.dataConnect());
    this.socket.on(SOCKET_CMDS.SURVEY_START.cmd, (data) => this.surveyStart(data));
    this.socket.on(SOCKET_CMDS.SURVEY_END.cmd, (data) => this.surveyEnd(data));
    this.socket.on(SOCKET_CMDS.RESET.cmd, (data) => this.reset(data));
    this.socket.on(SOCKET_CMDS.FACE_DETECTED.cmd, (data) => this.onFaceDetected(data));
    this.socket.on(SOCKET_CMDS.PROCESS_CONTROL.cmd, (data) => this.onProcessControl(data));
    this.socket.on(SOCKET_CMDS.PROCESS_READY.cmd, (data) => this.onProcessReady(data));
    this.socket.on(SOCKET_CMDS.DATA_SEND.cmd, (data_get) => this.onDataSend(data_get));
    this.socket.on(SOCKET_CMDS.CONTROL.cmd, (data) => this.onControl(data));
  }

  // sending to all clients in the room (channel) except sender
  broadcastMessage(cmd, message=null){
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
    console.log("- authenticate client in room " + this.roomId);
  }

  accept(id){
    // io.sockets.connected[id].join(room);
    // sending to all clients in 'game' room(channel), include sender
    this.chatio.emit(SOCKET_CMDS.BRIDGE.cmd);
    console.log("- accept client in room " + this.roomId);
  }

  reject(id){
    this.socket.emit(SOCKET_CMDS.ROOM_FULL.cmd);
    console.log("- rejected");
  }

  disconnect(){
    console.log("- client left room: ");
    console.log(this.socket.rooms);
    this.sessionManager.onProcessStop("test", true);
  }

  createRoom(room){
    this.socket.join(room);
    this.socket.emit(SOCKET_CMDS.CREATE_ROOM.cmd);
    console.log("+ new room created: " + this.roomId);
  }

  joinRoom(room){
    this.socket.emit(SOCKET_CMDS.JOIN_ROOM.cmd);
    console.log("- room (" + this.roomId + ") exists: try to join.");
    this.socket.join(room);
  }

  leaveRoom(room){
    this.broadcastMessage(SOCKET_CMDS.HANGUP.cmd)
    // this.socket.broadcast.to(room).emit("hangup");
    this.socket.leave(this.roomId);
    console.log("- client left room: " + this.roomId);
    // clearInterval(timmer);
  }

  getRoom(){
    this.started = true;
    const url = this.socket.request.headers.referer.split("/");
    this.roomId = url[url.length - 2];

    const sr = this.manager.findRoom(room);
    if (sr === undefined) {
      this.createRoom(this.roomId)
    } else if (sr.length === 1) {
      this.joinRoom(this.roomId)
    } else {
      // max two clients
      this.socket.emit(SOCKET_CMDS.ROOM_FULL.cmd, this.roomId);
      console.log("- room (" + this.roomId + ") exists but is full");
    }
  }

  controlRoom(data){
    const room = data.room;
    console.log("- received control-room message for room: " + room);
    this.sessionManager.addRoom(room, this.socket, Room.TYPE.CONTROL)
    // control_room_list[room] = this.socket;
  }


  roomIdle(data){
    const { room } = data;
    // console.log(`room ${room} is idle now`);
    controlio.emit(SOCKET_CMDS.ROOM_IDLE.cmd);
    console.log("- room idle: " + this.roomId + " -> initiate process stop");
    this.sessionManager.onProcessStop(room, true);
  }

  surveyConnect(data){
    const { room, user } = data;
    this.socket.join("survey-" + this.roomId);
    // survey_socket[user] = socket;
    console.log("+ a survey was connected in room: " + this.roomId + ", user: " + user);
  }

  dataConnect(){
    db.view("search", "all", function (err, data) {
      const len = data.rows.length;
      console.log("- on data-connect()");
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
    console.log('+ send survey and room control in room: " ' + this.roomId);
  };

  surveyEnd(data){
    const { room, user } = data;
    console.log('- survey was ended in room: " ' + this.roomId + ", user: " + user);
    survey_ready[user] = true;
    console.log("- Who`s ready? Guest: " +
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
      this.sessionManager.namespaceIo.emit(SOCKET_CMDS.SURVEY_END.cmd, { stage_startTime, duration, stage });
      projectio.emit(SOCKET_CMDS.STAGE_CONTROL.cmd, { stage });
    }
  };

  reset(data){
    const { room } = data;
    console.log("- resetting room: " + this.roomId);
    this.sessionManager.onProcessStop(room, true);
  };

  onFaceDetected(data){
    const { room, user } = data;
    console.log("- face-detected received in room: " + this.roomId + ", user: " + user);

    controlio.emit(SOCKET_CMDS.FACE_DETECTED.cmd);
    this.sessionManager.namespaceIo.emit(SOCKET_CMDS.FACE_DETECTED.cmd, user);
  };

  onProcessControl(data){
    const params_room = data.room;

    current_cfg = data.cfg;
    current_rating = data.topic;

    console.log("+ process-control received: ");
    console.log(current_cfg);
    console.log(current_rating);

    this.socket.broadcast.to(params_room).emit(SOCKET_CMDS.PROCESS_CONTROL.cmd);
  };


  onProcessReady(data){
    // const { roomId, userId, rating, record } = data;
    this.sessionManager.onProcessReady(data);
  }


  onDataSend(received){
    console.log(`- data-send: ${received}`);

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
        console.log("- call store data");
        storeData(room);
      }
    }, 5000);
  };

  onControl(data){
    console.log("- control");
    console.log(data);

    const params_room = data.room;
    const params_data = data.data;
    this.socket.broadcast.to(params_room).emit(SOCKET_CMDS.CONTROL.cmd, params_data);
  }
}

class ChatsManager {
  NAMESPACE = NAMESPACES.chat;
  constructor(sio, sessionManager) {
    this.sio = sio;
    this.sessionManager = sessionManager;
    this.started = false;
    this.namespace = NAMESPACES.chat;
    this.connections = []
    this.nsio = this.sio.of(this.namespace);
    this.nsio.on("connection", (socket) => this.newChatSocket(socket))
    this.rooms = null;
    this.roomId = null;
    console.log(`Creating Chat manager with Chat Namespace ${this.namespace}`);
  }

  newChatSocket(socket){
    console.log(`+ New connection to Chat Namespace ${this.namespace}`);
    this.connections.push(new ChatSocket(socket, this, this.sessionManager));
  }

  findRoom(room){
    console.log(" - trying to locate room: " + this.roomId);
    return this.nsio.adapter.rooms[room];
  }

  connect(){
    return;
  }

}


module.exports = { ChatsManager, ChatSocket }