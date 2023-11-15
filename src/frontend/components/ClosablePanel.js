import React, { useEffect, useRef, useState, forwardRef } from 'react';
import { useSettings } from '../../context';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'

export const CloseButton = forwardRef((props, ref) => {
   const icon = props.icon ?? "fa-solid fa-circle-xmark";
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
      <div onMouseEnter={() => setBtnVisible(true)}
      onMouseLeave={() => setBtnVisible(false)}>
         <div {...props}  style={!state.closed ? {} : {maxHeight: '3rem', overflow: 'hidden'}}>
            {props.children}
         </div>
            <CloseButton ref={btnRef}
               icon={state.closed ? 'fa-angle-down' : 'fa-angle-up'}
               onClick={() => setState(prev => ({...prev, closed: !prev.closed}))}
               style={{opacity: btnVisible ? 1 : 0}}
            />
      </div>
  );
}
