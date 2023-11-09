import React, { Component, useEffect, useRef, useState } from "react";
import { useParams } from 'react-router-dom';
import TextField from '@mui/material/TextField';
import { Model } from "survey-core";
import { Survey } from "survey-react-ui";
import "survey-core/defaultV2.min.css";
import { AVAILABLE_SURVEYS, SURVEY_CSS_CLASSES, updateSurveyClasses } from "../../assets/PostChatSurvey.js";
import { CMDS, DATA, STAGE } from "../backend/Definitions.js";
import VideoContainer from "../frontend/containers/VideoContainer.js";
import {FaceProcessor} from "../frontend/classes/FaceProcessor.js";
import {FaceMaskSelector} from "../frontend/components/Controls/FaceMaskSelector.js";
import {RecordingControls} from "../frontend/components/Controls/RecordingControls.js";
import io from "socket.io-client";


function SessionDataInput(props) {

}

function FaceVideoTest(props) {
  const [userMedia, setUserMedia] = useState(null);
	const controlSocket = useRef(null);
	const [faceProcessor, setFaceProcessor] = useState(null);
  const [recording, setRecording] = useState(false);
	const [stageData, setStageData] = useState({type: STAGE.TYPE.VIDEO_CHAT, sessionId: "testSession"});
	const [userData, setUserData] = useState({name: "faceTest"});
  const sessionDataFields = <div>
      <TextField variant="standard" value={userData?.name} color="secondary" onChange={(e) => setUserData((prev) => ({...prev, name: e.target.value}))} />
      <TextField variant="standard" value={stageData?.sessionId} color="secondary" onChange={(e) => setStageData((prev) => ({...prev, sessionId: e.target.value}))} />
  </div>
  // const recordControls = <RecordingControls recording={recording} onClick={() => setRecording(!recording)} />

  useEffect(() => {
		setFaceProcessor(new FaceProcessor());
		controlSocket.current = io.connect(`/${CMDS.NAMESPACES.CONTROL}`);
		console.log(`Created Socket: `,controlSocket.current);
		controlSocket.current.on(CMDS.SOCKET.CONNECT, (data) => {
			console.log("Control Socket connected");
		})
		controlSocket.current.on(CMDS.SOCKET.CONNECT_ERROR, (err) => {
		  console.log(`connect_error due to ${err.message}`);
		});
	}, []);

  return (
    <div
      style={{
        width: '100vw',
        display: 'block',
        position: 'relative',
        height: '100vh'
      }}>
      <div className="face-mask-controls">
        <FaceMaskSelector faceProcessor={faceProcessor} socket={controlSocket}/>
        <div>{sessionDataFields}</div>
      </div>
      <VideoContainer
        // customVideoActions={[sessionDataFields]}
				audioEnabled={false}
				micEnabled={false}
				videoEnabled={true}
				recordingEnabled={true}
        recording={recording}
        userData={userData}
				stageData={stageData}
				// socket={socket}
				onStreamAdded={() => {
					setBridge(CMDS.RTC.STATUS.ESTABLISHED)
				}}
				onRemotePlay={() => {
				}}
				// connectionStatus={connectionStatus}
				// rtcManager={RTCManager}
				faceProcessor={faceProcessor} />
    </div>
  );
}

function SurveyTest(props) {
  const [surveyModel, setSurveyModel] = useState(null)
  const params = useParams();
  const surveyId = params.survey_id ?? props.surveyId ?? AVAILABLE_SURVEYS.TEST.surveyId;

  useEffect(() => {
    console.log(`SURVEY ID: `, surveyId);
    console.log(`SURVEYS available `, AVAILABLE_SURVEYS);
    try{
      const newSurvey = new Model(AVAILABLE_SURVEYS[surveyId].model);
      newSurvey.onComplete.add((sender, options) => {
        console.log(JSON.stringify(sender.data, null, 3));
      })
      newSurvey.onAfterRenderSurvey.add(() => {console.log("SURVEY RENDERED")});
      // newSurvey.css = SURVEY_CSS_CLASSES;

      newSurvey.onUpdateQuestionCssClasses.add(updateSurveyClasses);
      newSurvey.onUpdatePageCssClasses.add(updateSurveyClasses);
      newSurvey.onUpdatePanelCssClasses.add(updateSurveyClasses);

      setSurveyModel(newSurvey);
    }
    catch(error){
      console.warn(`Could not find survey with ID ${surveyId}`, error);
    }
  }, [])

  return (
    <div>
		  {surveyModel != null && <Survey className="survey-container" model={surveyModel} /> }
    </div>
  );
}


export { FaceVideoTest, SurveyTest};