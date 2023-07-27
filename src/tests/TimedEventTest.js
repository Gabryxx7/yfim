import {TimedEvent} from "../managers/TimedEvent.js"


class SessionTest extends TimedEvent {
   constructor() {
      super(500);
   }

   onStart() {
      console.log(`Test Session STARTED!`);
   }
   onStop() {
      console.log(`Test Session STOPPED! after ${this.elapsed}s`);
   }
   onTick() {
      console.log(`Test Session TICK! Elapsed:${this.elapsed} DT: ${this.deltaTime} Remaining: ${this.remaining}`);
   }
}

const st = new SessionTest();

st.start()
setTimeout(() => {
   st.stop();
}, 5000)


// const te = new TimedEvent(1000, 5000);

// te.addOnStart(() => console.log("STARTED"))
// te.addOnStop(() => console.log(`STOPPED after ${te.elapsed}s`))
// te.addOnTick((te) => console.log(`TICK  Elapsed:${te.elapsed} DT: ${te.deltaTime} Remaining: ${te.remaining}`))
// te.start();

