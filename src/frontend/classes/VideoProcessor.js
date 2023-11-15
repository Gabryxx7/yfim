import YFIMObject from "./YFIMObject";

export default class VideoProcessor extends YFIMObject {
   static DefaultConfig = {
      name: "VideoProcessor",
   }

   constructor(config, canvas = null, video=null){
      super({...VideoProcessor.DefaultConfig, ...config})
      this.canvas = canvas;
		this.video = video;
   }

   async setVideo(video) {
      console.log(`Setting ${this.config.name} Video Source: ${this.video?.id} -> ${video.id}`, video, video.videoWidth);
      this.video = video;
      this.ctx = this.canvas.getContext("2d");
   }

	// Draw a mask over face/screen
	draw() {
      this.canvas.height = this.config.height;
      this.canvas.width = this.config.width;
   }

   dispose(){
      // this.ctx.drawImage(null, 0, 0);
   }

}