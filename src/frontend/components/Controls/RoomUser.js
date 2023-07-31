import React from 'react';
import { STAGE, USER, TIMES } from '../../../backend/Definitions.js'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import '@fortawesome/fontawesome-free'
import {library} from '@fortawesome/fontawesome-svg-core'
import {far} from '@fortawesome/free-regular-svg-icons'
import {fas} from '@fortawesome/free-solid-svg-icons'
import {fab} from '@fortawesome/free-brands-svg-icons'
library.add(far,fas,fab);

const StatusIconMap = (status) => {
  const style = 'fa';
  let faIcon = {};
  let compStyle = {};
  switch(status){
    case USER.STATUS.NONE:{
      faIcon = [style, 'x'];
      compStyle= {color: 'red'};
      break;
    }
    case USER.STATUS.IN_SESSION:{
      faIcon = [style, 'clock'];
      compStyle= {color: 'white'};
      break;
    }
    case USER.STATUS.READY:{
      faIcon = [style, 'check'];
      compStyle= {color: 'green'};
      break;
    }
  }
  return <FontAwesomeIcon style={{...compStyle}} icon={faIcon} />
}


function RoomUser(props){
   return(
     <div className="room-user">
       <div className="status"> {StatusIconMap(props.user?.status)}</div>
       <div className="name">{props.user?.name}</div>
     </div>
   )
 }


function RoomUsersList(props){
   return(
      <div className="users-list">
        {props.users?.map((user) => <RoomUser key={user.id} user={user}/>)}
      </div>
   )
 }

 export {RoomUsersList, RoomUser }