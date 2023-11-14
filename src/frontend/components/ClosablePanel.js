import React, { useEffect, useRef, useState, forwardRef } from 'react';
import { useSettings } from '../../context';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'

export const CloseButton = forwardRef((props, ref) => {
   const icon = props.icon ?? "fa-solid fa-circle-xmark";
   const onClick = props.onClick ?? ((e) => {});
   return (
    <div {...props} className={`close-button ${props.className ?? ''}`}
      style={{...props.style }}>
        <FontAwesomeIcon icon={icon} />
    </div>
  )
})


export default function ClosablePanel(props){
   const btnRef = useRef();
   const [ state, setState ] = useState({});
   const [ btnVisible, setBtnVisible ] = useState({});
   const { settings } = useSettings();
   return (
      <>
      {!state.closed &&
         <div {...props}
         onMouseEnter={() => setBtnVisible(true)}
         onMouseLeave={() => setBtnVisible(false)}>
            {props.children}
            <CloseButton ref={btnRef}
               onClick={() => setState({closed: true})}
               style={{display: settings.shortcutsEnabled ? 'block' : 'none', opacity: btnVisible ? 1 : 0}}
            />
         </div>
      }
      </>
  );
}
