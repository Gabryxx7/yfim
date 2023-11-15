import { DateTimer } from "./FPSTimer";
import YFIMObject from "./YFIMObject";

export default class Recorder {
   constructor(yfimObject){
      this.target = yfimObject;
		this.recording = false;
		this.chunks = [];
      this.session = null;
      this.timer = new DateTimer();
   }

   start(session=null){
      this.session = session;
      this.timer.reset().update();
		delete this.chunks;
		this.chunks = [];
		if(this.session){
			this.chunks.push(session.getSessionData());
		}
      if(this.target?.subscribe){
         this.target.subscribe(YFIMObject.Event.UPDATE, () => this.push(this.target.lastFrame))
      }
		this.recording = true;
   }

   push(data){
      if(!this.recording) return;
      this.timer.update();
      data.timestamp = this.timer.last;
      data.offset = this.timer.elapsed;
      this.chunks.push(data);
   }

   stop(filename){
      this.recording = false;
      this.chunks.unshift({
         start: this.timer.start,
         end: this.timer.last,
         duration: this.timer.elapsed,
         frames: this.chunks.length,
      })
   }

   get blob(){
      // console.log(this.chunks[0])
      // const blob = new Blob(this.chunks, {type: "text/plain;charset=utf-8"});
      // FileSaver.saveAs(blob, `${filename}.json`);
      const blob = new Blob([JSON.stringify(this.chunks)], {type: "text/plain;charset=utf-8"});
      // const videos = this.state.videos.concat([videoURL]);
      // this.setState({ videos });
      return blob;
   }
}
