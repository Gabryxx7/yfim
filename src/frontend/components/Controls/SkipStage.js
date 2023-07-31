import React from 'react';
import { STAGE } from "../../../backend/Definitions.js"


export default function SkipStage(props){
  const onClick = props.onClick ?? (() => {});
  const stageState = props.stageState ?? {};
  return (
    <div
      className={`primary-button ${stageState?.state == STAGE.STATUS.COMPLETED ? 'disabled': ''}`}
      style={{
        padding: '0.5rem 0rem'
      }}
      onClick={onClick}>
        Skip
    </div>
  );
}
