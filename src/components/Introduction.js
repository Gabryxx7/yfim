import React, { useEffect, useState } from "react";

export default function Introduction(props) {
  const userRole = props.userRole != undefined ? props.userRole : "";
  return (
    <div className="topic intro-topic">
      <p className="topic_head">YOUR FACE IS MUTED</p>
      <p className="topic_text">
        <i>Your Face is Muted</i> explores how a lack of non-verbal cues
        <br />
        affects critical conversations and our ability to empathise.
        <br />
        <br />
        This is a two person experience. Please take a seat and wait
        <br />
        for your conversation partner.
      </p>
      <p className="topic_info">{userRole}</p>
    </div>
  );
}
