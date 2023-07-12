import React, { useEffect, useState, useRef, useContext, useReducer, useCallback } from "react";
import "survey-react/survey.css";
import { CMDS, DATA} from "../managers/Communications";
import { ToastContainer, toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import { SessionProvider, SessionContext } from "../classes/Session";

const NewRoleMsg = (props) => {
   return(<div className="toast-msg">
      You are now the <span className="new-role" style={{
         fontWeight: "bold",
         fontSize: "1.1em"
      }}> {props.role} </span>
   </div>);
}


const PendingApprovalMsg = (props) => {
   return(<div className="toast-msg">
      Waiting for the host's approval...
   </div>);
}


const InvitationMsg = (props) => {
   const onInvitationAnswer = props.onInvitationAnswer;
   const closeToast = props.closeToast;
	return(<div className="toast-msg">
		 <p>A user is requesting to join the call...</p>
		 <div class="actions">
		 <button
			onClick={() => {
            console.log(props)
            onInvitationAnswer("reject");
            closeToast();
         }}
			data-ref="reject"
			className="primary-button reject">
			Reject
		 </button>
		 <button
			onClick={() => {
            console.log(props)
            onInvitationAnswer("accept");
            closeToast();
         }}
			data-ref="accept"
			className="primary-button accept">
			Accept
		 </button>
		 </div>
	</div>);
}


const WaitingMsg = (props) => {
	return(<div className="toast-msg">
		<span>Waiting for someone to join this room:&nbsp;</span>
        <a href={window.location.href}>{window.location.href}</a>
	</div>);
}


function ToastCommunications(props) {
	const sessionMap = useContext(SessionContext);
	
   return(<ToastContainer
      position="bottom-right"
      autoClose={100000}
      hideProgressBar={false}
      newestOnTop={false}
      closeOnClick={false}
      rtl={false}
      pauseOnFocusLoss={true}
      draggable={false}
      pauseOnHover={true}
      theme="dark"/>
   );
}

export {ToastCommunications, InvitationMsg, WaitingMsg, NewRoleMsg, PendingApprovalMsg }
