import hash from "object-hash";
import { CMDS, STAGE, TIMES } from './Definitions.js';
import Stage from '../managers/Stage.js';
import { User } from '../managers/User.js';
import console from "../utils/colouredLogger.js";
import SessionConfig from '../../assets/SessionConfig.js';
import {Timer} from "./Timer.js";

class ServerSession extends Timer {
  constructor(room=null) {
      super(TIMES.SESSION_UPDATE_INTERVAL);
      this.room = room;
      this.currentStage = null;
      this.currentStageIdx = -1;
      this.config = SessionConfig;
      this.availableConditions = structuredClone(this.config.available_conditions);
      this.stagesConfig = this.config.stages;
      this.question_selected = [];
      this.stages = [];
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

  // This will take care of starting the next (or first) stage, notifying of a new session update at the end of each stage
  // And advancing until the end of all the stages
  onTick(){
    if(this.currentStage == null || this.currentStage.status == STAGE.STATUS.COMPLETED){
      this.currentStageIdx += 1;
      if(this.currentStageIdx >= this.stages.length){
        console.log("ALL STAGES COMPLETED");
        this.complete();
        return;
      }
      this.currentStage = this.stages[this.currentStageIdx];
      this.currentStage.initialize();

      const sessionData = this.getData();
      this.room.notifyRoom(CMDS.SOCKET.SESSION_UPDATE, sessionData);
    }
    this.currentStage.update();
  }

  getData(){
    var data = {};
    try{
      data = {
        sessionId: this.id,
        room: this.room.getData(),
        startTime: this.startTick.time,
        startDateTime: this.startTick.date.getTime(),
        stages: this.stages.length,
        stage: this.currentStage?.getData()
      };
    }catch(error){
      console.error(`Error getting session data: `, error);
    }
    return data;
  }
  

  onStart(){
    console.info(`Starting session on room ${this.room.id}`);
    try {
      console.info("+ both ready: start process");
      this.room.printDebug();
      this.id = this.generateSessionId(this.startTick.date.getTime());
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

      if(this.stagesConfig) {
        for(let i = 0; i < this.stagesConfig.length; i++){
          this.stages.push(new Stage(this.room, this, this.stagesConfig[i], null, i));
        }
      }
    } catch (err) {
      console.error(`Ooops! Something went wrong in starting the session!`, err);
    }
  }

  generateSessionId(startTime){
    // creating a hash from current timestamp and random number
    return hash(startTime.toString() + Math.floor(Math.random() * 100000) + 1);
  }
}



export default ServerSession;