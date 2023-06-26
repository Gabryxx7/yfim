var log = console.log;
console.log = function(){
  const LOG_PREFIX = "\x1b[37m";
  const LOG_POSTFIX = "\x1b[0m";
  // 1. Convert args to a normal array
  var args = Array.from(arguments);
  // OR you can use: Array.prototype.slice.call( arguments );
      
  // 2. Prepend log prefix log string
  args.unshift(LOG_PREFIX);
  args.push(LOG_POSTFIX);
      
  // 3. Pass along arguments to console.log
  log.apply(console, args);
}

var debug = console.debug;
console.debug = function(){
  const LOG_PREFIX = "\x1b[90m";
  const LOG_POSTFIX = "\x1b[0m";
  // 1. Convert args to a normal array
  var args = Array.from(arguments);
  // OR you can use: Array.prototype.slice.call( arguments );
      
  // 2. Prepend log prefix log string
  args.unshift(LOG_PREFIX);
  args.push(LOG_POSTFIX);
      
  // 3. Pass along arguments to console.log
  debug.apply(console, args);
}

var info = console.info;
console.info = function(){
  const LOG_PREFIX = "\x1b[92m";
  const LOG_POSTFIX = "\x1b[0m";
  // 1. Convert args to a normal array
  var args = Array.from(arguments);
  // OR you can use: Array.prototype.slice.call( arguments );
      
  // 2. Prepend log prefix log string
  args.unshift(LOG_PREFIX);
  args.push(LOG_POSTFIX);
      
  // 3. Pass along arguments to console.log
  info.apply(console, args);
}

var warn = console.warn;
console.warn = function(){
  const LOG_PREFIX = "\x1b[33m";
  const LOG_POSTFIX = "\x1b[0m";
  // 1. Convert args to a normal array
  var args = Array.from(arguments);
  // OR you can use: Array.prototype.slice.call( arguments );
      
  // 2. Prepend log prefix log string
  args.unshift(LOG_PREFIX);
  args.push(LOG_POSTFIX);
      
  // 3. Pass along arguments to console.log
  warn.apply(console, args);
}


var error = console.error;
console.error = function(){
  const LOG_PREFIX = "\x1b[91m";
  const LOG_POSTFIX = "\x1b[0m";
  // 1. Convert args to a normal array
  var args = Array.from(arguments);
  // OR you can use: Array.prototype.slice.call( arguments );
      
  // 2. Prepend log prefix log string
  args.unshift(LOG_PREFIX);
  args.push(LOG_POSTFIX);
      
  // 3. Pass along arguments to console.log
  error.apply(console, args);
}


module.exports = { console }