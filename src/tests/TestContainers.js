import React, { Component, useEffect, useRef, useState } from "react";
import { Model } from "survey-core";
import { Survey } from "survey-react-ui";
import "survey-core/defaultV2.min.css";
import { SURVEYS, SURVEY_CSS_CLASSES, updateSurveyClasses } from "../../assets/PostChatSurvey.js";
import VideoContainer from "../frontend/containers/VideoContainer.js";
import {FaceProcessor} from "../frontend/classes/FaceProcessor.js";
import {FaceMaskSelector} from "../frontend/components/Controls/FaceMaskSelector.js";
import {RecordingControls} from "../frontend/components/Controls/RecordingControls.js";


function FaceVideoTest(props) {
  const [userMedia, setUserMedia] = useState(null);
	const [faceProcessor, setFaceProcessor] = useState(null);
  const [recording, setRecording] = useState(false);
  const maskSelector = <FaceMaskSelector faceProcessor={faceProcessor}/>
  // const recordControls = <RecordingControls recording={recording} onClick={() => setRecording(!recording)} />

  useEffect(() => {
		setFaceProcessor(new FaceProcessor());
	}, []);

  return (
    <div
      style={{
        width: '100vw',
        display: 'block',
        position: 'relative',
        height: '100vh'
      }}>
        
      <VideoContainer
        customVideoActions={[maskSelector]}
				recordingEnabled={true}
        recording={recording}
				// stageData={stageData}
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
  const surveyId = props.match.params.surveyId ?? props.surveyId ?? SURVEYS.TEST.surveyId;

  useEffect(() => {
    console.log(`SURVEY ID: `, surveyId);
    console.log(`SURVEYS available `, SURVEYS);
    try{
      const newSurvey = new Model(SURVEYS[surveyId].model);
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