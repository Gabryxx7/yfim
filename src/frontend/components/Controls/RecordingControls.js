import React, { Component, useEffect, useRef, useState } from "react";
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { icon } from '@fortawesome/fontawesome-svg-core/import.macro'

function RecordingControls(props) {
    const recording = props.recording ?? false;
    return(
        <div className="recording-state">
            {recording ?
                <FontAwesomeIcon icon={icon({name: 'play'})} /> :
                <FontAwesomeIcon icon={icon({name: 'circle'})} />
            }
        </div>
    )
}

export {RecordingControls}