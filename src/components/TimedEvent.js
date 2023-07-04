
const timeColorMapDefault = [
    {conditionFun: (timeRemaining) => timeRemaining < 30, color: "#ff6347"},
    {conditionFun: (timeRemaining) => timeRemaining < 60, color: "#ff9933"},
    {conditionFun: (timeRemaining) => true, color: "#eeeeee"},
  ]

class TimedEvent {
    constructor(name="TimedEventID", updateInterval=1000) {
        this.name = name;
        this.id = name; //might eventually be like a session or stage id
        this.stages = [];
        this.updateInterval = updateInterval;
        this.currentStage = -1;
        this.currentStageData = null;
        this.running = false;
        this.duration = -1;
        this.startTime = 0; 
        this.startDatetime = -1;
        this.endTime = -1;
        this.endDatetime = 0; 
        this.timeElapsed = 0;
        this.timeRemaining = 0;
        this.colorMap = timeColorMapDefault;
        this.interval = null;
        this.data = {};
        this.onUpdateCallbacks = [];
    }
    addOnUpdate(onUpdateFun){
        this.onUpdateCallbacks.push(onUpdateFun);
    }

    get [Symbol.toStringTag]() {
        let eventInfo = ""
        eventInfo += `${this.id}: ${this.name} (${this.stages.length} stages)\t`;
        eventInfo += `Started: ${this.startDatetime}, Current Stage Duration: ${this.data?.stage?.duration}, `;
        eventInfo += `Elapsed: ${this.timeElapsed}, Remaining: ${this.timeRemaining}`;
        return eventInfo;
    }

    addStage(stage){
        this.stages.push(stage);
    }

    startNextStage(){
        if(this.currentStage >= this.stages.length){
            return false;
        }
        this.currentStage += 1;
        this.currentStageData = this.stages[this.currentStage];
    }
  
    start(startTime=-1, startDateTime=null, duration=-1){
        this.running = true;
        this.startDatetime = startDateTime ?? new Date().getTime();
        this.startTime = startTime > 0 ? startTime : performance.now();
        this.duration = duration;
        this.interval = setInterval(() => this.update(), 1000);
    }
  
    update(){
      this.timeElapsed = (performance.now() - this.startTime)/1000;
      
      if(this.duration < 0){
        this.timeRemaining = this.duration - this.timeElapsed;
      }
      for(let stage of this.stages){
        stage.update();
      }
      for(let onUpdate of this.onUpdateCallbacks){
        onUpdate(this);
      }
    }
  
    stop(){
      clearInterval(this.interval);
      this.interval = null;
      this.endTime = performance.now();
      this.endDatetime = performance.now();
      this.running = false;
      for(let child of this.stages){
        child.stop();
      }
    }
}
  
export {timeColorMapDefault, TimedEvent};