import hash from "object-hash";
import NamespaceManager from '../backend/NamespaceManager.js';
import { CMDS, STAGE, TIMES } from './Definitions.js';
import { User } from './User.js';
import ControlUser from './ControlUser.js';
import console from "../utils/colouredLogger.js";

class SessionManager {
  constructor(sio) {
    this.sio = sio;
    this.started = false;
    this.chatsManager = new NamespaceManager(this.sio, "Chat", CMDS.NAMESPACES.CHAT, this, User);
    this.controlManager = new NamespaceManager(this.sio, "Control", CMDS.NAMESPACES.CONTROL, this, ControlUser, (socket) => {
      // Making sure the control room gets the session's data even if it just started (or after refresh)
      socket.emit(CMDS.SOCKET.SESSION_UPDATE, this.chatsManager.getData());
    });
    this.chatsManager.onRoomCreated = (room) => {
      console.log("New Room Created, Joining Control Users ", room.id, this.controlManager.connections);
      for(let conn of this.controlManager.connections){
        conn.socket.join(room.id);
      }
    };
    this.projectionManager = new NamespaceManager(this.sio, "Projection", CMDS.NAMESPACES.PROJECTION, this, null, (socket) => {
      socket.join(CMDS.SOCKET.PROJECTION_TEST);
      socket.on(CMDS.SOCKET.PROJECTION_CONNECT, (data) => {
        const { room, user } = data;
        // socket.join("projection-" + room);
        console.log(    '+ a projection was connected in room: " ' + room + ", user: " + user
        );
      });
    });
  }
}



export default SessionManager;