const { NamespaceManager } = require('../managers/NamespaceManager')
const { SOCKET_CMDS, DATA_TYPES, NAMESPACES } = require('../managers/SocketCommands')
const { STATUS, Stage } = require('../managers/Stage')
const { Room } = require('../managers/Room')
const { User } = require('../managers/User')
const { ChatSocket } = require('./ChatSocket')
const { ControlSocket } = require('./ControlSocket')

class SessionManager {
  constructor(sio, stagesConfig, masksConfig, questionset) {
    this.sio = sio;
    this.rooms = {}
    this.started = false;
    this.questionset = questionset;
    this.icebreaker = this.questionset["icebreaker"];
    this.wouldyou = this.questionset["wouldyou"];
    this.current_rating = "mature"
    this.quest = [
      ...this.questionset["quest"][this.current_rating],
      ...this.questionset["quest"]["general"],
    ];
    this.timer = null;
    this.startTime = -1;
    this.elapsed = 0;
    this.currentStage = null;
    this.currentStageIdx = -1;
    this.masksConfig = masksConfig;
    this.topic_selected = [];
    this.stages = [];
    if(stagesConfig) {
      for(let i = 0; i < stagesConfig.length; i++){
        this.stages.push(new Stage(this, stagesConfig[i], null, i));
      }
    }
    // this.chatsManager = new ChatsManager(this.sio, this);
    // this.controlManager = new ControlManager(this.sio, this);
    // this.projectionManager = new ProjectionManager(this.sio, this);
    this.chatsManager = new NamespaceManager(this.sio, "Chat", NAMESPACES.CHAT, this, ChatSocket);
    this.controlManager = new NamespaceManager(this.sio, "Control", NAMESPACES.CONTROL, this, ControlSocket);
    this.projectionManager = new NamespaceManager(this.sio, "Projection", NAMESPACES.PROJECTION, this, null, (socket) => {
        socket.join(SOCKET_CMDS.PROJECTION_TEST.cmd);
        socket.on(SOCKET_CMDS.PROJECTION_CONNECT.cmd, (data) => {
          const { room, user } = data;
          // socket.join("projection-" + room);
          console.log(    '+ a projection was connected in room: " ' + room + ", user: " + user
          );
        });
      });
  }

  addRoom(id, socket, roomType){
    this.rooms[id] = new Room(id, socket, roomType);
    this.resetRoom(id);
  }

  resetRoom(id){
    this.rooms[id].addUser(User.TYPE.HOST);
    this.rooms[id].addUser(User.TYPE.GUEST);
  }

  getRoom(id){
    return this.rooms[id];
  }

  update(){
    let nowTime = new Date().getTime();
    this.elapsed = (nowTime - this.startTime)/1000;
    this.currentStage.update();
    if(this.currentStage.status == STATUS.COMPLETED){
      this.currentStageIdx += 1;
      if(this.currentStageIdx >= this.stages.length){
        console.log("ALL STAGES COMPLETED");
        this.timer = null;
        return;
      }
      this.currentStage = this.stages[this.currentStageIdx];
      this.currentStage.initalize()
    }
    this.timer = setTimeout(() => {
      this.update();
    }, 1000)
  }
  

  startSession(){
    if(this.timer != null){
      return;
    }
    this.startTime = new Date().getTime();
    this.currentStageIdx = 0;
    this.currentStage = this.stages[this.currentStageIdx];
    this.currentStage.initalize();
    this.update();
  }

  generateSessionId(startTime){
    // creating a hash from current timestamp and random number
    return hash(startTime.toString() + Math.floor(Math.random() * 100000) + 1);
  }

