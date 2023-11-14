import React, { Component, useEffect, useRef, useState } from "react";
import Switch, { SwitchProps } from '@mui/material/Switch';
import {FormControlLabel, FormGroup} from '@mui/material';
import Input from '@mui/material/Input';
import Slider from '@mui/material/Slider';
import Checkbox from '@mui/material/Checkbox';
import MuiInput from '@mui/material/Input';
import { CMDS, DATA, KEY_SHORTCUTS} from "../../../backend/Definitions.js";
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { icon } from '@fortawesome/fontawesome-svg-core/import.macro'
import { useSocket, useFaceProcessor, useSettings } from '../../../context'
import ClosablePanel from "../ClosablePanel.js";

const EyeCheckbox = (props) => <Checkbox
    {...props}
    sx={{
        width: '1rem',
        height: '1rem',
        color: 'tomato',
        '& input': {
            padding: 0,
            margin: 0,
            pl: 0,
        },
        '&$checked': { opacity: 0.6 },
    }}
    icon={<FontAwesomeIcon icon={icon({name: 'eye-slash'})} />}
    checkedIcon={<FontAwesomeIcon icon={icon({name: 'eye'})} />}
/>

const rowStyle = {
    display: 'flex',
    flexDirection: 'row',
    gap: '0.2em',
    placeItems: 'center'
}
function SliderInput(props){
    const {defaultValue, onChange, label} = props;
    const [value, setValue] = useState(defaultValue) ?? 0.5;
    const inptProps = {
        min: props.min ?? 0.1,
        max: props.max ?? 1,
        step: props.step ?? 0.001
    }

    useEffect(() => {
        onChange && onChange(value)
    }, [value])

    const handleSliderChange = (event, newValue) => {
        setValue(newValue);
    };

    const handleInputChange = (event) => {
        setValue(event.target.value);
    };
    const handleBlur = () => {
      if (value < 0) {
          setValue(0);
      } else if (value > 100) {
          setValue(100);
      }
    };

    return( <div style={{
            display: 'flex',
            placeContent: 'center',
            placeItems: 'center',
            gap: '0.4rem'
        }}>
            <span>{label ?? ""}</span>
            <Slider
                {...inptProps}
                sx={{'width': '4rem'}}
                value={value}
                onChange={handleSliderChange}
                aria-labelledby="input-slider"
            />
            <input
                {...inptProps}
                aria-labelledby='input-slider'
                value={value}
                style={{
                    fontSize: '0.7rem',
                    color: 'white',
                    width: '1.5rem',
                    padding: '0',
                    width: '2em'}}
                onChange={handleInputChange}
                onBlur={handleBlur}
            />
        </div>
        )
}

function LandmarkSelector(props) {
    const landmark = props.landmark ?? null;
    const faceProcessor = props.faceProcessor ?? null;
    const [visible, setVisible] = useState(landmark?.visible)
    const [scale, setScale] = useState(landmark?.scale)
    const onVisibleClicked = props.onVisibleClicked ?? (() => {landmark.visible = !landmark?.visible; setVisible(landmark.visible)});
    const onScaleChanged = props.onScaleChanged ?? ((value, idx) => {
        // console.log("New landmark radius value", value);
        landmark.scale[idx] = value
    });
    const onRadiusChanged = props.onRadiusChanged ?? ((value) => {
        console.log("New landmark radius value", value);
        landmark.radius.setValue(value)
    });

    useEffect(() => {
        console.log("Landmark updated!")
        setVisible(landmark?.visible);
        setScale(landmark?.scale);
    }, [landmark])

    return(
        <div className="landmark-selector"
            style={rowStyle}>
            <label style={{width: '8rem'}}>{landmark?.name}</label>
            <EyeCheckbox
                checked={visible}
                onChange={onVisibleClicked}
            />
            <SliderInput label='scale.x' defaultValue={landmark.scale[0]} onChange={(value) => onScaleChanged(value, 0)}/>
            <SliderInput label='scale.y' defaultValue={landmark.scale[1]} onChange={(value) => onScaleChanged(value, 1)}/>
            {/* <SliderInput label='radius'  onChange={(value) => onRadiusChanged(value)}/> */}
        </div>
    )
}


function FaceMaskSelector(props) {
    const {faceProcessor} = useFaceProcessor();
    const { settings } = useSettings();
    const socket = useSocket(CMDS.NAMESPACES.CONTROL)
    const [landmarksData, setLandmarksData] = useState(faceProcessor?.landmarksData);
    const [ interpTime, setInterpTime ] = useState(0.5);
    const [ showPoints, setShowPoints ] = useState(false);
    const onSaveClick = props.onSaveClick ?? (() => {
        if(!socket) return;
        const data = {};
        faceProcessor?.landmarksData.forEach((l, i) => data[l.name] = {name: l.name, scale: l.scale, visible: l.visible})
        socket.emit(CMDS.SOCKET.CONTROL_ROOM_SETTINGS_UPDATE, {filename: "CustomLandmarkSettings.json", data: data})
    });
    const onRestoreClick = props.onClick ?? (() => {
        faceProcessor?.landmarksData.forEach((l, i) => l.reset());
        setLandmarksData(faceProcessor?.landmarksData)
    });

    useEffect(() => {
        landmarksData?.forEach((landmark, i) => {
            landmarksData[i].showPoints = showPoints;
        })
    }, [showPoints])

    useEffect(() => {
        landmarksData?.forEach((landmark, i) => {
            landmarksData[i].interpTime = interpTime;
        })
    }, [interpTime])

    useEffect(() => {
        setLandmarksData(faceProcessor?.landmarksData);
    }, [faceProcessor])

    return(
        <ClosablePanel className={`face-mask-selector actions-panel ${props.className}`}
        style={settings.shortcutsEnabled ? {} : {display: 'none'}}>
        {/* <LandmarkSelector
            landmark={{name: "ALL", visible: () => faceProcessor?.allVisible}}
            onChange={() => faceProcessor.allVisible = !faceProcessor.allVisible }
            faceProcessor={props.faceProcessor}/> */}
        {landmarksData?.map((landmark, i) => (
            <LandmarkSelector
                key={landmark.name}
                landmark={landmarksData[i]}
                faceProcessor={faceProcessor}/>
        ))}

            <EyeCheckbox onChange={() => setShowPoints(prev => !prev)}/>
        <SliderInput label='lerp time' min={0.001} max={0.6} step={0.001} defaultValue={0.12} onChange={(value) => setInterpTime(value)}/>
        <div  style={{...rowStyle, rowGap: '1em', marginTop: '1rem'}}>
            <span className='primary-button'
                style={{padding: '0.5rem 0rem'}}
                onClick={onSaveClick}>Save</span>
            <span className='primary-button'
                style={{padding: '0.5rem 0rem'}}
                onClick={onRestoreClick}>Restore</span>
        </div>
    </ClosablePanel>
    )
}

export {FaceMaskSelector}