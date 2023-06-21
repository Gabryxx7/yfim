const { SOCKET_CMDS, DATA_TYPES } = require('../managers/SocketCommands')

class Room{
    TYPE = {
      CONTROL: "control",
      USER: "user"
    }
  
    constructor(id, socket, roomType) {
      this.id = id;
      this.socket = socket;
      this.roomType = roomType;
      this.users = {};
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
      ratings = {}
      for (const userId in this.users) {
        ratings[userId] = this.users[userId].rating;
      }
      return ratings;
    }
  
    getUser(userId){
      return this.users[userId];
    }
  
    addUser(userId, userType=User.TYPE.NONE){
      this.users[userId] = new User(userId, userType);
      return this.users[userId];
    }
  
    getUser(userId, userType=User.TYPE.NONE){
      if(this.users.hasOwnProperty(userId)){
        return this.users[userId];
      }
      return this.addUser(userId, userType);
    }
}
  
module.exports = { Room }