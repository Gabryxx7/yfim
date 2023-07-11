const COLORS = {
  RED1: "\x1b[38;5;9m",
  GREEN1: "\x1b[38;5;77m",
  YELLOW1: "\x1b[38;5;190m",
  WHITE: "\x1b[38;5;231m",
  CYAN1: "\x1b[38;5;44m",
  ORANGE1: "\x1b[38;5;214m",
  RESET: "\x1b[0m",
}


// args should be a normal array made from the function's arguments like Array.from(arguments)
colouredConsoleOutput = function(color, args, fun){
  const LOG_PREFIX = color;
  var args = Array.from(args);
  // OR you can use: Array.prototype.slice.call( arguments );
      
  // 2. Prepend log prefix log string
  args.unshift(LOG_PREFIX);
  args.push(COLORS.RESET);
      
  // 3. Pass along arguments to console.log
  fun.apply(console, args);
}

var log = console.log;
console.log = function(){
  colouredConsoleOutput(COLORS.CYAN1, Array.from(arguments), log);
}

var debug = console.debug;
console.debug = function(){
  colouredConsoleOutput(COLORS.GREEN1, Array.from(arguments), debug);
}

var warn = console.warn;
console.warn = function(){
  colouredConsoleOutput(COLORS.ORANGE1, Array.from(arguments), warn);
}


var error = console.error;
console.error = function(){
  colouredConsoleOutput(COLORS.RED1, Array.from(arguments), error);
}


var info = console.info;
// console.info = function(){
//   colouredConsoleOutput("\x1b[92m", Array.from(arguments), info);
// }

console.room = function(){
  colouredConsoleOutput(COLORS.YELLOW1, Array.from(arguments), info);
}


module.exports = { console }