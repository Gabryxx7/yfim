import React, { useContext } from "react";
import "survey-react/survey.css";
import { ToastContainer, toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import { SessionProvider, SessionContext } from "../classes/ClientSession.js";

/**
 * I MIGHT have overengineered this...
 * Basically this is a wrapper where you pass a YFIMToast which has a react component and some props
 * This wrapper will take care of getting the closeToast() prop from the ToastContainer
 * So it'll pass them to the YFIMToast.
 * 
 * @param {closeToast} hook passed by toastify to close the toast
 * @param {toastProps} props related to the toast passed by toastify
 * @param {toastComponent} YFIMToast this is just the instance of the YFIMToast that holds info such as the react component itself
 * as well as the properties related to the toast (e.g type, autoClose, draggable) and the react component props (such as callbacks, infos etc...)
 * @returns 
 */
const ToastWrapper = (props) => {
   const {closeToast, toastProps, toastComponent} = props;
   return (
      <>
      {toastComponent.component({closeToast, toastProps, ...toastComponent.componentProps})}
      </>
   )
}
class YFIMToast{
   constructor(component, toastProps={}, componentProps={}){
      this.component = component;
      this.toastProps = toastProps;
      this.componentProps = componentProps;
   }
   show(props={}){
      this.componentProps = {...this.componentProps, ...props}
      let toastFun = toast;
      if(this.toastProps?.type == "loading"){
         toastFun = toast.loading;
      }
      toastFun(<ToastWrapper toastComponent={this}/>, this.toastProps);
   }
   dismiss(){
      if(this.toastProps?.toastId){
         toast.dismiss(this.toastProps?.toastId);
      }
   }
}

const TOASTS= {}
TOASTS.NEW_ROLE = new YFIMToast(
   (props) => {
      return(<div className="toast-msg">
         <div>You are now the <span className="new-role" style={{
            fontWeight: "bold",
            fontSize: "1.1em"
         }}> {props.role} </span> </div>
      </div>);
   },{
      type: "info",
      autoClose: 3000,
      toastId: "newRoleToast"
   }
);

TOASTS.USER_JOINED = new YFIMToast(
   (props) => {
      return(<div className="toast-msg">A user joined the room!</div>);
   },{
      type: "success",
      toastId: "userJoined",
      autoClose: 5000
   }
)

TOASTS.USER_LEFT= new YFIMToast(
   (props) => {
      return(<div className="toast-msg">A user left the room!</div>);
   },{
      type: "error",
      toastId: "userLeft",
      autoClose: 5000
   }
)

TOASTS.PENDING_APPROVAL= new YFIMToast(
   (props) => {
      return(<div className="toast-msg">
         Waiting for the host's approval...
      </div>);
   },{
      type: "info",
      toastId: "pendingApproval"
   }
)


TOASTS.WAITING= new YFIMToast(
   (props) => {
      return(<div className="toast-msg">
         <span>Waiting for someone to join this room:&nbsp;</span>
           <a href={window.location.href}>{window.location.href}</a>
      </div>);
   },{
      type: "loading",
      toastId: "waiting"
   }
)


/**
 * The wrapper will have now added the component props to the props object, so now we have both closeToast (and the toast props) and the component props we passed
 */
const JoinRequestMsg = (props) => {
   const closeToast = props.closeToast;
   const onAction = props.onAction;
   const title = props.title ?? "No message";
   const actions = props.actions ?? ["Reject", "Accept"];
	return(<div className="toast-msg">
		 <span>{title}</span>
		 <div className="actions">
         {actions.map((text) => {
            const cmd = text.toLowerCase();
            return(<button
            key={`action-${cmd}`}
            onClick={() => {
               onAction(cmd);
               closeToast();
            }}
            data-ref={cmd}
            className={`primary-button ${cmd}`}>
            {text}
          </button>)
         })}
		 </div>
	</div>);
}


TOASTS.JOIN_REQUEST= new YFIMToast(
   JoinRequestMsg,
   {
      type: "warning",
      toastId:  "join-request"
   },
   {
      title: "A user is requesting to join the call..."
   }
)


TOASTS.TEST= new YFIMToast(
   JoinRequestMsg,
   {
      type: "warning",
      toastId:  "join-request"
   },
   {
      title: "TESTING",
      actions: ["Dismiss1", "Dismiss2"]
   }
)

TOASTS.KEYBOARD_SHORTCUTS = new YFIMToast(
   (props) => {
      return(<div className="toast-msg">{`Keyboard shortcuts ${props.enabled ? 'ENABLED' : "DISABLED"}!`}</div>);
   },{
      type: "warning",
      autoClose: 2000,
      // toastId: "keyboard-shortcuts"
   }
);



function ToastCommunications({ closeToast, toastProps }) {
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

export {ToastCommunications, TOASTS }
