import hash from "object-hash";
import { CMDS, STAGE, TIMES } from './Definitions.js';
import Stage from '../backend/Stage.js';
import { User } from '../backend/User.js';
import console from "../utils/colouredLogger.js";
import SessionConfig from '../../assets/SessionConfig.js';
import {TimedEvent} from "./TimedEvent.js";
const randomInRange = (min, max) => Math.floor(Math.random() * (max - min)) + min;

class ServerSession extends TimedEvent {
  constructor(room=null) {
      super(TIMES.SESSION_UPDATE_INTERVAL);
      this.room = room;
      this.currentStage = null;
      this.currentStageIdx = -1;
      this.config = SessionConfig;
      this.conditions = {remaining: structuredClone(this.config.featuresCombinations), completed: [], current: null, isRandomized: false};
      this.stagesConfig = this.config.stages;
      this.question_selected = [];
      this.stages = [];
  }

  updateSessionStatus(){
    const usersStatus = this.room.getUsersStatus();
    if (usersStatus.missing.length <= 0) {
      if(this.isRunning()){
        console.room(`All users ready in room ${this.room.id}, completing STEP in session`);
        this.currentStage.moveToNextStep();
      }
      else{
        console.room(`All users ready in room ${this.room.id}, STARTING session`);
        this.start();
      }
      return;
    }
    console.room(`NOT all users are ready in room ${this.room.id}. NOT ready: ${usersStatus.missing}, ready: ${usersStatus.ready}`);
  }

  // This will take care of starting the next (or first) stage, notifying of a new session update at the end of each stage
  // And advancing until the end of all the stages
  onTick(){
    if(this.currentStage == null || this.currentStage.status == STAGE.STATUS.COMPLETED){
      this.currentStageIdx += 1;
      if(this.currentStageIdx >= this.stages.length){
        this.complete();
        return;
      }
      this.currentStage = this.stages[this.currentStageIdx];
      this.currentStage.initialize();
      this.notifyRoom("Starting next step");
    }
    this.currentStage.update();
  }

  notifyRoom(trigger=""){
    const sessionData = this.getData(trigger);
    // console.log(`Notifying room (${trigger}): `, sessionData)
    this.room.notifyRoom(CMDS.SOCKET.SESSION_UPDATE, sessionData);
  }

  randomizeConditions(){
    let conditions = this.conditions.remaining;
    console.log(`Un-randomized conditions ${conditions.length}`, conditions);
    let randomized = [];
    let totalConditions = conditions.length;
    while(!(randomized.length >= totalConditions && conditions.length <= 0)){
      try{
        let conditionIdx = randomInRange(0, conditions.length);
        let newCondition = conditions[conditionIdx];
        if(this.config.options.noRepetitions){
          newCondition = conditions.splice(conditionIdx, 1)[0];
        }
        randomized.push(newCondition);
      } catch(error){
        console.warn("error getting randomized condition", error);
      }
    }
    this.conditions.remaining = randomized;
    this.conditions['isRandomized'] = true;
    console.log(`Randomized conditions ${this.conditions.remaining.length}`, this.conditions.remaining);
  }

  getNextCondition(){
    if(this.config.options.randomized && !this.conditions.isRandomized){
      this.randomizeConditions();
    }
    let newCondition = this.conditions.remaining.shift();
    if(this.conditions.current){
      this.conditions.completed.push(this.conditions.current);
    }
    this.conditions.current = newCondition;
    
    console.log(`New Condition`, newCondition);
    console.log(`Remaining conditions`, this.conditions.remaining);
    return newCondition;
  }

  getData(trigger=""){
    var data = {};
    try{
      data = {
        trigger: trigger,
        sessionId: this.id,
        status: this.status,
        startTime: this.startTick.time,
        pausedTime: this.pausedTime,
        elapsed: this.elapsed,
        startDateTime: this.startTick.date.getTime(),
        stages: this.stages.length,
        stage: this.currentStage?.getData(trigger),
        room: this.room?.id,
        conditions: this.conditions
      };
    }catch(error){
      console.error(`Error getting session data: `, error);
    }
    return data;
  }

  // onPause(){
  //   this.notifyRoom();
  // }

  // onResume(){
  //   this.notifyRoom();
  // }
  

  onStart(){
    console.info(`Starting session on room ${this.room.id}`);
    try {
      console.info("+ both ready: start process");
      this.room.printDebug();
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