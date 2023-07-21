import React, { useEffect, useState } from "react";
import io from "socket.io-client";
import { survey_Final } from "../../assets/Survey_Final.js";
import * as Survey from "survey-react";
import "survey-react/survey.css";
import SurveyIntro from "../components/SurveyIntro.js";
import SurveyFaceDetect from "../components/SurveyFaceDetect.js";
import SurveyOngoing from "../components/SurveyOngoing.js";
import SurveyReady from "../components/SurveyReady.js";
import SurveyThankyou from "../components/SurveyThankyou.js";
import { CMDS, DATA, TIMES} from '../managers/Definitions.js'
// survey-react : https://www.npmjs.com/package/survey-react

export default function SurveyPage(props) {
  const embedded = props.embedded ?? true; // Whether the events come from a root page (such as the media container) or directly from the socket
  const sessionStatusRef = props.sessionStatusRef ?? "NONE";
  const [surveyOn, setSurveyOn] = useState(false);
  const [faceOn, setFaceOn] = useState(false);
  const [ready, setReady] = useState(false);
  const [stage, setStage] = useState(1);
  const [final_stage, setFinalStage] = useState(false);
  const room = props.room ?? "NO ROOM";
  const user = props.match ?? "NO USER";
  const [answer, setAnswer] = useState([]);
  const [socket, setSocket] = useState();
  const [process, setProcess] = useState(false);
  const [loading, setLoading] = useState(false);

  const setupSocket = () => {
    const socket = io.connect(`/${CMDS.NAMESPACES.CONTROL}`);
    console.log(`SURVEY PAGE HERE, connecting to ${socket?.nsp}`)
    socket.emit(CMDS.SOCKET.SURVEY_CONNECT, {
      room: room,
      user: user,
    });
    socket.on(CMDS.SOCKET.ROOM_IDLE, () => resetParams());
    socket.on(CMDS.SOCKET.SURVEY_START, (data) => onSurveyStart(data));
    socket.on(CMDS.SOCKET.FACE_DETECTED, () => setFaceOn(true));
    socket.on(CMDS.SOCKET.PROCESS_START, () => onProcessStart());
    socket.on(CMDS.SOCKET.PROCESS_STOP, (data) => onProcessStop(data));
    socket.on(CMDS.SOCKET.RESET, () => resetParams());
    setSocket(socket);
  }

  const onProcessStart = () => {
    console.log("process start");
    setReady(false);
    setProcess(true);
  }

  const onSurveyStart = (data) => {
    const { stage } = data;

    if (stage == 3 || stage == 4) {
      setSurveyOn(true);
      setFinalStage(true);
    } else {
      setSurveyOn(true);
    }
    setStage(stage + 1);
  }


  const onProcessStop = (data) => {
    const { accident_stop } = data;
    console.info("- Survey page process-stop", accident_stop);
    if (!accident_stop) {
      console.log(CMDS.SOCKET.PROCESS_STOP, answer);
      socket.emit(CMDS.SOCKET.DATA_SEND, {
        data_type: DATA.TYPE.QUESTION,
        room,
        user,
        data: answer,
      });
      setLoading(true);
      setTimeout(() => {
        setLoading(false);
      }, TIMES.PROCESS_STOP_WAIT);
    }

    setAnswer([]);
    resetParams();
  }

  const resetParams = () => {
    setStage(1);
    setSurveyOn(false);
    setFinalStage(false);
    setFaceOn(false);
    setProcess(false);
    setReady(false);
  }

  const sendReadyToServer = (data) => {
    const { rating, record } = data;
    console.log("select rating, ", rating);
    console.log("select record", record);
    socket.emit(CMDS.SOCKET.PROCESS_READY, { room, user, rating, record });
    setReady(true);
  }
  // socket.join(props.match.params.room);
  // Need to move this to control panel

  // Survey.StylesManager.applyTheme("winter");
  const model = new Survey.Model(survey_Final);
  const final_model = new Survey.Model(survey_Final);

  const sendDataToServer = (survey) => {
    //   callback function

    setSurveyOn(false);
    setFinalStage(false);
    socket.emit(CMDS.SOCKET.SURVEY_END, {
      room,
      user,
      survey,
    });
    let submit_time = new Date().getTime();
    let result = {
      submit_time,
      result: survey.data,
    };
    let curr_answer = answer;
    curr_answer.push(result);
    setAnswer(curr_answer);
    console.log("get answer, ", answer, survey.data);
  }

  // socket event, room-idle, survey start and ending, process start and stop
  useEffect(() => {
    if(!embedded){
      setupSocket();
    }
  }, []);

  useEffect(() => {
    console.log("SESION STATUS REF UPDATE: ", sessionStatusRef);
    switch(sessionStatusRef.update){
      case CMDS.SOCKET.ROOM_IDLE: {
        resetParams();
        break;
      }
      case CMDS.SOCKET.SURVEY_START: {
        onSurveyStart(sessionStatusRef.data);
        break;
      }
      case CMDS.SOCKET.FACE_DETECTED: {
        setFaceOn(true);
        break;
      }
      case CMDS.SOCKET.PROCESS_START: {
        onProcessStart();
        break;
      }
      case CMDS.SOCKET.PROCESS_STOP: {
          onProcessStop(sessionStatusRef.data);
        break;
      }
      case CMDS.SOCKET.RESET: {
        resetParams();
        break;
      }
      }
  }, [sessionStatusRef]);

  return (
    <div
      style={{
        backgroundColor: "black",
        height: "100%",
      }}>
      {!faceOn && !process && !surveyOn && !loading && <SurveyIntro />}

      {faceOn && !process && !surveyOn && !loading && !ready && (
        <SurveyFaceDetect handler={sendReadyToServer} />
      )}
      {!process && ready && <SurveyReady />}
      {process && !surveyOn && <SurveyOngoing stage={stage} />}
      {loading && <SurveyThankyou />}

      {surveyOn && !final_stage && (
        <Survey.Survey
          model={model}
          isExpanded={true}
          onComplete={sendDataToServer}
        />
      )}
      {surveyOn && final_stage && (
        <Survey.Survey
          model={final_model}
          isExpanded={true}
          onComplete={sendDataToServer}
        />
      )}
    </div>
  );
}

