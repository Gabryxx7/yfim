import React from "react";
import { Model } from "survey-core";
import { Survey } from "survey-react-ui";
import "survey-core/defaultV2.min.css";
// import 'survey-core/modern.min.css'
import "../survey.scss";
// import { surveyJSON } from "../components/Survey_JSON";
// import { surveyJSON } from "../components/Survey_Final";
import { surveyJSON } from "../../assets/PostChatSurvey";

function SurveyComponent() {
    const survey = new Model(surveyJSON);
    survey.onComplete.add((sender, options) => {
        console.log(JSON.stringify(sender.data, null, 3));
    });
    return (<Survey className="survey-container" model={survey} />);
}

export default SurveyComponent;