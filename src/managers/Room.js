const { SOCKET_CMDS, DATA_TYPES } = require('../managers/SocketCommands')
const { User } = require('../managers/User')
const { console  } = require("../utils/colouredLogger")

class Room{
  static TYPE = {
    CONTROL: "control",
    USER: "user"
  }

  constructor(id, nsio, maxSize=-1, roomType=Room.TYPE.USER) {
    this.id = id;
    this.nsio = nsio;
    this.adapter = this.nsio.adapter.rooms.get(this.id);
    this.roomType = roomType;
    this.size = 0;
    this.maxSize = maxSize;
    this.users = {};

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

  allUsersReady(){
    count = 0;
    total = 0;
    for (const userId in this.users) {
      total += 1;
      if(this.users[userId].ready){
        count += 1;
      }
    }
    return count >= total;
  }

  getUsersRating(){
    const ratings = {}
    for (const userId in this.users) {
      ratings[userId] = this.users[userId].rating;
    }
    return ratings;
  }

  toString(){
    let res = `Users in ${this.id}: [ `;
    for(const k in this.users){
      res += `${k}, `
    }
    res += `]`;
    const key = this.id;
    try{
      // const socketsInRoomStr = Array.from(namespace.adapter.rooms.get(key)).join(', ');
      const socketsInRoomStr = Array.from(this.adapter).join(', ');
      res += `\nIn Socket: ${key} = \{ ${socketsInRoomStr} \}`;
    } catch (error) {
      res += `\nRoom ${key} does not exist in namespace`;
    }
    return res;
  }

  removeUser(user){
    const removed = delete this.users[user.id];
    if(removed){
      this.size -= 1;
      this.onUserLeave(user);
    }
    user.socket.leave(this.id);
    return removed
  }

  addUser(user){
    const res = {code: 1, msg: `User ${user.id} succesfully added to room ${this.id}`}
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
    this.users[user.id] = user;
    user.socket.join(this.id);
    this.adapter = this.nsio.adapter.rooms.get(this.id);
    this.size += 1;
    this.onUserEnter(user);
    if(this.maxSize > 0 && this.size >= this.maxSize){
      console.log(`Room ${this.id} is full, calling onRoomFull(room)`);
      this.onRoomFull(this);
    }
    return res;
  }

  newUser(userId, userType=User.TYPE.NONE){
    this.users[userId] = new User(userId, userType);
    this.size += 1;
    return this.users[userId];
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
  
module.exports = { Room }