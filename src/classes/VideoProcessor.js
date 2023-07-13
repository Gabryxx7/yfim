export default class VideoProcessor {
   static DefaultConfig = {
      name: "VideoProcessor",
      waitForProcessor: true, // Only draw after the video processor is done, otherwise draw will just run on its own in the "background" (Javascript in single threaded anyway...)
   }
   static Status = {
      ERROR: -1,
      NONE: 0,
      INITIALIZING: 1,
      INIT_COMPLETED: 2,
      RUNNING: 3,
      STOPPED: 4
   }
   constructor(overrides = null, canvas = null, video=null){
      if(overrides == null) overrides = {};
      this.config = {...VideoProcessor.DefaultConfig, ...overrides};
      console.log(`Creating new Video Processor: ${this.config.name}`, this.config);
      this.status = VideoProcessor.Status.NONE;
      this.canvas = canvas;
		this.video = video;
      this.drawCount = 0;
      this.updateCount = 0;
   }

   isRunning(){
      return([VideoProcessor.Status.INIT_COMPLETED, VideoProcessor.Status.RUNNING].includes(this.status));
   }

   async setVideo(video) {
      console.log(`Setting ${this.config.name} Video Source: ${this.video?.id} -> ${video.id}`, video);
      this.video = video;
   }

   /**
    * Will attempt to start the video processor
    */
   async start(){
      if([VideoProcessor.Status.INIT_COMPLETED, VideoProcessor.Status.RUNNING].includes(this.status)){
         console.warn(`Video Processor is already running! ${this.config.name}`);
         return;
      }
      console.log(`Starting ${this.config.name}`)
      await this._init();

      // This here will print how many draw() and update() calls have been made every second. If waitForProcessor=true then they should always be the same
      // Otherwise they should differ and go at their own speed
      // setInterval(() => console.log(`Draw: ${this.drawCount}, Update: ${this.updateCount}`), 1000);
      if(this.config.waitForProcessor){
         await this.loop();
      }
      else{
         await this._update();
         this._draw();
      }
   }

   async loop(){
      // console.log(`Looping ${this.config.name}`)
      try{
         await this._update();
         this._draw();
      } catch (error) {
         this.status = VideoProcessor.Status.ERROR;
         console.error(`Error in video processor LOOP ${this.config.name}`, error);
      }
      window.requestAnimationFrame(async () => await this.loop());
   }

   /**
    * Initialize stuff like loading configs or loading ML/DL models 
    */
   async init(){}
   async _init(){
      console.log(`Initializing ${this.config.name}`)
      try {
         this.status = VideoProcessor.Status.INITIALIZING;
         await this.init();
         this.status = VideoProcessor.Status.INIT_COMPLETED;
      } catch (error) {
         this.status = VideoProcessor.Status.ERROR;
         console.error(`Error initializing video processor ${this.config.name}`, error);
      }
   }

   /**
    * Initialize stuff like loading configs or loading ML/DL models 
    */
   async update(){}
   async _update(){
      this.updateCount += 1;
      // console.log(`Update(): ${this.updateCount}`);
      try {
         if(![VideoProcessor.Status.INIT_COMPLETED, VideoProcessor.Status.RUNNING].includes(this.status)){
            console.log("Waiting for initialization to complete...")
            return;
         }
         this.status = VideoProcessor.Status.RUNNING;
         await this.update();
      } catch (error) {
         this.status = VideoProcessor.Status.ERROR;
         console.error(`Error in video processor UPDATE ${this.config.name}`, error);
      }
      if(!this.config.waitForProcessor){
         setTimeout(async () => await this._update(), 0);
      }
   }

   /**
    * Draw to canvas. This should be called as `window.requestAnimationFrame(() => this._draw());` 
      Even though the processing is complete, it's a good idea to draw in the animation frame which uses GPU acceleration,
      instead of drawing in the same update() function
    */
   draw(){}
   _draw(){
      this.drawCount += 1;
      // console.log(`Draw(): ${this.drawCount}`);
      try {
         this.draw();
      } catch (error) {
         this.status = VideoProcessor.Status.ERROR;
         console.error(`Error in video processor DRAW ${this.config.name}`, error);  
      }
      if(!this.config.waitForProcessor){
         window.requestAnimationFrame(() => this._draw());
      }
   }
}