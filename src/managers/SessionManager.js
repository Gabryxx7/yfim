const hash = require("object-hash");
const { NamespaceManager } = require('../managers/NamespaceManager')
const { CMDS, STAGE, TIMES } = require('./Definitions')
const { Stage } = require('../managers/Stage')
const { Room } = require('../managers/Room')
const { User } = require('../managers/User')
const { ControlUser } = require('./ControlUser')
const { console  } = require("../utils/colouredLogger")
const { SessionConfig } = require('../../assets/SessionConfig')
const { Topics } = require('../../assets/Topics')

class SessionManager {
  constructor(sio) {
    this.sio = sio;
    this.rooms = {}
    this.started = false;
    this.current_rating = "mature"
    this.timer = null;
    this.startDateTime = -1;
    this.startTime = 0;
    this.elapsed = 0;
    this.currentStage = null;
    this.currentStageIdx = -1;
    this.stagesConfig = SessionConfig;
    this.question_selected = [];
    this.stages = [];
    // this.chatsManager = new ChatsManager(this.sio, this);
    // this.controlManager = new ControlManager(this.sio, this);
    // this.projectionManager = new ProjectionManager(this.sio, this);
    this.chatsManager = new NamespaceManager(this.sio, "Chat", CMDS.NAMESPACES.CHAT, this, User);
    this.controlManager = new NamespaceManager(this.sio, "Control", CMDS.NAMESPACES.CONTROL, this, ControlUser);
    this.projectionManager = new NamespaceManager(this.sio, "Projection", CMDS.NAMESPACES.PROJECTION, this, null, (socket) => {
        socket.join(CMDS.SOCKET.PROJECTION_TEST);
        socket.on(CMDS.SOCKET.PROJECTION_CONNECT, (data) => {
          const { room, user } = data;
          // socket.join("projection-" + room);
          console.log(    '+ a projection was connected in room: " ' + room + ", user: " + user
          );
        });
      });
  }

  onUserStepCompleted(room){
    const allUsersReady = room.allUsersReady();
    console.log("All users ready in room " + room.id);
    if(allUsersReady){
      this.currentStage.moveToNextStep();
    }
  }


  update(){
    let nowTime = new Date().getTime();
    this.elapsed = (nowTime - this.startDateTime)/1000;
    if(this.currentStage == null || this.currentStage.status == STAGE.STATUS.COMPLETED){
      this.currentStageIdx += 1;
      if(this.currentStageIdx >= this.stages.length){
        console.log("ALL STAGES COMPLETED");
        this.timer = null;
        return;
      }
      this.currentStage = this.stages[this.currentStageIdx];
      this.currentStage.initialize();

      const sessionData = this.getData();
      this.chatsManager.nsio.emit(CMDS.SOCKET.SESSION_UPDATE, sessionData)
      this.controlManager.nsio.emit(CMDS.SOCKET.SESSION_UPDATE, sessionData)
    }
    this.currentStage.update();
    this.timer = setTimeout(() => {
      this.update();
    }, TIMES.SESSION_UPDATE_INTERVAL)
  }


  getData(){
    var data = {};
    try{
      data = {
        sessionId: this.id,
        startTime: this.startTime,
        startDateTime: this.startDateTime,
        stages: this.stages.length,
        stage: this.currentStage?.getData()
      };
    }catch(error){
      console.error(`Error getting session data: `, error);
    }
    return data;
  }
  

  startSession(room){
    console.info(`Starting session on room ${room.id}`);
    try {
      console.info("+ both ready: start process");
      room.printDebug();
      this.startDateTime = new Date().getTime();
      this.id = this.generateSessionId(this.startDateTime);

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
      this.startDateTime = new Date().getTime();
      this.startTime = performance.now();
      if(this.stagesConfig) {
        for(let i = 0; i < this.stagesConfig.length; i++){
          this.stages.push(new Stage(room, this, this.stagesConfig[i], null, i));
        }
      }
      // This will take care of starting the next (or first) stage, notifying of a new session update at the end of each stage
      // And advancing until the end of all the stages
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
    this.chatsManager.nsio.emit(CMDS.SOCKET.PROCESS_STOP, { accident_stop });
    this.controlManager.nsio.emit(CMDS.SOCKET.PROCESS_STOP, { accident_stop });
    // this.projectionManager.nsio.emit(CMDS.SOCKET.PROCESS_STOP, { accident_stop });
  }

  async storeData(room) {
    const results = {
      guest: question_data["guest"],
      host: question_data["host"],
    };
    let phase_result = [];
    for (let i = 0; i < 3; i++) {
      const data = {
        topic: question_selected[i],
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
    question_selected = [];
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