import hash from "object-hash";
import NamespaceManager from '../backend/NamespaceManager.js';
import { CMDS, STAGE, TIMES } from './Definitions.js';
import { User } from './User.js';
import ControlUser from './ControlUser.js';
import console from "../utils/colouredLogger.js";
import fs from "fs";


class SessionManager {
  constructor(sio) {
    this.sio = sio;
    this.started = false;
    this.chatsManager = new NamespaceManager(this.sio, "Chat", CMDS.NAMESPACES.CHAT, this, User);
    this.controlManager = new NamespaceManager(this.sio, "Control", CMDS.NAMESPACES.CONTROL, this, ControlUser, (socket) => {
      // Making sure the control room gets the session's data even if it just started (or after refresh)
      console.log("Control room connected!")
      socket.on(CMDS.SOCKET.CONTROL_ROOM, (data) => {
        socket.emit(CMDS.SOCKET.SESSION_UPDATE, this.chatsManager.getData());

      })
      socket.on(CMDS.SOCKET.CONTROL_ROOM_SETTINGS_UPDATE, (data) => {
        console.log("Received settings update data: ",data)
        const uploadDir = "data/";
				if (!fs.existsSync(uploadDir)) {
					fs.mkdirSync(uploadDir);
				}
			  fs.writeFileSync(uploadDir+ data.filename, JSON.stringify(data.data, null, 3));
      });
    });
    this.chatsManager.onRoomCreated = (room) => {
      console.log("New Room Created, Adding to Control Users ", room.id);
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