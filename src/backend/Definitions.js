
import { AVAILABLE_SURVEYS } from "../../assets/PostChatSurvey.js";

const KEY_SHORTCUTS = {
  ENABLE_SHORTCUTS: { keyName: 'F1', keyCode: 'F1', name: 'Enable/Disable shortcuts', icon: null},
  MUTE_VIDEO:       { keyName: 'V', keyCode: 'KeyV', name: 'Toggle video', icon: null},
  MUTE_SELF:        { keyName: 'M', keyCode: 'KeyM', name: 'Toggle Mic', icon: null},
  MUTE_OTHERS:      { keyName: 'Q', keyCode: 'KeyQ', name: 'Toggle guest audio', icon: null},
  TOGGLE_RECORDING: { keyName: 'R', keyCode: 'KeyR', name: 'Toggle recording', icon: null},
  SHOW_DEBUG:       { keyName: 'D', keyCode: 'KeyD', name: 'Toggle debug commands', icon: null},
  SKIP_STAGE:       { keyName: 'S', keyCode: 'KeyS', name: 'Skip stage', icon: null},
  PAUSE_TIMER:      { keyName: 'P', keyCode: 'KeyP', name: 'Pause Timer', icon: null},
}

const ROUTES = {
  ROOM: {
    name: "Rooms",
    path: "/room/:room_id/",
    description: "Generic chat room with id 'room_id'. The room ID is extracted from the URL request sent to the server. The server then creates a new room on the backend with the extracted ID.",
  },
  CONTROL: {
    name: "Control Room",
    path: "/control/",
    description: "Control room with an overview of all running rooms and their status and list of participants",
  },
  FACE_API_TEST: {
    name: "Face API Video Test",
    path: "/faceTest/",
    description: "A simple page to test the face API in its face processor component (camera is initially disabled, enable it from the top left toolbar)",
  },
  SURVEY_TEST: {
    name: "Surveys Test",
    path: "/surveyTest/:survey_id",
    description: `A simple page to test a survey given its id. Available 'survey_id's are: ${Object.keys(AVAILABLE_SURVEYS)}`,
  },
}


const QUESTION = {
  TYPE: {
    ICEBREAKER: "icebreaker",
    QUEST_CATEGORIES: "quest_categories",
    QUEST: "quest",
    WOULDYOU: "wouldyou"
  },
  CATEGORY: {
    KIDS: "kids",
    MATURE: "mature",
    GENERAL: "general"
  }
}
QUESTION.TYPE.WOULDYOU

const FACEAPI = {
  LANDMARK: {
	  JAWOUTLINE: "JawOutline",
	  LEFTEYEBROW: "LeftEyeBrow",
	  RIGHTEYEBROW: "RightEyeBrow",
	  NOSE: "Nose",
	  LEFTEYE: "LeftEye",
	  RIGHTEYE: "RightEye",
	  MOUTH: "Mouth"
  }
}

const STAGE = {
  TYPE: {
    NONE: 'none',
    VIDEO_CHAT: 'video-chat',
    SURVEY: 'survey'
  },
  STATUS: {
    NONE: "none",
    IN_PROGRESS: "in_progress",
    COMPLETED: "completed"
  }
}

const USER = {
	TYPE: {
		NONE: "none",
		HOST: "host",
		GUEST: "guest",
	},
	STATUS: {
		NONE: "none",
    READY: "ready",
		IN_SESSION: "in_session",
	}
}

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
    USER_UPDATE:   "user-update",
    LEAVE_ROOM:           "leave-room",
    ROOM_IDLE:            "room-idle",
    MESSAGE:              "message",
    BRIDGE:               "bridge",
    HANGUP:               "hangup",
    CONTROL_ROOM:         "control-room",
    SESSION_UPDATE:       "session-update",
    STAGE_COMPLETED:      "stage-completed",
    STEP_COMPLETED:       "step-completed",
    SESSION_COMPLETED:       "step-completed",
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
    TOGGLE_SESSION_PAUSE: "toggle-session-pause",
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

const overrideFields = (model, overrides) => {
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


export { CMDS, DATA, STAGE, FACEAPI, QUESTION, TIMES, USER, ROUTES, KEY_SHORTCUTS }