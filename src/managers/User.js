const { CMDS, DATA, TIMES } = require('./Definitions')
const { console  } = require("../utils/colouredLogger");
const fs = require('fs');


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
      this.id = this.socket.id; // Just for the purpose of this project
      this.name = null;
      this.joined = false;
      this.ready = true;
      this.rating = null;
      this.record = null;
      this.data = {};
      for (const dType in DATA.TYPE) {
        this.data[dType] = {
          ready: false,
          content: null
        }
      }
      this.socket.onAny((eventName, ...args) => {
        if(eventName != CMDS.SOCKET.FACE_DETECTED){
          console.debug(`Received event ${eventName} on a ${this.constructor.name} ${this.id}`)
        }
      });
      this.setupCommonCallbacks();
      this.setupCallbacks();
    }

    get [Symbol.toStringTag]() {
      return `User ${this.type}, (socket) id: ${this.id} , nsp: ${this.socket?.nsp?.name}) in room '${this.room?.id}`;
    }

    setupCommonCallbacks(){
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

    setupCallbacks(){
      this.socket.on(CMDS.SOCKET.RTC_COMMUNICATION, (data) => {
        switch(data.bridge){
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
            this.broadcastMessage(CMDS.SOCKET.RTC_COMMUNICATION,  {bridge: CMDS.RTC.ACTIONS.MESSAGE, ...data.data})
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
      })
      this.socket.on(CMDS.SOCKET.MESSAGE, (message) => this.broadcastMessage(CMDS.SOCKET.MESSAGE, message));
      this.socket.on(CMDS.SOCKET.JOIN_ROOM, (userData) => this.joinCreateRoom(userData));
      this.socket.on(CMDS.SOCKET.LEAVE_ROOM, () => this.leaveRoom());
      this.socket.on(CMDS.SOCKET.CONTROL_ROOM, (data) => this.controlRoom(data));
      this.socket.on(CMDS.SOCKET.ROOM_IDLE, (data) => this.roomInIdle(data));
      this.socket.on(CMDS.SOCKET.STAGE_COMPLETED, (data) => this.onUserStageCompleted(data));
    }

    // sending to all clients in the room (channel) except sender
    broadcastMessage(cmd, message=null){
      const dbg_msg = message?.type ? `Type: ${message?.type}` : `${message}`
      console.log(`Broadcasting ${cmd} to ${this.room?.id}: ${dbg_msg}`);
      if(this.room !== null){
        if(message == null){
          this.socket.broadcast.to(this.room.id).emit(cmd)
        }else{
          this.socket.broadcast.to(this.room.id).emit(cmd, message)
        }
      }
    }
  
    handleAuth(data){
      if(this.type == User.TYPE.HOST){
        data.sid = this.socket.id;
        this.broadcastMessage(CMDS.SOCKET.RTC_COMMUNICATION, {bridge: CMDS.RTC.ACTIONS.HOST_APPROVAL_REQUEST, data: data});
        // console.info("- authenticate client in room " + this.room);
      }
    }
  
    sendRequestAnswer(userId, accepted){
      if(this.room != null){
        var feedback = accepted ? CMDS.RTC.STATUS.ACCEPTED : CMDS.RTC.STATUS.REJECTED;
        console.info(`- Host ${feedback} user ${userId} in room ${this.room?.id}`);
        var user = this.room.getUserById(userId);
        if(accepted){
          user.socket.join(this.room.id);
          this.sessionManager.startSession(this.manager.rooms[this.room.id]);
        }
        this.manager.nsio.emit(CMDS.SOCKET.RTC_COMMUNICATION, {bridge: feedback, user: user.id, userType: user.type});
      }
    }


    connectError(err){
      console.log(`connect_error on ${this} due to ${err.message}`);
    }
  
    disconnect(){
      console.info(`- client ${this} disconnected`);
      // console.log(this.socket.rooms);
      this.leaveRoom(this);
      this.broadcastMessage(CMDS.SOCKET.RTC_COMMUNICATION, {bridge: CMDS.RTC.ACTIONS.HANGUP})
      // this.socket.broadcast.to(room).emit("hangup");
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
          console.warn(`Cannot remove user ${this.id} from room ${this.room?.id}: Room does not exist`)
          return false;
        }
        const removed = this.room.removeUser(this);

        if(!removed){
            console.warn(`Cannot remove user ${this.id} from room ${this.room?.id}: User not in room`)
            return false;
        }

        if(this.room.size <= 0){
          this.manager.deleteRoom(this.room.id);
        }
        this.room = null;
      }catch(error){
        console.warn(`Error removing user ${this.id} from room ${this.room?.id}`, error)
      }
      console.info(`- client ${this} left the room ${this.room?.id}`);
    }

    notifyClient(error=null){
      const data = {
        user: {
          room: this.room?.id,
          role: this.type,
          name: this.name,
          id: this.id
        }
      };
      if(error != null){
        data.error = error;
      }
      this.socket.emit(CMDS.SOCKET.ROOM_UPDATE, data);
    }

    onUserStageCompleted(data){
      console.log("User completed stage");
      if(data != null && data != undefined){
        console.log("User completion data: ", data);
        fs.writeFileSync("./uploads/"+  data.filename, JSON.stringify(data.data, null, 3));
      }
      this.ready = true;
      if(this.room){
        this.sessionManager.onUserStageCompleted(this.room);
      }
    }
  
    joinCreateRoom(userData){
      console.log("Received Join/Create Room Request");
      if(userData.name != null && userData.name != undefined){
        this.name = userData.name;
      }
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
      const joinFeedback = userRoom.addUser(this);
      console.warn(`Adding [${this.type}] ${this.id} to room ${roomId}: ${joinFeedback.code} = '${joinFeedback.msg}`);
      userRoom.printDebug(); 
      this.notifyClient(joinFeedback.code <= 0 ? joinFeedback : null);

      if(joinFeedback.code > 0){
        if(userRoom.size > 1){
          this.socket.to(this.room.id).emit(CMDS.SOCKET.RTC_COMMUNICATION, {bridge: CMDS.RTC.ACTIONS.JOIN_REQUEST, msg: `User ${this} is requesting to join the call`}); // Broadcast to room this.room.id except for the sender
          this.socket.emit(CMDS.SOCKET.RTC_COMMUNICATION, {bridge: CMDS.RTC.STATUS.PENDING_APPROVAL, msg: `Waiting for host to approve request`});
          userRoom.host.socket.emit(CMDS.SOCKET.RTC_COMMUNICATION, {bridge: CMDS.RTC.ACTIONS.HOST_APPROVAL_REQUEST, userId: this.id, userName: this.name});
        }
        else{
          this.socket.emit(CMDS.SOCKET.RTC_COMMUNICATION, {bridge: CMDS.RTC.ACTIONS.START_CALL}); // Broadcast to room this.room.id except for the sender
        }
      }
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
      this.sessionManager.controlManager.nsio.emit(CMDS.SOCKET.ROOM_IDLE);
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
      this.socket.broadcast.to(params_room).emit(CMDS.SOCKET.SURVEY_START);
      this.socket.broadcast.to("survey-" + params_room).emit(CMDS.SOCKET.SURVEY_START);
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
        this.manager.nsio.emit(CMDS.SOCKET.SURVEY_END, { stage_startTime, duration, stage });
        projectio.emit(CMDS.SOCKET.STAGE_CONTROL, { stage });
      }
    };
  
    reset(data){
      if(this.room != null){
        const { room } = data;
        console.info("- resetting room: " + this.room);
        this.manager.onProcessStop(room, `${this} RESET`);
      }
    };
  
    onFaceDetected(data){
      const { room, user } = data;
      // console.info("- face-detected received in room: " + room + ", user: " + user);
  
      // this.manager.nsio.emit(CMDS.SOCKET.FACE_DETECTED);
      this.manager.nsio.emit(CMDS.SOCKET.FACE_DETECTED, user);
    };
  
    onProcessControl(data){
      const params_room = data.room;
  
      current_cfg = data.cfg;
      current_rating = data.topic;
  
      console.info("+ process-control received: ");
      console.log(current_cfg);
      console.log(current_rating);
  
      this.socket.broadcast.to(params_room).emit(CMDS.SOCKET.PROCESS_CONTROL);
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
      }, TIMES.DATA_UPLOAD_WAIT);
    };
  
    onControl(data){
      console.info("- control");
      console.log(data);
  
      const params_room = data.room;
      const params_data = data.data;
      this.socket.broadcast.to(params_room).emit(CMDS.SOCKET.CONTROL, params_data);
    }
  }
  
module.exports = { User }