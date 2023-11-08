import { CMDS, STAGE, USER } from "./Definitions.js";
import Topics from "../../assets/Topics.js";


const randomInRange = (min, max) => Math.floor(Math.random() * (max - min)) + min;
class Stage {
  constructor(room, session, config, parent = null, idx = -1) {
    this.session = session;
    this.room = room;
    this.config = config;
    this.name = this.config.name ?? this.config.type;
    this.parent = parent;
    this.name = parent != null ? `${parent.name} - ${this.name}` : this.name;
    this.prefix = parent != null ? "\t" : "";
    this.index = idx;
    this.id = idx;
    this.type = this.config.type;
    this.duration = this.config.duration ? this.config.duration : 0;
    this.params = this.config.params;
    this.currentStepIdx = -1;
    this.currentStep = null;
    this.startDateTime = -1;
    this.startTime = -1;
    this.endTime = -1;
    this.timeLeft = -1;
    this.syncTimers = false; // If set to true it will wait for the clients to complete their own timer instead of forcing the stage/step to end
    this.status = STAGE.STATUS.NONE;
    this.extra = {};
    this.topic = null;
    this.selectedQuestionPrompts = null;
    this.steps = [];
    if (this.config.steps) {
      for (let i = 0; i < this.config.steps.length; i++) {
        this.steps.push(new Stage(this.room, this.session, this.config.steps[i], this, i));
      }
    }
    if (this.steps.length > 1) {
      this.type = "multi-step";
    }
  }

  getQuestionData(){
    if(this.selectedQuestionPrompts != null){
      console.log("The stage already has prompts " + this.selectedQuestionPrompts);
      return {topic: this.topic, prompts: this.selectedQuestionPrompts};
    }
    if(this.parent != null && this.parent.selectedQuestionPrompts){
      console.log("Parent's prompts " + this.parent.selectedQuestionPrompts);
      return {topic: this.parent.topic, prompts: this.parent.selectedQuestionPrompts};
    }
    try{
      let topic = this.config.topic ?? this.parent.config.topic;
      this.topic = topic;
      var questionsList = Topics[topic];
      const rindex = Math.floor(Math.random() * questionsList.length);
      let prompts = questionsList[rindex];
      if(Object.prototype.toString.call(prompts) === "[object String]"){
        prompts = [prompts];
      }
      this.selectedQuestionPrompts = prompts;
      console.log("Getting new prompts for the stage: " + prompts);
      return {topic: this.topic, prompts: this.selectedQuestionPrompts};

      // const rindex = Math.floor(Math.random() * prompts.length);
      // let question = prompts[rindex];
      // console.log("Getting new prompt for the stage" + question);
      // return {topic: topic, prompts: question};
    } catch(error){
      console.error("error getting new question: ", error);
    }
    return {};
  }

  getMaskData(){
    if(!this.config?.maskSettings) return {};
    let maskData = this.config.maskSettings;

    const randomize = maskData?.pick_random_condition ?? false;
    if(randomize){
        try{
          console.log(`Available conditions ${this.session.availableConditions.length}`, this.session.availableConditions);
          const randIdx = randomInRange(0, this.session.availableConditions.length);
          let condition = this.session.availableConditions[randIdx];
          if(maskData.no_repetitions){
            condition = this.session.availableConditions.splice(randIdx, 1)[0];
          }
          maskData.visibleFeatures = condition;
          console.log(`New Condition idx ${randIdx}`, condition);
          console.log(`Remaining conditions`, this.session.availableConditions);
        } catch(error){
          console.warn("error getting randomized condition", error);
      }
    }
    return {mask: maskData};
  }

  initialize() {
    this.startDateTime = new Date().getTime();
    this.startTime = performance.now();
    this.elapsed = 0;
    console.log(`${this.prefix} Starting ${this.name} (${this.type} - ${this.duration}s)`);
    this.room.setUsersStatus(USER.STATUS.IN_SESSION);
    this.extra = {
      ...this.extra,
      ...this.getQuestionData(),
      ...this.getMaskData(),
      ...this.config
    };

    // If it does have multiple steps, then we should initialize the first step
    if (this.steps.length > 0) {
      this.currentStepIdx = 0;
      this.currentStep = this.steps[this.currentStepIdx];
      this.currentStep.initialize();
      this.status = STAGE.STATUS.IN_PROGRESS;
      this.duration = 0;
      for (let i = 0; i < this.config.steps.length; i++) {
        this.duration += this.steps[i].duration;
      }
      return; // We should stop here since the stage updates with its internal steps and it does not have a progress on its own
    }
    // If the stage does not have any step, then the current step is the stage itself
    this.status = STAGE.STATUS.IN_PROGRESS;
  }

  moveToNextStep(){
    if(this.steps.length > 0){
      console.log(`Stage ${this.name} Step ${this.currentStep.name} COMPLETED`)
      this.currentStep.status = STAGE.STATUS.COMPLETED;
      this.currentStepIdx += 1;
      if (this.currentStepIdx >= this.steps.length) {
        this.status = STAGE.STATUS.COMPLETED;
      }
      else{
        this.currentStep = this.steps[this.currentStepIdx];
        this.currentStep?.initialize();
        const sessionData = this.session.getData();
        this.room.notifyRoom(CMDS.SOCKET.SESSION_UPDATE, sessionData);
      }
    }
    else{
      this.status = STAGE.STATUS.COMPLETED;
    }
    if(this.status == STAGE.STATUS.COMPLETED){
      console.log(`Stage ${this.name} COMPLETED`)
    }
  }

  getData(){
    var data = {};
    try{
      data = {
        name: this.name, 
        id: this.id,
        index: this.index,
        startTime: this.startTime,
        startDateTime: this.startDateTime,
        duration: this.duration,
        ...this.extra,
      };
      if(this.currentStep){
        data.step = this.currentStep.getData();
      }
      else{
        data = {
          ...data,
          ...this.extra,
          type: this.type
        }
      }
    }catch(error){
      console.error(`Error getting stage data: `, error);
    }
    return data;
  }

  updateProgress() {
    if(this.syncTimers){
      this.elapsed = (performance.now() - this.startTime) / 1000;
      // console.log(`${this.prefix}Elapsed ${this.name}: ${this.elapsed}`);
      if (this.duration > 0) {
        this.timeLeft = this.duration - this.elapsed;
        if (this.timeLeft <= 0) {
          this.timeLeft = 0;
          this.moveToNextStep();
          return;
        }
      }
    }
    if(this.currentStep != null){
      this.currentStep.update();
    }
    // If there is not set duration and it's not a multi-step stage
    // Completion will be set by an external event such a socket message
  }

  update() {
    if (this.status == STAGE.STATUS.COMPLETED) {
      return;
    }

    if (this.status == STAGE.STATUS.NONE) {
      this.initialize(); // Just in case it did not get initialized before, should be done immediately by the session manager when switching stages
    }
    // First update right after the initialization
    if (this.status == STAGE.STATUS.IN_PROGRESS) {
      this.updateProgress();
    }
  }
}

export default Stage ;
