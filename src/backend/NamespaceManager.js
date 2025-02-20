
import { CMDS, DATA} from './Definitions.js';
import Room from './Room.js';
import { User } from './User.js';
import console from "../utils/colouredLogger.js";

class NamespaceManager {
    constructor(sio, name, namespace, sessionManager, userClass=null, onConnectionHandler=null) {
        this.sio = sio;
        this.name = name;
        this.namespace = namespace;
        this.sessionManager = sessionManager;
        this.userClass = userClass;
        this.onConnectionHandler = onConnectionHandler;
        this.started = false;
        this.connections = []
        this.nsio = this.sio.of(this.namespace);
        this.nsio.on("connection", (socket) => this.onConnection(socket));
        this.onRoomCreated = () => {};
        this.onRoomDeleted= () => {};
        this.rooms = {}
        console.log(`Creating ${name} Namespace manager. Namespace: ${this.namespace}`);
    }

    onConnection(socket){
        console.info(`+ New socket connection! ID: ${socket.id}\t Connected to ${this.name} Namespace ${this.namespace}`);
        socket.emit(CMDS.SOCKET.HELLO);
        if(this.onConnectionHandler != null){
            this.onConnectionHandler(socket);
        }
        if(this.userClass != null){
            let socketManager = new this.userClass(socket, this);
            console.info(`\t+ Adding new socket manager of class ${socketManager.constructor.name} to ${this.name} connections`)
            this.connections.push(socketManager);
        }
    }
    connect(){
        return;
    }

    getData(){
        const roomsData = {};
        for(let key in this.rooms){
            roomsData[key] = this.rooms[key].getData("Namespace getData()");
        }
        return {
            namespace: this.namespace,
            rooms: roomsData
        }
    }

    createRoom(roomId){
        // this.rooms[roomId] = new Room(roomId, this.nsio, 2);
        this.rooms[roomId] = new Room(roomId, [this, this.sessionManager.controlManager]);
        this.rooms[roomId].onRoomFull = (room) => {
            // console.info(`Starting session on room ${room.id}`);
            // this.sessionManager.startSession(room);
        } 
        console.info("+ new room created: " + roomId);
        // this.resetRoom(roomId);
        this.onRoomCreated(this.rooms[roomId]);
        return this.rooms[roomId];
    }


    deleteRoom(room){
        if(this.rooms[room.id].size > 0){
            console.error(`ERROR: Deleting NON empty room ${room.id}`);
            return;
        }
        this.onRoomDeleted(this.rooms[room.id]);
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
