
const { SOCKET_CMDS, DATA_TYPES, NAMESPACES } = require('../managers/SocketCommands');
const { Room } = require('../managers/Room')
const { User } = require('../managers/User')
const { console  } = require("../utils/colouredLogger")

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
        socket.emit(SOCKET_CMDS.HELLO.cmd);
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
        this.rooms[roomId] = new Room(roomId, this.nsio, 2);
        this.rooms[roomId].onRoomFull = (room) => {
            // console.info(`Starting session on room ${room.id}`);
            // this.sessionManager.startSession(room);
        } 
        console.info("+ new room created: " + roomId);
        // this.resetRoom(roomId);
    }

    resetRoom(roomId){
        this.rooms[roomId].addUser(User.TYPE.HOST);
        this.rooms[roomId].addUser(User.TYPE.GUEST);
    }

    removeUserFromRoom(user){
        if(user.roomId === null || !this.rooms.hasOwnProperty(user.roomId)){
            console.warn(`Cannot remove user ${user.userId} from room ${user.roomId}: Room does not exist`)
            return false;
        }

        const removed = this.rooms[user.roomId].removeUser(user);
        if(!removed){
            console.warn(`Cannot remove user ${user.userId} from room ${user.roomId}: USer not in room`)
            return false;
        }

        if(this.rooms[user.roomId].size <= 0){
            console.warn(`Deleting empty room ${user.roomId}`);
            delete this.rooms[user.roomId];
        }
    }

    findUserRoom(user){
        // const sr = this.nsio.adapter.rooms.get(this.roomId);
        if(!this.rooms.hasOwnProperty(user.roomId)){
            this.createRoom(user.roomId);
        }
        const room = this.rooms[user.roomId];
        const added = room.addUser(user);
        console.warn(`Adding user ${user.userId} to room ${user.roomId}: ${added.code} = '${added.msg}`);
        console.warn(room.toString())

        // const sr = this.rooms.get(roomId);
        // if(sr === undefined || sr === null){
        // }
        // if(sr !== undefined){
        //     console.log(`Sockets in room ${sr.toString()}`)
        // }
        // // Double check that the size should be 1 or 2, i would assume we need two clients in a room but it does not seem to be the case
        // if (sr === undefined || sr.size < 2) {
        //     this.joinRoom(this.roomId, (sr === undefined))
        // } else {
        //     // max two clients
        //     this.socket.emit(SOCKET_CMDS.ROOM_FULL.cmd, this.roomId);
        //     console.info("- room (" + this.roomId + ") exists but is full");
        // }
        // this.printRooms(this.manager.nsio);
    }

}

module.exports = { NamespaceManager }
