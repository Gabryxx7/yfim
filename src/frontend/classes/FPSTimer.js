export class Timer {
   constructor(nowFun){
      this.now = nowFun ?? (() => performance.now());
      this.start = -1;
      this.last = -1;
      this.delta = -1;
      this.elapsed = -1;
      return this;
   }
   reset(){
      this.start = this.last = this.elapsed = this.delta = -1;
      return this;
   }
   update(){
      if(this.start < 0) this.start = this.now();
      this.delta = this.now() - this.last;
      this.last = this.now();
      this.elapsed = this.last - this.start;
      return this;
   }
}

export class DateTimer extends Timer {
   constructor(){
      super(() => Date.now())
   }
}

export class FPSCounter {
   constructor(avgWindow=1){
      this.timer = new Timer();
      this.dateTimer = new DateTimer();
      this.i = 0;
      this.history = Array(avgWindow);
      this.fps = 0;
      this.avgFps = 0;
      this.framerate = -1;
      this.maxDelta = Infinity;
      this.lastTick = -1;
   }
   get limit(){
      return this.framerate;
   }

   set limit(value){
      this.maxDelta = (1000/value)*0.8;
      this.framerate = value;
   }
   update(){
      if(this.limit > 0){
         const sincePause = this.timer.now() - this.timer.last;
         if(sincePause <= this.maxDelta){
            // console.log(`Limiting FPS to ${this.limit}, delta: ${Math.round(sincePause)}, maxDelta: ${Math.round(this.maxDelta)}, ${this.fps}`)
            return true;
         }
      }
      this.timer.update();
      this.history[this.i] = this.fps = Math.round(1000/this.timer.delta);
      // Update avg fps
      if(this.history.length <= 1){
         this.avgFps = this.fps;
      } else {
         this.i = this.i >= this.history.length - 1 ? 0 : this.i+1;
         this.avgFps = Math.round(this.history.reduce((a, b) => (a + b)) / this.history.length)
      }
      this.lastTick = this.timer.last;
      return false;
   }

   get data(){
      return {
         avg: this.avgFps,
         last: this.fps,
         deltaTime: this.timer.delta,
         lastTime: this.timer.last
      }
   }
}
