const hash = require("object-hash");
const { NamespaceManager } = require('../managers/NamespaceManager')
const { SOCKET_CMDS, DATA_TYPES, NAMESPACES } = require('../managers/SocketCommands')
const { STATUS, Stage } = require('../managers/Stage')
const { Room } = require('../managers/Room')
const { User } = require('../managers/User')
const { ControlUser } = require('./ControlUser')
const { console  } = require("../utils/colouredLogger")
const { TIMES } = require('../managers/TimesDefinitions')

class SessionManager {
  constructor(sio, stagesConfig, masksConfig, questionset) {
    this.sio = sio;
    this.rooms = {}
    this.started = false;
    this.questionset = questionset;
    this.icebreaker = this.questionset["icebreaker"];
    this.wouldyou = this.questionset["wouldyou"];
    this.topics = this.questionset;
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
    this.stagesConfig = stagesConfig;
    this.topic_selected = [];
    this.stages = [];
    // this.chatsManager = new ChatsManager(this.sio, this);
    // this.controlManager = new ControlManager(this.sio, this);
    // this.projectionManager = new ProjectionManager(this.sio, this);
    this.chatsManager = new NamespaceManager(this.sio, "Chat", NAMESPACES.CHAT, this, User);
    this.controlManager = new NamespaceManager(this.sio, "Control", NAMESPACES.CONTROL, this, ControlUser);
    this.projectionManager = new NamespaceManager(this.sio, "Projection", NAMESPACES.PROJECTION, this, null, (socket) => {
        socket.join(SOCKET_CMDS.PROJECTION_TEST);
        socket.on(SOCKET_CMDS.PROJECTION_CONNECT, (data) => {
          const { room, user } = data;
          // socket.join("projection-" + room);
          console.log(    '+ a projection was connected in room: " ' + room + ", user: " + user
          );
        });
      });
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
    }, TIMES.SESSION_UPDATE_INTERVAL)
  }
  

  startSession(room){
    console.info(`Starting session on room ${room.id}`);
    try {
      console.info("+ both ready: start process");
      console.info(room.toString())
      this.startTime = new Date().getTime();
      this.sessionId = this.generateSessionId(this.startTime);

      let mask_id = Math.floor(Math.random() * 3);
      let config = require(`../MaskSetting/endWithEyes.json`);
      let host = room.getUsersByType(User.TYPE.HOST);
      if(host.length > 0){
        if(host.length > 1) console.warn(`Warning: More than one host found! ${host} Selecting the first one: ${host[0]}`);
        host = host[0];
      }
      else{
        console.warn(`Warning: No hosts found!`)
      }
      let guest = room.getUsersByType(User.TYPE.GUEST);
      if(guest.length > 0){
        if(guest.length > 1) console.warn(`Warning: More than one guest found! ${guest} Selecting the first one: ${guest[0]}`);
        guest = guest[0];
      }
      else{
        console.warn(`Warning: No guests found!`)
      }

      // What is this? Why?!
      let rating = "general";
      if (host.rating == guest.rating) {
        rating = host.rating;
      }
      console.info(`- current rating: ${rating}`);
      console.info(`- rating by user: ${room.getUsersRating()}`);

      if(this.timer != null){
        return;
      }
      this.startTime = new Date().getTime();
      this.currentStageIdx = 0;
      if(this.stagesConfig) {
        for(let i = 0; i < this.stagesConfig.length; i++){
          this.stages.push(new Stage(room, this, this.stagesConfig[i], null, i));
        }
      }
      this.currentStage = this.stages[this.currentStageIdx];
      if(this.currentStageIdx <= 0){
        this.currentStage.initalize();
        const stagesData = {name: this.currentStage.name, currentIdx: this.currentStageIdx, total: Object.keys(this.stages).length};
        const duration = this.currentStage.duration;
        const startTime = this.startTime;
        const sessionId = this.sessionId;
        const record_by_user = {
          host: false,
          guest: false,
        };
        this.chatsManager.nsio.emit(SOCKET_CMDS.PROCESS_START, {
          stagesData,
          startTime,
          duration,
          record_by_user,
          sessionId
        });

        this.controlManager.nsio.emit(SOCKET_CMDS.PROCESS_START, {
          stagesData,
          startTime,
          duration,
          record_by_user,
          sessionId
        });
      }
      this.update();

      // processStart(roomId, startTime, config);
      console.info("- resetting ready_user_by_room for next survey (?)");
      // this.resetRoom(roomId);
    } catch (err) {
      console.error(`Ooops! Something went wrong: Please confirm that the admin has started the process`, err);
    }
  }

  generateSessionId(startTime){
    // creating a hash from current timestamp and random number
    return hash(startTime.toString() + Math.floor(Math.random() * 100000) + 1);
  }

  onProcessReady(data){
    const { roomId, userId, rating, record } = data;
    console.info(`+ ${userId} in room ${roomId} is ready to record: `, record);

    var user = this.rooms[roomId].getUser(userId);
    user.ready = true;
    user.rating = rating;
    user.record = record;
    if(this.rooms[roomId].allUsersReady()){
      console.info("- process start, both users are ready");
      this.startSession();
    } else {
      console.info("- not all users ready yet");
    }
  }

  onProcessStop(room, accident_stop){
    console.info("+ Session process stop ");
    if(this.timer != null){
      clearInterval(this.timer);
    }
    this.chatsManager.nsio.emit(SOCKET_CMDS.PROCESS_STOP, { accident_stop });
    this.controlManager.nsio.emit(SOCKET_CMDS.PROCESS_STOP, { accident_stop });
    // this.projectionManager.nsio.emit(SOCKET_CMDS.PROCESS_STOP, { accident_stop });
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
        console.info("+ SUCCESS: all data saved in db: ");
        console.log(res);
      })
      .catch((error) => {
        console.info("- ERROR: could not save data in db");
        console.log(error);
      });
  }
}



module.exports = {  SessionManager }