  onProcessReady(data){
    const { roomId, userId, rating, record } = data;
    // this.socket.broadcast.to(room).emit(SOCKET_CMDS.PROCESS_START.cmd);
    console.log(`+ ${userId} in room ${roomId} is ready to record: `, record);

    var user = this.manager.rooms[roomId].getUser(userId);
    user.ready = true;
    user.rating = rating;
    user.record = record;
    if(this.manager.rooms[roomId].allUsersReady()){
      console.log("- process start, both users are ready");
      try {
        console.log("+ both ready: start process");
        this.startTime = new Date().getTime();
        this.sessionId = this.generateSessionId(this.startTime);

        let mask_id = Math.floor(Math.random() * 3);
        let config = require(`./assets/MaskSetting/${mask_set[mask_id]}.json`);
        let host = this.manager.rooms[roomId].getUser(User.TYPE.HOST);
        let guest = this.manager.rooms[roomId].getUser(User.TYPE.GUEST);
        let rating = "general";
        if (host.rating == guest.rating) {
          rating = host.rating;
        }
        console.log(`- current rating: ${rating}`);
        console.log(`- rating by user: ${this.manager.rooms[roomId].getUsersRating()}`);

        this.startSession();
        // processStart(roomId, startTime, config);

        const { duration } = config["setting"][0];
        this.chatsManager.namespaceIo.emit(SOCKET_CMDS.PROCESS_START.cmd, {
          startTime,
          duration,
          record_by_user,
          sessionId,
        });

        this.controlManager.namespaceIo.emit(SOCKET_CMDS.PROCESS_START.cmd);

        console.log("- resetting ready_user_by_room for next survey (?)");
        this.resetRoom(roomId);
      } catch (err) {
        console.log(`Ooops! Something went wrong: Please confirm that the admin has started the process\n${err}`);
      }

      // this.socket.broadcast.to(room).emit(SOCKET_CMDS.PROCESS_START.cmd);
      // this.socket.emit(SOCKET_CMDS.PROCESS_START.cmd);
    } else {
      console.log("- not all users ready yet");
    }
  }

  onProcessStop(room, accident_stop){
    console.log("+ process stop ");
    if(this.timer != null){
      clearInterval(this.timer);
    }
    this.chatsManager.nsio.emit("process-stop", { accident_stop });
    this.controlManager.nsio.emit("process-stop", { accident_stop });
    // this.projectionManager.nsio.emit("process-stop", { accident_stop });
  }

  async storeData(room) {
    const results = {
      guest: question_data["guest"],
      host: question_data["host"],
    };
    let phase_result = [];
    for (let i = 0; i < 3; i++) {
      const data = {
        topic: topic_selected[i],
        mask_setting: current_cfg["setting"][i + 1],
        host: {
          survey: question_data["host"][i],
          emotions: emotion_data["host"][i],
        },
        guest: {
          survey: question_data["guest"][i],
          emotions: emotion_data["guest"][i],
        },
      };
      phase_result.push(data);
    }

    const audio = {
      host: record_by_user["host"] ? startTime.toString() + "_host.webm" : "none",
      guest: record_by_user["guest"]
        ? startTime.toString() + "_guest.webm"
        : "none",
    };

    // const video = {
    //   host: record_by_user["host"]
    //     ? startTime.toString() + "_host_video.webm"
    //     : "none",
    //   guest: record_by_user["guest"]
    //     ? startTime.toString() + "_guest_host_video.webm"
    //     : "none",
    // };
    const data = {
      _id: startTime.toString(),
      start_time_stamp: sessionId,
      start_time: startTime,
      phase_01: phase_result[0],
      phase_02: phase_result[1],
      phase_03: phase_result[2],
      audio: audio,
    };
    topic_selected = [];
    emotion_ready = { host: false, guest: false };
    question_ready = { host: false, guest: false };
    emotion_data = {
      host: {},
      guest: {},
    };
    question_data = {
      host: {},
      guest: {},
    };
    record_by_user = {
      host: false,
      guest: false,
    };
    console.log(data);
    chatio.emit("upload-finish", results);
    const response = await couch
      .insert(data)
      .then((res) => {
        console.log("+ SUCCESS: all data saved in db: ");
        console.log(res);
      })
      .catch((error) => {
        console.log("- ERROR: could not save data in db");
        console.log(error);
      });
  }
}



module.exports = {  SessionManager }