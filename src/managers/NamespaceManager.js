
import { CMDS, DATA} from './Definitions.js';
import Room from '../managers/Room.js';
import User from '../managers/User.js';
import console from "../utils/colouredLogger.js";

class NamespaceManager {
    constructor(sio, name, namespace, sessionManager, socketClass=null, onConnectionHandler=null) {
        this.sio = sio;
        this.name = name;
        this.namespace = namespace;
        this.sessionManager = sessionManager;
        this.socketClass = socketClass;
        this.onConnectionHandler = onConnectionHandler;
        this.started = false;
        this.connections = []
        this.nsio = this.sio.of(this.namespace);
        this.nsio.on("connection", (socket) => this.onConnection(socket));
        this.rooms = {}
        console.log(`Creating ${name} Namespace manager. Namespace: ${this.namespace}`);
    }

    onConnection(socket){
        console.info(`+ New socket connection! ID: ${socket.id}\t Connected to ${this.name} Namespace ${this.namespace}`);
        socket.emit(CMDS.SOCKET.HELLO);
        if(this.onConnectionHandler != null){
            this.onConnectionHandler(socket);
            return;
        }
        if(this.socketClass != null){
            let socketManager = new this.socketClass(socket, this, this.sessionManager);
            console.info(`\t+ Adding new socket manager of class ${socketManager.constructor.name} to ${this.name} connections`)
            this.connections.push();
        }
    }
    connect(){
        return;
    }

    createRoom(roomId){
        // this.rooms[roomId] = new Room(roomId, this.nsio, 2);
        this.rooms[roomId] = new Room(roomId, this.nsio);
        this.rooms[roomId].onRoomFull = (room) => {
            // console.info(`Starting session on room ${room.id}`);
            // this.sessionManager.startSession(room);
        } 
        console.info("+ new room created: " + roomId);
        // this.resetRoom(roomId);
        return this.rooms[roomId];
    }


    deleteRoom(room){
        if(this.rooms[room.id].size > 0){
            console.error(`ERROR: Deleting NON empty room ${room.id}`);
            return;
        }
        delete this.rooms[room.id];
    }

    getRoom(roomId){
        if(this.rooms.hasOwnProperty(roomId)){
            return this.rooms[roomId];
        }
        return null;
    }

}

export default NamespaceManager;
