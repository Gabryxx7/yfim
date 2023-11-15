import Subscribable from "./Subscribable";
import {FPSCounter} from "./FPSTimer";

export default class YFIMObject extends Subscribable {
   static DefaultConfig = {
      name: "YFIMObject",
      frameRate: -1
   }
   static Event = {
      UPDATE: 'update',
      DRAW: 'draw',
      INIT_COMPLETED: 'init-completed'
   }
   static Status = {
      ERROR: {code: -1, name: 'ERROR'},
      NONE: {code: 0, name: 'NONE'},
      STOPPED: {code: 1, name: 'STOPPED'},
      INITIALIZING: {code: 2, name: 'INITIALIZING'},
      INIT_COMPLETED: {code: 3, name: 'INIT_COMPLETED'},
      RUNNING: {code: 4, name: 'RUNNING'},
   }
   
   Event = YFIMObject.Event;
   Status = YFIMObject.Status;
   
   constructor(config){
      super();
      this.tag = "NONE";
      this.config = {...YFIMObject.DefaultConfig, ...config};
      this.name = this.config.name;
      this.calls = { draw: 0, update: 0}
      this.currStatus = this.Status.NONE;
      this.fpsCounter = new FPSCounter(30);
      this.fpsCounter.limit = this.config.frameRate;
      this.shouldStop = false;
   }

   isRunning(){
      return this.currStatus.code > this.Status.INIT_COMPLETED.code;
   }

   isReady(){
      return this.currStatus.code >= this.Status.INIT_COMPLETED.code;
   }

   /********** OVERRIDEABLE METHODS *********************/
   async init(){} /** Initialize stuff like loading configs or loading ML/DL models  */
   async update(){}
   /**
    * Draw to canvas. This should be called as `window.requestAnimationFrame(() => this._draw());` 
      Even though the processing is complete, it's a good idea to draw in the animation frame which uses GPU acceleration,
      instead of drawing in the same update() function
    */
   draw(){}
   dispose(){}

   get data(){
      return this.fpsCounter.data;
   }

   /*****************************************/

   setStatus(status){
      this.currStatus = status;
   }

   stop(){
      this.shouldStop = true;
   }
   /** Will attempt to start the video processor*/
   async start(){
      if(this.isRunning())
         return console.warn(`Video Processor is already running! ${this.config.name}`);

      if(!this.isReady()){
         // console.log(`Initializing ${this.config.name}`)
         try {
            this.setStatus(this.Status.INITIALIZING);
            await this.init();
            this.setStatus(this.Status.INIT_COMPLETED);
            this.dispatch(this.Event.INIT_COMPLETED);
         } catch (error) {
            this.setStatus(this.Status.ERROR);
            console.error(`Error initializing video processor ${this.config.name}`, error);
         }
      }

      // console.log(`Starting ${this.config.name}`)
      setTimeout(() => this.loop());
   }

   async loop(){
      if(this.shouldStop){
         this.setStatus(this.Status.STOPPED)
         this.dispose();
         return;
      }
      window.requestAnimationFrame(() => this.loop());
      const skipFrame = this.fpsCounter.update();
      if(skipFrame) return;
      // console.log(`Looping ${this.config.name}`)
      if(!this.isReady()){
         return console.log(`${this.config.name} is not ready yet...`)
      }
      this.setStatus(this.Status.RUNNING);
      try{
         await this.update();
         this.calls.update += 1;
         this.dispatch(this.Event.UPDATE, this.data);
      } catch (error) {
         this.setStatus(this.Status.ERROR);
         console.error(`Error in ${this.config.name} update`, error);
      }
      try{
         this.draw();
         this.calls.draw += 1;
         this.dispatch(this.Event.DRAW);
      } catch (error) {
         this.setStatus(this.Status.ERROR);
         console.error(`Error in ${this.config.name} draw`, error);
      }
   }

}