import React, { useEffect, useRef } from "react";

function SurveyComponent(props) {
    return (
        <Survey className="survey-container" model={props.surveyModel} />
    );
}

export default SurveyComponent;