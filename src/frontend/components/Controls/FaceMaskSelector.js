import React, { Component, useEffect, useRef, useState } from "react";
import Switch, { SwitchProps } from '@mui/material/Switch';
import {FormControlLabel, FormGroup} from '@mui/material';

const switchStyle={
    "& .MuiSwitch-track": {
        backgroundColor: "white"
    }
}

function LandmarkSelector(props) {
    const landmark = props.landmark ?? null;
    const faceProcessor = props.faceProcessor ?? null;
    const [visible, setVisible] = useState(landmark?.visible)
    const onChange = props.onChange ?? (() => landmark.visible = !landmark?.visible);

    return(
        <div className="landmark-selector"
            style={{
                display: 'flex',
                flexDirection: 'row',
                gap: '1rem'
            }}>
                <FormGroup>
            <FormControlLabel
                control={<Switch sx={{...switchStyle}} checked={visible}
                onChange={() => {
                    onChange();
                    setVisible(landmark?.visible);
                }}
                color="secondary" />}
                label={landmark?.name} />
                </FormGroup>
        </div>
    )
}

function FaceMaskSelector(props) {
    const faceProcessor = props.faceProcessor ?? null;
    return(
        <div className="face-mask-selector" style={{
            display: 'flex',
            flexDirection: 'column',
            // gap: '1rem'
        }}>
        {/* <LandmarkSelector
            landmark={{name: "ALL", visible: () => faceProcessor?.allVisible}}
            onChange={() => faceProcessor.allVisible = !faceProcessor.allVisible }
            faceProcessor={props.faceProcessor}/> */}
        {faceProcessor?.landmarksData.map((landmark) => (
            <LandmarkSelector
                landmark={landmark}
                faceProcessor={props.faceProcessor}/>
        ))}
        </div>
    )
}

export {FaceMaskSelector}