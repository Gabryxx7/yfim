const { SOCKET_CMDS, DATA_TYPES } = require('../managers/SocketCommands')

/** 
 * For this specific project there will only be two users at any time in one room:
 * - A host user with a generic "host" id 
 * - A guest user with a generic "guest" id
 * Obviously the "User.Type" field is not really needed but just in case we'd like to expand this project to have more people in one room... 
 * **/
class User {
    TYPE = {
      NONE: "none",
      HOST: "host",
      GUEST: "guest"
    }
    constructor(id, userType) {
      this.id = id;
      this.userType = userType;
      this.ready = false;
      this.rating = null;
      this.record = null;
      this.data = {}
      for (const dType in DATA_TYPES) {
        this.data[dType] = {
          ready: false,
          content: null
        }
      }
    }
}

  module.exports = { User }  