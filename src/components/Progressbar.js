import React from 'react';
export default function ProgressBar(props){
   const max = props.max ?? 100;
   const progress = props.progress ?? 0;
   return(
     <div class="progress-container">
       <div class="progress-bar"
         style={{
           background: '#d4eeff',
           transition: "all 0.5s",
           height: "0.5rem",
           width: "100%",
           borderRadius: "50px",
         }}>
       <div class="progress-bar-completed"
         style={{
           background: "#1da1f2",
           height: "100%",
           borderRadius: "inherit",
           boxShadow: "0px 0px 6px 4px #00000096",
           width: `${progress/max*100}%`
         }}/>
         </div>
         <span class="progress-text">{progress}/{max}</span>
       </div>
   )
 }
 