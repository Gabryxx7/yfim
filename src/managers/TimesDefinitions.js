
const TIMES = { 
    AUTOACCEPT_WAIT: 60000,
    LOSING_FACE_NOTIFY: 5000,
    ICE_RECONNECTION_INTERVAL: 5000,
    DATA_UPLOAD_WAIT: 5000,
    PROCESS_UPDATE_INTERVAL: 5000,
    FACE_DETECTION_RETRY: 200,
    FACE_DETECTION_DELAY: 0 /** 0 will run the face detection as fast as possible (max fps), you can introduce a delay to avoid use too much CPU/GPU **/,
    PROCESS_STOP_WAIT: 20000,
    SESSION_UPDATE_INTERVAL: 1000
  }
  
module.exports = { TIMES }