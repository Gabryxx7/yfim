// args should be a normal array made from the function's arguments like Array.from(arguments)
const customConsoleOutput = function(args, fun){
   var args = Array.from(args);
   // OR you can use: Array.prototype.slice.call( arguments );
   const copiedArgs = args.map(x => {
      if(typeof x === 'object'){
         try{
            return JSON.parse(JSON.stringify(x));
         } catch(e){}
      }
      return x;
   })
       
   // 3. Pass along arguments to console.log
   fun.apply(console, copiedArgs);
 }
 
var log = console.log;
console.log = function(){
   customConsoleOutput(Array.from(arguments), log);
}
 
 export default console;