const { STAGE } = require("./Definitions");
const { Topics } = require("../../assets/Topics");

class Stage {
  constructor(room, session, config, parent = null, idx = -1) {
    this.session = session;
    this.room = room;
    this.config = config;
    this.name = this.config.name ? this.config.name : "";
    this.name =
      parent != null ? `${parent.name} - ${this.config.type}` : this.name;
    this.parent = parent;
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
    this.status = STAGE.STATUS.NONE;
    this.extra = {};
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

  initialize() {
    this.startDateTime = new Date().getTime();
    this.startTime = performance.now();
    this.elapsed = 0;
    console.log(`${this.prefix} Starting ${this.name} (${this.type} - ${this.duration}s)`);
    this.room.setUsersReady(false);
    this.extra = {'topic': this.config.topic};

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

    if (this.type == STAGE.TYPE.VIDEO_CHAT) {
      try{
        // let mask_setting = this.session.masksConfig[this.params.mask_id];
        // mask_setting = mask_setting?.setting ? mask_setting.setting[2] : {};
        this.extra['mask'] = this.params?.mask_settings;
      } catch(error){
        console.error("error getting mask settings: ", error);
      }
      try{
        let prompts = Topics[this.config.topic];
        const rindex = Math.floor(Math.random() * prompts.length);
        let question = prompts[rindex];
        this.extra['prompt'] = question;
        this.session.question_selected.push(question);
      } catch(error){
        console.error("error getting new question: ", error);
      }
    }
    else if (this.type == STAGE.TYPE.SURVEY) {
      if(this.params.test){
        this.extra.test = true;
      }
    }
  }

  setStatus(status){
    console.log(`Setting Status for Stage ${this.name}: ${status}`)
    this.status = status;
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
        room: this.room?.id,
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
    this.elapsed = (performance.now() - this.startTime) / 1000;
    console.log(`${this.prefix}Elapsed ${this.name}: ${this.elapsed}`);
    if (this.duration > 0) {
      this.timeLeft = this.duration - this.elapsed;
      if (this.timeLeft <= 0) {
        this.timeLeft = 0;
        this.complete();
        return;
      }
    }
    if (this.steps.length > 0) {
      this.currentStep.update();
      if (this.currentStep.status == STAGE.STATUS.COMPLETED) {
        this.currentStepIdx += 1;
        if (this.currentStepIdx >= this.steps.length) {
          this.status = STAGE.STATUS.COMPLETED;
          return;
        }
        this.currentStep = this.steps[this.currentStepIdx];
        this.currentStep?.initialize();
      }
    }
    // If there is not set duration and it's not a multi-step stage
    // Completion will be set by an external event such a socket message
  }

  complete() {
    this.status = STAGE.STATUS.COMPLETED;
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

module.exports = { Stage };
