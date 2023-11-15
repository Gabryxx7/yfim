export default class Subscribable {
   constructor(){
      this.subscribers = {}
   }

   subscribe(event, callback){
      if(!this.subscribers[event]) this.subscribers[event] = [];
      // console.log("Subscribing to " +event)
      this.subscribers[event].push(callback);
   }

   dispatch(event, ...data){
      this.subscribers[event]?.forEach(fun => {
         fun(...data)
      });
   }
}