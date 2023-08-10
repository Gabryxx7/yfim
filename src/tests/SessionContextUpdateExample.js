import React, { useState, useContext, useEffect } from "react";
import { SessionContext } from "../frontend/classes/ClientSession.js";

export default function TestComponent(props) {
	const sessionMap = useContext(SessionContext);
	const userInfo = props.userInfo ?? {};
	const [count, setCount] = useState(sessionMap.session.testCount);
   const index = props.index ?? 0;
   const title = "TEST "+ index;
   const width = 10;

   useEffect(() => {
      console.log(`${title} Re-Rendered`);
   }, [])
	return (
	  <span id="test-component" style={{
			position: "fixed",
			top: 0,
			width: `${width}rem`,
         left: `${index*width}rem`,
			minHeight: "10rem",
			backgroundColor: "#eeeeee",
			color: "black",
			display: "flex",
			flexDirection: "column",
			placeItems: "center",
			placeContent: "center"
	  }}>
      <p>{title} - {userInfo?.role}</p>
		 <p>{sessionMap.session.elapsed}</p>
		 <div
		 	onClick={() => {
				sessionMap.incrementCounter();
				setCount(sessionMap.session.testCount);
				console.log(`CLICK! ${sessionMap.session.testCount} - ${count}`)
			}}
			style={{
				cursor: "pointer",
				padding: "1rem",
				backgroundColor: "lightgreen"
			}}
		 > Increase Count </div>
		 <p style={{
				padding: "1rem",
				color: "black"
			}}>{`${sessionMap.session.name} ${count}`}</p>
	  </span>
	);
 }
