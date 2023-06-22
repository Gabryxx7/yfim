
const SOCKET_CMDS = {
  NONE:         {id: -1,  cmd: "NONE", callbacks: []},
  RESET:      {id: 8,   cmd: "reset", callbacks: []},
  CONNECT:      {id: 0,   cmd: "connect", callbacks: []},
  DISCONNECT:   {id: 1,   cmd: "disconnect", callbacks: []},
  ACCEPT:       {id: 2,   cmd: "accept", callbacks: []},
  REJECT:       {id: 3,   cmd: "reject", callbacks: []},
  AUTH:         {id: 3,   cmd: "auth", callbacks: []},
  FIND_ROOM:    {id: 9,   cmd: "find-room", callbacks: []},
  CREATE_ROOM:  {id: 4,   cmd: "create-room", callbacks: []},
  JOIN_ROOM:    {id: 5,   cmd: "join-room", callbacks: []},
  LEAVE_ROOM:   {id: 6,   cmd: "leave-room", callbacks: []},
  ROOM_FULL:    {id: 7,   cmd: "room-full", callbacks: []},
  ROOM_IDLE:    {id: 7,   cmd: "room-idle", callbacks: []},
  APPROVE:      {id: 8,   cmd: "approve", callbacks: []},
  MESSAGE:      {id: 8,   cmd: "message", callbacks: []},
  BRIDGE:      {id: 8,   cmd: "bridge", callbacks: []},
  HANGUP:      {id: 8,   cmd: "hangup", callbacks: []},
  CONTROL_ROOM:      {id: 8,   cmd: "control-room", callbacks: []},
  SURVEY_CONNECT:      {id: 8,   cmd: "survey-connect", callbacks: []},
  SURVEY_START:      {id: 8,   cmd: "survey-start", callbacks: []},
  SURVEY_END:      {id: 8,   cmd: "survey-end", callbacks: []},
  FACE_DETECTED:      {id: 8,   cmd: "face-detected", callbacks: []},
  DATA_CONNECT:      {id: 8,   cmd: "data-connect", callbacks: []},
  PROCESS_READY:      {id: 8,   cmd: "process-ready", callbacks: []},
  PROCESS_START:      {id: 8,   cmd: "process-start", callbacks: []},
  PROCESS_CONTROL:      {id: 8,   cmd: "process-control", callbacks: []},
  PROCESS_STOP:      {id: 8,   cmd: "process-stop", callbacks: []},
  DATA_SEND:      {id: 8,   cmd: "data-send", callbacks: []},
  CONTROL:      {id: 8,   cmd: "control", callbacks: []},
  PROJECTION_TEST:      {id: 8,   cmd: "projection-test", callbacks: []},
  PROJECTION_CONNECT:      {id: 8,   cmd: "projection-connect", callbacks: []},
  STAGE_CONTROL:      {id: 8,   cmd: "stage-control", callbacks: []}
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