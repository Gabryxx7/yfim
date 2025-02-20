import { CMDS, DATA} from './Definitions.js';
import { User } from './User.js';

class ControlUser extends User{

    setupCallbacks(){
      this.socket.on(CMDS.SOCKET.PROCESS_STOP, (data) => this.onProcessStop(data));
    }

    controlRoom(data){
      const room = data.room;
      console.info("- received control-room message for room: " + room);
      this.sessionManager.createRoom(room, this.socket, Room.TYPE.CONTROL)
      // control_room_list[room] = this.socket;
    }
  
  
    onProcessControl(data){
      const params_room = data.room;
  
      let current_cfg = data.cfg;
      let current_rating = data.topic;
  
      console.info("+ process-control received: ");
      console.log(current_cfg);
      console.log(current_rating);
  
      this.socket.broadcast.to(params_room).emit(CMDS.SOCKET.PROCESS_CONTROL);
    };
  
    onProcessStop(data){
      console.info("- Control process-stop");
      console.log(data);
  
      const params_room = data.room;
      const accident_stop = `${this} Control STOP`;
      this.socket.broadcast.to(params_room).emit(CMDS.SOCKET.PROCESS_STOP, { accident_stop });
    }
  
    onProcessReady(data){
      // const { roomId, userId, rating, record } = data;
      this.sessionManager.onProcessReady(data);
    }
}
export default ControlUser;
  