const { SOCKET_CMDS, DATA_TYPES, NAMESPACES } = require('../managers/SocketCommands');
const { ChatSocket } = require('./ChatSocket');

class ControlSocket extends ChatSocket{
    constructor(socket, manager, sessionManager) {
      super(socket, manager, sessionManager);
    }
  
    setupSocket(){
      this.socket.on(SOCKET_CMDS.DISCONNECT.cmd, () => this.disconnect());
      this.socket.on(SOCKET_CMDS.SURVEY_CONNECT.cmd, (data) => this.surveyConnect(data));
      this.socket.on(SOCKET_CMDS.DATA_CONNECT.cmd, () => this.dataConnect());
      this.socket.on(SOCKET_CMDS.SURVEY_START.cmd, (data) => this.surveyStart(data));
      this.socket.on(SOCKET_CMDS.SURVEY_END.cmd, (data) => this.surveyEnd(data));
      this.socket.on(SOCKET_CMDS.RESET.cmd, (data) => this.reset(data));
      this.socket.on(SOCKET_CMDS.FACE_DETECTED.cmd, (data) => this.onFaceDetected(data));
      this.socket.on(SOCKET_CMDS.PROCESS_CONTROL.cmd, (data) => this.onProcessControl(data));
      this.socket.on(SOCKET_CMDS.PROCESS_READY.cmd, (data) => this.onProcessReady(data));
      this.socket.on(SOCKET_CMDS.PROCESS_STOP.cmd, (data) => this.onProcessStop(data));
      this.socket.on(SOCKET_CMDS.DATA_SEND.cmd, (data_get) => this.onDataSend(data_get));
      this.socket.on(SOCKET_CMDS.CONTROL.cmd, (data) => this.onControl(data));
    }
  
    controlRoom(data){
      const room = data.room;
      console.log("- received control-room message for room: " + room);
      this.sessionManager.addRoom(room, this.socket, Room.TYPE.CONTROL)
      // control_room_list[room] = this.socket;
    }
  
  
    onProcessControl(data){
      const params_room = data.room;
  
      let current_cfg = data.cfg;
      let current_rating = data.topic;
  
      console.log("+ process-control received: ");
      console.log(current_cfg);
      console.log(current_rating);
  
      this.socket.broadcast.to(params_room).emit(SOCKET_CMDS.PROCESS_CONTROL.cmd);
    };
  
    onProcessStop(data){
      console.log("- process-stop");
      console.log(data);
  
      const params_room = data.room;
      this.socket.broadcast.to(params_room).emit(SOCKET_CMDS.PROCESS_STOP.cmd);
    }
  
    onProcessReady(data){
      // const { roomId, userId, rating, record } = data;
      this.sessionManager.onProcessReady(data);
    }
}
module.exports = { ControlSocket }
  