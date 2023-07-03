import { createStore, combineReducers } from "redux";
import { sessionReducer, sessionService } from 'redux-react-session';
import { initControlParams, controlParamsReducer } from "./reducers/control-reducer";

// localStorage.getItem("reduxState")
// ? JSON.parse(localStorage.getItem("reduxState"))
// :
const persistedState = {
  rooms: [],
  roomData: {},
  video: true,
  audio: true,
  ...initControlParams
};

const audioReducer = (state = true, action) => {
  switch (action.type) {
    case 'SET_AUDIO':
        return action.audio
    default:
        return state
  }
}

const videoReducer = (state = true, action) => {
  switch (action.type) {
    case 'SET_VIDEO':
        return action.video
    default:
        return state
  }
}
const roomsReducer = (state = [], action) => {
  switch (action.type) {
    case 'ADD_ROOM':
      return [...new Set([...state, action.room])];
    default:
      return state
  }
};
const roomReducer = (state = {}, action) => {
  switch (action.type) {
    case 'SET_ROOM_DATA':
      return {...state, ...action.roomData}
    default:
      return state
  }
};

// Combine Reducers
const reducers = combineReducers({
  controlParams: controlParamsReducer,
  rooms: roomsReducer,
  roomData: roomReducer,
  video: videoReducer,
  audio: audioReducer,
  session: sessionReducer
});


const mapStoreToStorage = () =>{
  if(store != undefined){
    console.log("Stored", store?.getState());
    localStorage.setItem("reduxState", JSON.stringify(store.getState()));
  }
}
const store = createStore(reducers, persistedState);
store.subscribe(mapStoreToStorage);

const validateSession = (session) => {
  console.log("session", session)
  // check if your session is still valid
  return true;
}
const options = { refreshOnCheckAuth: true, driver: 'COOKIES', validateSession };

sessionService.initSessionService(store, options)
  .then(() => console.log('Redux React Session is ready and a session was refreshed from your storage'))
  .catch(() => console.log('Redux React Session is ready and there is no session in your storage'));

export default store;
