const { SOCKET_CMDS, DATA_TYPES, NAMESPACES } = require('../managers/SocketCommands')

class ChatSocket {
    constructor(socket, manager, sessionManager) {
      this.socket = socket;
      this.manager = manager;
      this.sessionManager = sessionManager;
      this.roomId = null;
      // console.log(this.socket)
      this.socket.onAny((eventName, ...args) => {
        console.log(`Received event ${eventName} on a ${this.constructor.name}`)
      });
      this.setupSocket();
    }

    setupSocket(){
      this.socket.on(SOCKET_CMDS.DISCONNECT.cmd, () => this.disconnect());
      this.socket.on(SOCKET_CMDS.MESSAGE.cmd, (message) => this.broadcastMessage(SOCKET_CMDS.MESSAGE.cmd, message));
      this.socket.on(SOCKET_CMDS.FIND_ROOM.cmd, () => this.getRoom());
      this.socket.on(SOCKET_CMDS.LEAVE_ROOM.cmd, () => this.leaveRoom());
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
      console.log("- client left room: " + this.roomId);
      console.log(this.socket.rooms);
      this.sessionManager.onProcessStop("test", true);
    }
  
    joinRoom(room, newRoom=false){
      if(newRoom){
        this.socket.emit(SOCKET_CMDS.CREATE_ROOM.cmd);
        console.log("+ new room created: " + room);
      }
      else{
        this.socket.emit(SOCKET_CMDS.JOIN_ROOM.cmd);
        console.log("- room (" + room + ") exists: try to join.");
      } 
      this.socket.join(room);
      console.log(this.socket.rooms);
    }
  
    leaveRoom(){
      this.broadcastMessage(SOCKET_CMDS.HANGUP.cmd)
      // this.socket.broadcast.to(room).emit("hangup");
      this.socket.leave(this.roomId);
      console.log("- client left room: " + this.roomId);
      console.log(`Sockets in room ${this.roomToString(this.manager.nsio, this.roomId)}`)
      // clearInterval(timmer);
    }

    roomToString(namespace, key){
      let res = ""
      try{
        const socketsInRoomStr = Array.from(namespace.adapter.rooms.get(key)).join(', ');
        res = `${key} = \{ ${socketsInRoomStr} \}`;
      } catch (error) {
        res = `Room ${key} does not exist in namespace`;
      }
      return res;
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
      this.roomId = url[url.length - 2];
      this.roomId = `room_${this.roomId}`
      console.log(`Socket ID: ${this.socket.id} \t Room:${this.roomId}\t URL: ${url}`)
      const sr = this.manager.nsio.adapter.rooms.get(this.roomId);
      if(sr !== undefined){
        console.log(`Sockets in room ${this.roomToString(this.manager.nsio, this.roomId)}`)
      }
      // Double check that the size should be 1 or 2, i would assume we need two clients in a room but it does not seem to be the case
      if (sr === undefined || sr.size < 2) {
        this.joinRoom(this.roomId, (sr === undefined))
      } else {
        // max two clients
        this.socket.emit(SOCKET_CMDS.ROOM_FULL.cmd, this.roomId);
        console.log("- room (" + this.roomId + ") exists but is full");
      }
      // this.printRooms(this.manager.nsio);
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
  
module.exports = { ChatSocket }