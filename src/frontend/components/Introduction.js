import React, { useEffect, useState, useRef } from "react";
import { STAGE } from '../../backend/Definitions.js'
import { useUser } from "../../context/AppContext.js";
useUser

export default function Introduction(props) {
  const stageData = props.stageData ?? {reason: "", state: STAGE.STATUS.NONE};
  const useJoinForm = props.useJoinForm ?? true;
  const nameInput = useRef();
  const { user, updateUser } = useUser();

  return (
    <div className={`intro-container ${stageData.state}`}>
    <div className={`intro ${stageData.state}`}>
      <p className="title">YOUR FACE IS MUTED</p>
      <p className="text">
        {(() => {
          if(stageData.state == STAGE.STATUS.NONE){
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
          if(stageData.state == STAGE.STATUS.IN_PROGRESS){
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
            {/* <p className="topic_info">{userRole}</p> */}
          </>);
          }
        })()}
      </p>
        {stageData.state == STAGE.STATUS.NONE && useJoinForm &&
          <div className="intro-form">
            <form 
              onSubmit={(e) => {
                e.preventDefault();
                updateUser({name: nameInput.current.value});
              }}>
              {/* <label htmlFor="user-name"> What is your name?</label> */}
              <label htmlFor="user-name"> What is your Participant ID?</label>
              <input type="text" id="user-name" name="name" ref={nameInput} disabled={user.name != null} required />
              {user.name == null && <input type="submit" id="join-btn" className="primary-button" value="Join" name="join-room" />}
              {user.name != null && <div> Welcome, <strong>{user.name}</strong>! We are just setting up a few more things...</div>}
            </form>
          </div>}
    </div>
    </div>
  );
}
