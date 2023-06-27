import React, { useEffect, useState } from "react";
import io from "socket.io-client";
import { surveyJSON } from "../components/Survey_JSON";
import { survey_Final } from "../components/Survey_Final";
import * as Survey from "survey-react";
import "survey-react/survey.css";
import SurveyIntro from "../components/SurveyIntro";
import SurveyFaceDetect from "../components/SurveyFaceDetect";
import SurveyOngoing from "../components/SurveyOngoing";
import SurveyReady from "../components/SurveyReady";
import SurveyThankyou from "../components/SurveyThankyou";
import { SOCKET_CMDS, DATA_TYPES, NAMESPACES } from '../managers/SocketCommands'
// survey-react : https://www.npmjs.com/package/survey-react

function SurveyPage(props) {
  const [surveyOn, setSurveyOn] = useState(false);
  const [faceOn, setFaceOn] = useState(false);
  const [ready, setReady] = useState(false);
  const [stage, setStage] = useState(1);
  const [final_stage, setFinalStage] = useState(false);
  const { room, user } = props.match.params;
  const [answer, setAnswer] = useState([]);
  const [socket_s, setSocket] = useState();
  const [process, setProcess] = useState(false);
  const [loading, setLoading] = useState(false);

  // socket event, room-idle, survey start and ending, process start and stop
  useEffect(() => {
    const socket = io.connect(`/${NAMESPACES.CONTROL}`);
    console.log(`SURVEY PAGE HERE, connecting to ${socket?.nsp}`)
    socket.emit(SOCKET_CMDS.SURVEY_CONNECT, {
      room: props.match.params.room,
      user: props.match.params.user,
    });
    socket.on(SOCKET_CMDS.ROOM_IDLE, () => {
      console.log("room is idle now");
      resetParams();
    });
    socket.on(SOCKET_CMDS.SURVEY_START, (data) => {
      const { stage } = data;

      if (stage == 3 || stage == 4) {
        setSurveyOn(true);
        setFinalStage(true);
      } else {
        setSurveyOn(true);
      }
      setStage(stage + 1);
    });
    socket.on(SOCKET_CMDS.FACE_DETECTED, () => {
      console.log("face detected");
      setFaceOn(true);
    });
    socket.on(SOCKET_CMDS.PROCESS_START, () => {
      console.log("process start");
      setReady(false);
      setProcess(true);
    });
    socket.on(SOCKET_CMDS.PROCESS_STOP, (data) => {
      const { accident_stop } = data;
      console.info("- Survey page process-stop", accident_stop);
      if (!accident_stop) {
        console.log(SOCKET_CMDS.PROCESS_STOP, answer);
        socket.emit(SOCKET_CMDS.DATA_SEND, {
          data_type: DATA_TYPES.QUESTION,
          room,
          user,
          data: answer,
        });
        setLoading(true);
        setTimeout(() => {
          setLoading(false);
        }, 20000);
      }

      setAnswer([]);
      resetParams();
    });
    socket.on(SOCKET_CMDS.RESET, () => {
      resetParams();
    });
    setSocket(socket);
  }, []);

  function resetParams() {
    setStage(1);
    setSurveyOn(false);
    setFinalStage(false);
    setFaceOn(false);
    setProcess(false);
    setReady(false);
  }

  function sendReadyToServer(data) {
    const { rating, record } = data;
    console.log("select rating, ", rating);
    console.log("select record", record);
    socket_s.emit(SOCKET_CMDS.PROCESS_READY, { room, user, rating, record });
    setReady(true);
  }
  // socket.join(props.match.params.room);
  // Need to move this to control panel

  // Survey.StylesManager.applyTheme("winter");
  const model = new Survey.Model(survey_Final);
  const final_model = new Survey.Model(survey_Final);

  function sendDataToServer(survey) {
    //   callback function

    setSurveyOn(false);
    setFinalStage(false);
    socket_s.emit(SOCKET_CMDS.SURVEY_END, {
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

  return (
    <div
      style={{
        backgroundColor: "black",
        height: "100%",
      }}
    >
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
export default SurveyPage;
