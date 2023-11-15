import YFIMObject from "./YFIMObject";

export default class VideoProcessor extends YFIMObject {
   static DefaultConfig = {
      name: "VideoProcessor",
   }

   constructor(config, canvas = null, video=null){
      super({...VideoProcessor.DefaultConfig, ...config})
      this.canvas = canvas;
      this.ctx = null;
		this.video = video;
      this.config.height.ideal ?? this.config.height.min ?? this.config.height;
      this.config.width.ideal ?? this.config.width.min ?? this.config.width;
      this.setVideo(this.video);
   }

   async setVideo(video) {
      if(video){
         console.log(`Setting ${this.config.name} Video Source: ${this.video?.id} -> ${video?.id}`, video);
         this.video = video;
         console.log({w: this.video.videoWidth, h: this.video.videoHeight})
         // this.video.videoHeight = this.config.height;
         // this.video.videoWidth = this.config.width;
      }
      this.ctx = this.canvas?.getContext("2d");
   }

	// Draw a mask over face/screen
	draw() {
   }

   dispose(){
      // this.ctx.drawImage(null, 0, 0);
   }

}