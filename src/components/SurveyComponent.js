import React, { useEffect, useRef } from "react";
// import 'survey-core/modern.min.css'
// import { surveyJSON } from "../components/Survey_JSON";
// import { surveyJSON } from "../components/Survey_Final";

function SurveyComponent(props) {
    return (
        <Survey className="survey-container" model={props.surveyModel} />
    );
}

export default SurveyComponent;