import hash from "object-hash";
import { CMDS, STAGE, TIMES } from './Definitions.js';
import Stage from '../managers/Stage.js';
import { User } from '../managers/User.js';
import console from "../utils/colouredLogger.js";
import SessionConfig from '../../assets/SessionConfig.js';

class ServerSession {
  static STATUS = {
    NONE: "None",
    RUNNING: "Running",
    PAUSED: "Paused",
    STOPPED: "Stopped",
    COMPLETED: "Completed",
    ERROR: "Error"
  }
  constructor(room=null) {
      this.status = ServerSession.STATUS.NONE;
      this.room = room;
      this.timer = null;
      this.startDateTime = -1;
      this.startTime = 0;
      this.elapsed = 0;
      this.currentStage = null;
      this.currentStageIdx = -1;
      this.config = SessionConfig;
      this.availableConditions = structuredClone(this.config.available_conditions);
      this.stagesConfig = this.config.stages;
      this.question_selected = [];
      this.stages = [];
  }

  isRunning(){
    return this.status == ServerSession.STATUS.RUNNING;
  }

  updateSessionStatus(){
    if (this.room.allUsersReady()) {
      if(this.isRunning()){
        console.log(`All users ready in room ${this.room.id}, completing STEP in session`);
        this.currentStage.moveToNextStep();
      }
      else{
        console.log(`All users ready in room ${this.room.id}, STARTING session`);
        this.start();
      }
    }
    console.log(`NOT all users are ready in room ${this.room.id},`);
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
      this.room.notifyRoom(CMDS.SOCKET.SESSION_UPDATE, sessionData);
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
        room: this.room.getData(),
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
  

  start(){
    console.info(`Starting session on room ${this.room.id}`);
    try {
      console.info("+ both ready: start process");
      this.room.printDebug();
      this.startDateTime = new Date().getTime();
      this.id = this.generateSessionId(this.startDateTime);

      // let mask_id = Math.floor(Math.random() * 3);
      // let config = require(`../MaskSetting/endWithEyes.json`);
      let host = this.room.getUsersByType(User.TYPE.HOST);
      if(host.length > 0){
        if(host.length > 1) console.warn(`Warning: More than one host found! ${host} Selecting the first one: ${host[0]}`);
        host = host[0];
      }
      else{
        console.warn(`Warning: No hosts found!`)
      }
      let guest = this.room.getUsersByType(User.TYPE.GUEST);
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
      console.info(`- rating by user: ${this.room.getUsersRating()}`);

      if(this.timer != null){
        return;
      }
      this.startDateTime = new Date().getTime();
      this.startTime = performance.now();
      if(this.stagesConfig) {
        for(let i = 0; i < this.stagesConfig.length; i++){
          this.stages.push(new Stage(this.room, this, this.stagesConfig[i], null, i));
        }
      }
      this.status = ServerSession.STATUS.RUNNING;
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


  onProcessStop(room, accident_stop){
   if(!this.isRunning()) return;
   this.status = ServerSession.STATUS.STOPPED;
   console.info("+ Session process stop ");
   if(this.timer != null){
     clearInterval(this.timer);
   }

   this.room.notifyRoom(CMDS.SOCKET.PROCESS_STOP, { accident_stop });
 }
}



export default ServerSession;