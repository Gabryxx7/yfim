import React from "react";

export default function Clock(props) {
  const { end } = props;
  const min = parseInt(props.time_diff / 60);
  const sec = props.time_diff - min * 60;
  var minstr; // GABRY: Omg no, prepending a 0 just because? So if the whole thing lasts 10mins it'll now be 010:00... Who wrote this... Why not an if like you did for the seconds??!
  
  if (min < 10) {
    minstr = "0" + min.toString();
  } else {
    minstr = min.toString();
  }
  var secstr;
  if (sec < 10) {
    secstr = "0" + sec.toString();
  } else {
    secstr = sec.toString();
  }
  let showtime = "";
  if (end) {
    showtime = "TIME'S UP";
  } else {
    showtime = minstr + " : " + secstr;
  }

  return (
    <div className="clock">
      <text> {showtime} </text>
    </div>
  );
}
