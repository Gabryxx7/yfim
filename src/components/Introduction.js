import React, { useEffect, useState } from "react";

export default function Introduction(props) {
  const userRole = props.userRole != undefined ? props.userRole : "";
  return (
    <div className="topic intro-topic">
      <p className="topic_head">YOUR FACE IS MUTED</p>
      <p className="topic_text">
        {(() => {
          if(state == "main"){
            return(<>
              <i>Your Face is Muted</i> explores how a lack of non-verbal cues
                <br />
                affects critical conversations and our ability to empathise.
                <br />
                <br />
                This is a two person experience. Please take a seat and wait
                <br />
                for your conversation partner.
              </>);
          }
          if(state == "faceDetected"){
            return(<>
              This is a three-part experience that will take 3 minutes.
              <br />
              <br />
              In each part you will be given a prompt to explore with your
              conversation partner whilst different parts of your face will be
              obfuscated.
              <br />
              <br />
              After each part, you will recieve question about how you are feeling and
              how you perceive your partner to be feeling.
              <br />
              <br />
              Tap 'Start' on the iPad to begin the experience.
            <p className="topic_info">{userRole}</p>
          </>);
          }
        })()}
      </p>
    </div>
  );
}
