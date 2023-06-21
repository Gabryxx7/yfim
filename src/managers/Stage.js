const { SOCKET_CMDS, DATA_TYPES } = require("../managers/SocketCommands");

const STATUS = {
  NONE: "none",
  IN_PROGRESS: "in_progress",
  COMPLETED: "completed",
};

class Stage {
  constructor(session, config, parent = null, idx = -1) {
    this.session = session;
    this.config = config;
    this.name = this.config.name ? this.config.name : "";
    this.name =
      parent != null ? `${parent.name} - ${this.config.type}` : this.name;
    this.parent = parent;
    this.prefix = parent != null ? "\t" : "";
    this.id = idx;
    this.type = this.config.type;
    this.duration = this.config.duration ? this.config.duration : -1;
    this.params = this.config.params;
    this.currentStepIdx = -1;
    this.currentStep = null;
    this.startTime = -1;
    this.endTime = -1;
    this.timeLeft = -1;
    this.status = STATUS.NONE;
    this.steps = [];
    if (this.config.steps) {
      for (let i = 0; i < this.config.steps.length; i++) {
        this.steps.push(new Stage(this.session, this.config.steps[i], this, i));
      }
    }
    if (this.steps.length > 0) {
      this.type = "multi-step";
    }
  }

  initalize() {
    this.startTime = new Date().getTime();
    this.elapsed = 0;
    console.log(`${this.prefix}Starting ${this.name} (${this.type} - ${this.duration}s)`);
    if (this.steps.length > 0) {
      this.currentStepIdx = 0;
      this.currentStep = this.steps[this.currentStepIdx];
      this.currentStep.initalize();
      this.status = STATUS.IN_PROGRESS;
      return;
    }
    let stage = this.parent.index;
    if (this.type == "video-chat") {
      let mask_setting = this.session.masksConfig[this.params.mask_id];
      let prompts = this.session.topics[this.params.question_type];
      const rindex = Math.floor(Math.random() * prompts.length);
      let topic = prompts[rindex];

      this.session.topic_selected.push(topic);
      console.log("- sending update to projection in room: " + room);
      if(this.session.chatio){
        this.session.chatio.emit(SOCKET_CMDS.STAGE_CONTROL.cmd, {
            mask: mask_setting,
            topic: [topic],
            stage,
        });
    }
    if(this.session.projectio){
      this.session.projectio.emit(SOCKET_CMDS.STAGE_CONTROL.cmd, {
        mask: mask_setting,
        topic: [topic],
        stage,
      });
    }
    } else if (this.type == "survey") {
        this.session.chatio.emit(SOCKET_CMDS.SURVEY_START.cmd, { stage: stage });
        this.session.controlio.emit(SOCKET_CMDS.SURVEY_START.cmd, { stage: stage });
      // console.log(`- sending survey start to room: ${room} (stage: ${stage})`);
    }
    this.status = STATUS.IN_PROGRESS;
  }

  updateProgress() {
    let nowTime = new Date().getTime();
    this.elapsed = (nowTime - this.startTime) / 1000;
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
        this.currentStep.initalize();
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
      this.initalize(); // Just in case it did not get initialized before, should be done immediately by the session manager when switching stages
    }
    // First update right after the initialization
    if (this.status == STATUS.IN_PROGRESS) {
      this.updateProgress();
    }
  }
}

module.exports = { STATUS, Stage };
