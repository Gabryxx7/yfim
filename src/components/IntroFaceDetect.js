import React, { useEffect, useState } from "react";

export default function IntroFaceDetect(props) {
  const userRole = props.userRole != undefined ? props.userRole : "";
  return (
    <div className="topic introfacedetect-topic">
      <p className="topic_head">YOUR FACE IS MUTED</p>
      <p className="topic_text">
        
      </p>
    </div>
  );
}
