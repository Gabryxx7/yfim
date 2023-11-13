import React, { Component, useEffect, useRef, useState } from "react";
import { useParams } from 'react-router-dom';
import { Model } from "survey-core";
import { Survey } from "survey-react-ui";
import "survey-core/defaultV2.min.css";
import { AVAILABLE_SURVEYS, SURVEY_CSS_CLASSES, updateSurveyClasses } from "../../../assets/PostChatSurvey.js";
import { CMDS, DATA, STAGE } from "../../backend/Definitions.js";
import io from "socket.io-client";


export default function SurveyTest(props) {
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
    <>
		  {surveyModel != null && <Survey className="survey-container" model={surveyModel} /> }
    </>
  );
}