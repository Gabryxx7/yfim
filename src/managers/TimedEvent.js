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
	static STATUS = {
		NONE: "None",
		RUNNING: "Running",
		PAUSED: "Paused",
		STOPPED: "Stopped",
		COMPLETED: "Completed",
		ERROR: "Error",
	};

   static CALLBACKS = {
      onStart: "onStart",
      onStop: "onStop",
      onPause: "onPause",
      onResume: "onResume",
      onTick: "onTick",
      onCompleted: "onCompleted"
   }

	constructor(updateInterval=1000, duration=-1) {
		this.status = TimedEvent.STATUS.NONE;
		this.timer = null;
		this.startTick = this.getTime();
		this.lastTick = this.getTime();
		this.elapsed = 0;
		this.deltaTime = 0;
      this.duration = duration;
      this.remaining = -1;
      this.updateInterval = updateInterval;

      this.callbacks = {};
      for(let key in TimedEvent.CALLBACKS){
         this.callbacks[key] = [];
      }
	}

   onStart(){};
   onStop(){};
   onPause(){};
   onResume(){};
   onTick(){};
   onCompleted(){};

   addCallback(key, callback){
      this.callbacks[key].push(callback);
   }
   addOnStart = (callback) => this.addCallback(TimedEvent.CALLBACKS.onStart, callback);
   addOnStop = (callback) => this.addCallback(TimedEvent.CALLBACKS.onStop, callback);
   addOnPause = (callback) => this.addCallback(TimedEvent.CALLBACKS.onPause, callback);
   addOnResume = (callback) => this.addCallback(TimedEvent.CALLBACKS.onResume, callback);
   addOnCompleted = (callback) => this.addCallback(TimedEvent.CALLBACKS.onCompleted, callback);
   addOnTick = (callback) => this.addCallback(TimedEvent.CALLBACKS.onTick, callback);

   callAll(key){
      for(let cb of this.callbacks[key]){
         cb(this);
      }
   }

	isRunning() {
		return this.status == TimedEvent.STATUS.RUNNING;
	}

	isCompleted() {
		return this.status == TimedEvent.STATUS.COMPLETED;
	}

	getTime() {
      return {
         date: new Date(),
         time: performance.now()
      }
   }

	tick() {
		const newTick = this.getTime();
		this.deltaTime = (performance.now() - this.lastTick.time) / 1000;
      this.elapsed = (performance.now() - this.startTick.time) / 1000;
      this.remaining = (this.duration/1000) - this.elapsed;
      this.lastTick = newTick;
      this.onTick();
      this.callAll(TimedEvent.CALLBACKS.onTick);
      if(this.duration > 0 && this.remaining <= 0){
         this.complete();
         return;
      }
      if(this.isRunning()){
         this.timer = setTimeout(() => {
            this.tick();
         }, this.updateInterval);
      }
	}

	start() {
      this.startTick = this.getTime();
      this.lastTick = this.getTime();
      this.status = TimedEvent.STATUS.RUNNING;
      this.onStart();
      this.callAll(TimedEvent.CALLBACKS.onStart);
      this.tick();
	}

	pause() {
      if(this.status != TimedEvent.STATUS.RUNNING) return;
      this.status = TimedEvent.STATUS.PAUSED;
		if (this.timer != null) {
			clearTimeout(this.timer);
		}
      this.onPause();
      this.callAll(TimedEvent.CALLBACKS.onPause);
	}

	resume() {
      if(this.status != TimedEvent.STATUS.PAUSED) return;
      this.status = TimedEvent.STATUS.RUNNING;
      this.onResume();
      this.callAll(TimedEvent.CALLBACKS.onResume);
      this.tick();
	}

	stop() {
      if([TimedEvent.STATUS.STOPPED, TimedEvent.STATUS.NONE, TimedEvent.STATUS.ERROR].includes(this.status)) return;
      this.status = TimedEvent.STATUS.STOPPED;
      this.tick();
		if (this.timer != null) {
			clearTimeout(this.timer);
		}
      this.onStop();
      this.callAll(TimedEvent.CALLBACKS.onStop);
	}


	complete() {
      if([TimedEvent.STATUS.STOPPED, TimedEvent.STATUS.COMPLETED, TimedEvent.STATUS.NONE, TimedEvent.STATUS.ERROR].includes(this.status)) return;
      this.status = TimedEvent.STATUS.COMPLETED;
		if (this.timer != null) {
			clearTimeout(this.timer);
		}
      this.onCompleted();
      this.callAll(TimedEvent.CALLBACKS.onCompleted);
	}
}

export {timeColorMapDefault, getTimerColor, TimedEvent};
