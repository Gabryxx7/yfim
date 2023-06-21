
const { SOCKET_CMDS, DATA_TYPES, NAMESPACES } = require('../managers/SocketCommands');

class ProjectionManager {
  constructor(sio, sessionManager) {
    this.sio = sio;
    this.sessionManager = sessionManager;
    this.started = false;
    this.connections = []
    this.namespace = NAMESPACES.projection;
    this.nsio = this.sio.of(this.namespace);
    this.nsio.on("connection", (socket) => {
      socket.join(SOCKET_CMDS.PROJECTION_TEST.cmd);
    
      socket.on(SOCKET_CMDS.PROJECTION_CONNECT.cmd, (data) => {
        const { room, user } = data;
        // socket.join("projection-" + room);
        console.log(    '+ a projection was connected in room: " ' + room + ", user: " + user
        );
      });
    })
  }
}

module.exports = { ProjectionManager }