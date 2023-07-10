const RTC_CMDS = {
  ACTIONS: {
    START_CALL: "create",
    JOIN_CALL:         "join",
    ACCEPT_JOIN_REQUEST:       "accept",
    REJECT_JOIN_REQUEST:       "reject",
    APPROVE_REQUEST:      "approve",
    REQUEST_JOIN: 'auth',
    HANGUP:       "hangup",
    MESSAGE:      "message",
  },
  STATUS: {
    FULL:         "full",
    HOST_HANGUP:  "host-hangup",
    GUEST_HANGUP: "guest-hangup",
    ESTABLISHED:  "established",
    CONNECTING:   "connecting",
  }
}


const SOCKET_CMDS = { 
  NONE:                 "NONE",
  RESET:                "reset",
  CONNECT:              "connect",
  DISCONNECT:           "disconnect",
  RTC_COMMUNICATION:    "rtc-communication",
  JOIN_ROOM:            "join-room",
  ROOM_JOIN_FEEDBACK:   "join_room_feedback",
  LEAVE_ROOM:           "leave-room",
  ROOM_IDLE:            "room-idle",
  MESSAGE:              "message",
  BRIDGE:               "bridge",
  HANGUP:               "hangup",
  CONTROL_ROOM:         "control-room",
  SESSION_UPDATE:       "session-update",
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

module.exports = { SOCKET_CMDS, RTC_CMDS, DATA_TYPES, NAMESPACES }