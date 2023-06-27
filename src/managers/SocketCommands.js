
const SOCKET_CMDS = { 
  NONE:                 "NONE",
  RESET:                "reset",
  CONNECT:              "connect",
  DISCONNECT:           "disconnect",
  ACCEPT:               "accept",
  REJECT:               "reject",
  AUTH:                 "auth",
  JOIN_ROOM:            "join-room",
  ROOM_JOIN_FEEDBACK:   "join_room_feedback",
  LEAVE_ROOM:           "leave-room",
  ROOM_FULL:            "room-full",
  ROOM_IDLE:            "room-idle",
  APPROVE:              "approve",
  MESSAGE:              "message",
  BRIDGE:               "bridge",
  HANGUP:               "hangup",
  CONTROL_ROOM:         "control-room",
  SURVEY_CONNECT:       "survey-connect",
  SURVEY_START:         "survey-start",
  SURVEY_END:           "survey-end",
  FACE_DETECTED:        "face-detected",
  DATA_CONNECT:         "data-connect",
  PROCESS_READY:        "process-ready",
  PROCESS_START:        "process-start",
  PROCESS_STARTED:        "process-started",
  PROCESS_CONTROL:      "process-control",
  PROCESS_STOP:         "process-stop",
  DATA_SEND:            "data-send",
  CONTROL:              "control",
  PROJECTION_TEST:      "projection-test",
  PROJECTION_CONNECT:   "projection-connect",
  STAGE_CONTROL:        "stage-control",
  RECORDING:            "recording",
  UPLOAD_FINISH:        "upload-finish",
  CONNECT_ERROR:        "connect_error",
  HELLO:                "hello"
}

const DATA_TYPES = {
  QUESTION: "question",
  EMOTION: "emotion"
}

const NAMESPACES = {
  CHAT: "chat-page",
  CONTROL: "control-page",
  PROJECTION: "projection-page",
}

module.exports = { SOCKET_CMDS, DATA_TYPES, NAMESPACES }