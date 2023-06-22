
const { SOCKET_CMDS, DATA_TYPES, NAMESPACES } = require('../managers/SocketCommands');

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
        this.rooms = null;
        this.roomId = null;
        console.log(`Creating ${name} Namespace manager. Namespace: ${this.namespace}`);
    }

    onConnection(socket){
        console.log(`+ New socket connection! ID: ${socket.id}\t Connected to ${this.name} Namespace ${this.namespace}`);
        if(this.onConnectionHandler != null){
            this.onConnectionHandler(socket);
            return;
        }
        if(this.socketClass != null){
            let socketManager = new this.socketClass(socket, this, this.sessionManager);
            console.log(`\t+ Adding new socket manager of class ${socketManager.constructor.name} to ${this.name} connections`)
            this.connections.push();
        }
    }
    connect(){
        return;
    }
}

module.exports = { NamespaceManager }
