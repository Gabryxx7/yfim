/**  These should be evaluated in order, the first one is the strictes so:
 *   1. If less than 30s remain, return this color
 *   2. If it's more than 30s now check if it's less than 60s, return this color
 *   3. If it's more than 60s then this function will return true for whatever time is left, so return this color as a last resort
 *   4. The last one should always just return true, so that this color will just be the default color
*/
const timeColorMapDefault = [
    {conditionFun: (timeRemaining) => timeRemaining < 30, color: "#ff6347"},
    {conditionFun: (timeRemaining) => timeRemaining < 60, color: "#ff9933"},
    {conditionFun: (timeRemaining) => true, color: "#eeeeee"},
  ]

const getTimerColor = (remaining, timeColorMap) => {
  var color = timeColorMap[timeColorMap.length - 1].color; // default color
  for(let interval of timeColorMap){
    if(interval.conditionFun(remaining)){
      return interval.color;
    }
  }
  return color;
}

class TimedEvent {
    constructor(name="TimedEventID", updateInterval=1000) {
        this.name = name;
        this.id = name; //might eventually be like a session or stage id
        this.stages = [];
        this.testCount = 0;
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
        this.onStartCallbacks = [];
        this.onStageStartCallbacks = [];
    }
    
    addOnStart(onStartFun){
      this.onStartCallbacks.push(onStartFun);
    }

    addOnStageStart(onStartFun){
      this.onStageStartCallbacks.push(onStartFun);
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
        for(let onStageStart of this.onStageStartCallbacks){
          onStageStart(this);
        }
    }
  
    start(startTime=-1, startDateTime=null, duration=-1){
        this.running = true;
        this.startDatetime = startDateTime ?? new Date().getTime();
        this.startTime = startTime > 0 ? startTime : performance.now();
        this.duration = duration;
        this.interval = setInterval(() => this.update(), 1000);
        console.log("STARTING SESSION: " +this.name);
        for(let onStart of this.onStartCallbacks){
          onStart(this);
        }
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
  
export {timeColorMapDefault, getTimerColor, TimedEvent};