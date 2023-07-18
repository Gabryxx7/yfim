const { CMDS, DATA } = require("./Communications");

const STATUS = {
  NONE: "none",
  IN_PROGRESS: "in_progress",
  COMPLETED: "completed",
};

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
    this.status = STATUS.NONE;
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
    if (this.steps.length > 0) {
      this.currentStepIdx = 0;
      this.currentStep = this.steps[this.currentStepIdx];
      this.currentStep.initialize();
      this.status = STATUS.IN_PROGRESS;
      this.duration = 0;
      for (let i = 0; i < this.config.steps.length; i++) {
        this.duration += this.steps[i].duration;
      }
      return;
    }
    // If it's a multi-step stage then we don't need to initialize the stage itself (a multi-step stage cannot have stuff of its own)

    // let stage = this.parent.id;
    // GABRY: TESTING... Using stage = 3 and mask_setting["setting"][2] I was able to test the mask 
    // let stage = 3;
    if (this.type == "video-chat") {
      this.extra = {};
      try{
        // let mask_setting = this.session.masksConfig[this.params.mask_id];
        // mask_setting = mask_setting?.setting ? mask_setting.setting[2] : {};
        this.extra['mask'] = this.params?.mask_settings;
      } catch(error){
        console.error("error getting mask settings: ", error);
      }
      try{
        let prompts = this.session.topics[this.params.question_type];
        const rindex = Math.floor(Math.random() * prompts.length);
        let topic = prompts[rindex];
        this.extra['topic'] = topic;
        this.session.topic_selected.push(topic);
      } catch(error){
        console.error("error getting new topic: ", error);
      }
    }

    // const stageData = {
    //   stage: this.currentStepIdx,
    //   stageData: this.currentStep?.getData(),
    //   config: this.config,
    //   data: this.getData()
    // }
    // if(this.session.chatsManager.nsio){
    //   this.session.chatsManager.nsio.emit(CMDS.SOCKET.STAGE_CONTROL, stageData);
    // }
    // if(this.session.projectio){
    //   this.session.projectio.emit(CMDS.SOCKET.STAGE_CONTROL, stageData);
    // }
    // No need for these two lines if the stages do not have anything in the middle, just use session_update
    // this.session.chatsManager.nsio.emit(CMDS.SOCKET.STAGE_UPDATE, stageData)
    // this.session.controlManager.nsio.emit(CMDS.SOCKET.STAGE_UPDATE, stageData)

    this.status = STATUS.IN_PROGRESS;
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
        startTime: this.startTime,
        startDateTime: this.startDateTime,
        duration:this.duration,
        room: this.room?.id,
        step: this.currentStepIdx,
        stepData: this.currentStep?.getData(),
        type: this.type,
        ...this.currentStep?.extra
      };
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
      if (this.currentStep.status == STATUS.COMPLETED) {
        this.currentStepIdx += 1;
        if (this.currentStepIdx >= this.steps.length) {
          this.status = STATUS.COMPLETED;
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
    this.status = STATUS.COMPLETED;
  }

  update() {
    if (this.status == STATUS.COMPLETED) {
      return;
    }

    if (this.status == STATUS.NONE) {
      this.initialize(); // Just in case it did not get initialized before, should be done immediately by the session manager when switching stages
    }
    // First update right after the initialization
    if (this.status == STATUS.IN_PROGRESS) {
      this.updateProgress();
    }
  }
}

module.exports = { STATUS, Stage };
