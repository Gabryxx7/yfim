const CMDS = {
  RTC: {
    ACTIONS: {
      START_CALL: "create",
      JOIN_REQUEST:         "join-request",
      AUTH_REQUEST:       'auth',
      ACCEPT_JOIN_REQUEST:       "accept",
      REJECT_JOIN_REQUEST:       "reject",
      HOST_APPROVAL_REQUEST:      "approve",
      HANGUP:       "hangup",
      MESSAGE:      "message",
    },
    STATUS: {
      ACCEPTED: "accepted",
      REJECTED: "rejected",
      FULL:         "full",
      HOST_HANGUP:  "host-hangup",
      GUEST_HANGUP: "guest-hangup",
      ESTABLISHED:  "established",
      CONNECTING:   "connecting",
      PENDING_APPROVAL:   "pending",
      DISCONNECTED:   "disconnected",
    }
  },
  SOCKET: { 
    NONE:                 "NONE",
    RESET:                "reset",
    CONNECT:              "connect",
    DISCONNECT:           "disconnect",
    RTC_COMMUNICATION:    "rtc-communication",
    JOIN_ROOM:            "join-room",
    ROOM_UPDATE:   "room-update",
    LEAVE_ROOM:           "leave-room",
    ROOM_IDLE:            "room-idle",
    MESSAGE:              "message",
    BRIDGE:               "bridge",
    HANGUP:               "hangup",
    CONTROL_ROOM:         "control-room",
    SESSION_UPDATE:       "session-update",
    STAGE_COMPLETED:      "stage-completed",
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
  },
  NAMESPACES: {
    CHAT: "chat-page",
    CONTROL: "control-page",
    PROJECTION: "projection-page",
  }
}

const makeParam = (required, defValue=null) => {
  const res = { required: required, _isModel: true };
  if(defValue != null) res.defValue = defValue;
  return res;
}

overrideFields = (model, overrides) => {
  for(let k in model){
    if(!model[k]._isModel)
      continue
    if(!(k in overrides)){
      if(model[k].required){
        throw new Error(`Field ${k} is required for data model ${model['_pkgId']}`);
      }
      continue;
    }
    model[k] = overrides[k];
  }
  return model;
}

const makeDataPackage = (model, pkgData) => {
  const res = overrideFields(structuredClone(model), pkgData);
  if("_pkgId" in res) delete res["_pkgId"]
  return res;
}

const DATA = {
  TYPE: {
    QUESTION: "question",
    EMOTION: "emotion"
  },
  prepareData: makeDataPackage,
  MODELS: {
    USER: {
      _pkgId: "UserUpdate",
      user: {
        room: makeParam(false, "NO ROOM"),
        role: makeParam(false, "NO ROLE"),
        id: makeParam(true)
      },
      error: {
        code: makeParam(true),
        msg: makeParam(false),
      }
    }
  }
}


module.exports = { CMDS, DATA }