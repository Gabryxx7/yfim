import { User } from '../backend/User.js';
import ServerSession from '../backend/ServerSession.js';
import console from "../utils/colouredLogger.js";
import { CMDS } from '../backend/Definitions.js'

export default class Room{
  static TYPE = {
    CONTROL: "control",
    USER: "user"
  }

  constructor(id, nsManagers, maxSize=-1, roomType=Room.TYPE.USER) {
    this.id = id;
    if(!Array.isArray(nsManagers)){
      nsManagers = [nsManagers];
    }
    this.nsManagers = nsManagers;
    this.adapter = this.nsManagers[0].nsio.adapter.rooms.get(this.id);
    this.roomType = roomType;
    this.size = 0;
    this.maxSize = maxSize;
    this.users = {};
    this.host = null;
    this.session = new ServerSession(this);

    this.onRoomFull = (room) => {};
    this.onUserLeave = (user) => {};
    this.onUserEnter = (user) => {};
  }

  get [Symbol.toStringTag]() {
    let overTotal = ""
    if(this.maxSize > 0){
      overTotal = "/"+this.maxSize
    }
    return `${this.id} (${this.size}${overTotal})`;
  }


  getData(){
    var data = {};
    try{
      data = {
        id: this.id,
        users: Object.entries(this.users).map(([key, user]) => user.getData()),
        size: this.size,
        maxSize: this.maxSize,
        roomType: this.roomType,
        session: this.session?.getData()
      };
    }catch(error){
      console.error(`Error getting session data: `, error);
    }
    return data;
  }

  emitToRoom(channel, event, data=null){
    if(data != null){
      channel.to(this.id).emit(event, data);
    }
    else{
      channel.to(this.id).emit(event);
    }

  }
  // If `socket` is provided, then the broadcast will be sent from that user's socket
  // So it will notify everyone except for the sender
  notifyRoom(event, data=null, socket=null){
    // const dbg_msg = message?.type ? `Type: ${message?.type}` : `${message}`
    const dbg_msg = data == null ? "NO DATA" : "WITH DATA";
    if(socket != null){
      console.log(`Broadcasting (except sender) ${event} to Room ${this.id}: ${dbg_msg}`);
      this.emitToRoom(socket, event, data);
      return;
    }

    let ns = "";
		console.log(`Broadcasting (to all) ${event} to Room ${this.id}: ${dbg_msg}`);
    for(let nsManager of this.nsManagers){
      ns += `${nsManager.namespace}, `
      this.emitToRoom(nsManager.nsio, event, data);
       // this.chatsManager.to(this.room.id).nsio.emit(event, data)
       // this.controlManager.to(this.room.id).nsio.emit(event, data)
    }
		console.log(`Namespaces broadcasted ${ns}`);
  }

  notifyHost(event, data={}){
    this.host.socket.emit(event, data);
  }

  setUsersStatus(status){
    for (let userId in this.users) {
      this.users[userId].setStatus(status);
    }
    this.notifyRoom(CMDS.SOCKET.ROOM_UPDATE, this.getData());
  }

  allUsersReady(){
    var count = 0;
    var total = 0;
    for (let userId in this.users) {
      total += 1;
      if(this.users[userId].isReady()){
        count += 1;
      }
    }
    return count >= total;
  }

  startSession(){
    this.session.start();
  }

  getUsersRating(){
    const ratings = {}
    for (const userId in this.users) {
      ratings[userId] = this.users[userId].rating;
    }
    return ratings;
  }

  printDebug(){
    console.room(this.toString());
  }

  toString(){
    let prefix = "\t";
    let res = `ROOM ${this.id} `;
    res += `Users: [`;
    let count = 0;
    for(let k in this.users){
      const u = this.users[k];
      res += `\n${prefix} ${++count}. [${u.type}] ${u.name} (socket: ${u.id}) - status: ${u.status},`
    }
    res += `]`;
    const key = this.id;
    try{
      // const socketsInRoomStr = Array.from(namespace.adapter.rooms.get(key)).join(', ');
      this.adapter = this.nsManagers[0].nsio.adapter.rooms.get(this.id);
      const socketsInRoomStr = Array.from(this.adapter).join(', ');
      res += `\n${prefix}In Socket.io room: ${key} = \{ ${socketsInRoomStr} \}`;
    } catch (error) {
      res += `\n${prefix}Room ${key} does not exist in namespace`;
    }
    return res;
  }

  updateHost(){
    var firstUser = this.users[Object.keys(this.users)[0]];
    firstUser.type = User.TYPE.HOST;
    firstUser.notifyClient();
    this.host = firstUser;
  }

  removeUser(user){
    const removed = delete this.users[user.id];
    if(removed){
      this.size -= 1;
      if(this.size > 0){
        this.updateHost();
      }
      this.onUserLeave(user);
    }
    user.socket.leave(this.id);
    return removed
  }

  addUser(user){
    const res = {code: 1, msg: `User ${user.id} ${user.name} succesfully added to room ${this.id}`}
    if(user === null || user === undefined){
      res.code = -2;
      res.msg = `Attempted to add a ${user} user to room ${this.id}`;
      return res;
    }
    if(this.maxSize > 0 && this.size >= this.maxSize){
      res.code = -1;
      res.msg = `Room ${this.id} is full (size ${this.size} >= ${this.maxSize}. Failed to add user ${user.id}`;
      return res;
    }
    if(this.users.hasOwnProperty(user.id)){
      res.code = 0;
      res.msg = `User ${user.id} already in room ${this.id}`;
      return res;
    }
    user.order = this.size;
    this.users[user.id] = user;
    user.socket.join(this.id);
    this.adapter = this.nsManagers[0].nsio.adapter.rooms.get(this.id);
    this.size += 1;
    this.onUserEnter(user);
    if(this.maxSize > 0 && this.size >= this.maxSize){
      console.log(`Room ${this.id} is full, calling onRoomFull(room)`);
      this.onRoomFull(this);
    }
    if(user.name == null){
      user.name = `User_${this.size-1}`;
    }
    user.room = this;
    if(this.size <= 1){
      user.type = User.TYPE.HOST;
      this.host = user;
    }
    else{
      user.type = User.TYPE.GUEST;
    }
    return res;
  }


  getUser(user){
    return this.getUserById(user.id);
  }

  getUserById(userId){
    return this.users[userId];
  }

  getUsersByType(userType){
    const users = [];
    for (let key in this.users) {
      if(this.users[key].type === userType){
        users.push(this.users[key]);
      }
    }
    return users;
  }
}