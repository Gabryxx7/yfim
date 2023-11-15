import Button from '@mui/material/Button';
import Typography from '@mui/material/Typography';
import React, { useEffect, useState } from "react";
import InputLabel from '@mui/material/InputLabel';
import MenuItem from '@mui/material/MenuItem';
import FormHelperText from '@mui/material/FormHelperText';
import FormControl from '@mui/material/FormControl';
import Select from '@mui/material/Select';
import { default as Grid } from '@mui/material/Unstable_Grid2'; // Grid version 
import Checkbox from '@mui/material/Checkbox';
import FormControlLabel from '@mui/material/FormControlLabel';
import VisibilityIcon from '@mui/icons-material/Visibility';
import VisibilityOffIcon from '@mui/icons-material/VisibilityOff';

export const CAMERA_STATUS = {
    NONE:         {id: -1, title: "NONE", callbacks: []},
    READY:        {id: 0, title: "READY", callbacks: []},
    INITIALIZED:  {id: 1, title: "INITIALIZED", callbacks: []},
    WAITING:      {id: 2, title: "WAITING", callbacks: []},
}


const stopAllTracks = (deviceId) => {
    navigator.mediaDevices.getUserMedia({
        audio: false, 
        video: {
            deviceId: deviceId,
        }
    }).then((stream) => {
        try{
            stream.getVideoTracks().forEach((t,tIdx) => {
                try{
                    t.stop()
                } catch(error){
                    console.log("Error stopping tracks " + error.message)
                }
            });
        } catch(error){
            console.log("Error stopping all tracks " + error.message)
        }
    }).catch((error) => {
        console.log("Error stopping all tracks " + error.message)
    })
}

const updateUserMedia = async (onWebcamListUpdated) => {
    if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        throw new Error('Browser API navigator.mediaDevices.getUserMedia not available')
    }
    navigator.mediaDevices.enumerateDevices().then((mediaDevices) => {
        // console.log("Found devices", mediaDevices)
        var items = [];
        mediaDevices.forEach((device, dIdx) => {
            navigator.mediaDevices.getUserMedia({
                audio: false, 
                video: {
                    deviceId: device.deviceId,
                    width: {min: 640, ideal: 1280, max: 1280},
                    height: {min: 480, ideal: 720, max: 730}
                }
            }).then((stream) => {
                try {
                    if (device.kind.includes("ideo")){
                        stream.getVideoTracks().forEach((t,tIdx) => {
                            try {
                                // console.log(`Device ${dIdx}`, device, `Track: `, t, `kind: `, t.kind, t.getCapabilities(), t.getSettings())
                                if (t.readyState == 'live') {
                                    // t.enabled = false;
                                    t.stop()
                                }
                                if (!t.kind.includes("ideo")) return;
                                const streamSettings = t.getSettings();
                                // console.log(`Adding Device ${dIdx}`, device, `Track: `, t, `kind: `, t.kind)
                                items.push({
                                    deviceIdx: dIdx,
                                    deviceId: device.deviceId,
                                    deviceLabel: t.label,
                                    stream: stream, 
                                    facingMode: 'user',
                                    width: streamSettings.width,
                                    height: streamSettings.height,
                                    frameRate: streamSettings.frameRate,
                                    menuLabel: `${t.label} ${streamSettings.width}x${streamSettings.height} ${streamSettings.frameRate.toFixed(2)}FPS`
                                })
                            } catch (error) {
                            console.log("Error Initializing track " + error.message);
                        }
                        });
                    }
                } catch (error) {
                    console.log("Error Initializing media devices " + error.message);
                }
            }).catch(e => {
                console.error('Error getting user media for ' +device.deviceId +': ' + e.message);
            }).finally(() => {
                if(dIdx >= mediaDevices.length-1){
                    onWebcamListUpdated(items)
                }
            });
        })
        return items
    }).catch(e => {
        console.error('Error enumerating user media devices: ' + e.message);
        setTimeout(async () => await updateUserMedia(onWebcamListUpdated), 2000);
    });
}

export function CameraSelector(props) {
    const [webcamList, setWebcamList] = useState([]);
    const [webcamDevice, setWebcamDevice] = useState()
    const targetFPS = props.targetFPS != null ? props.targetFPS : -1;
    const onWebcamSelected = props.onWebcamSelected ? props.onWebcamSelected : null;
    const updateUserMediaOnSelect = props.updateUserMediaOnSelect ? props.updateUserMediaOnSelect : true;
    const defaultIdx = props.defaultIdx ? props.defaultIdx : 0;
    const defaultCameraRegExp = props.defaultCameraRegExp ? props.defaultCameraRegExp : null;
    const onShowFeed = props.onShowFeed ? props.onShowFeed : null;
    const onHideFeed = props.onHideFeed ? props.onHideFeed : null;
    const showVisibiliyCheckbox = props.showVisibiliyCheckbox != null ? props.showVisibiliyCheckbox : true;

    const updateCameraDropdown = () => {
        if(webcamList.length <= 0) return '';
        var selectedCamIdx = webcamDevice != null ? webcamDevice.deviceIdx-1 : defaultIdx;
        selectedCamIdx = selectedCamIdx > webcamList.length - 1 ? '' : selectedCamIdx;
        return(selectedCamIdx)
    }
    const updateWebcamIdx = (newIdx) => {
        if(webcamDevice != null){
            stopAllTracks(webcamDevice.deviceId);
        }
        if (webcamList.length > 0) {
            setWebcamDevice(webcamList[newIdx]);
        }
    }

    const startWebcam = (webcamDevice, startCallback) => {
        if (webcamDevice == null) return;
        console.log("Starting webcam " +webcamDevice.deviceId)
        if(!updateUserMediaOnSelect){
            onWebcamSelected(webcamDevice);
            return;
        }
        var newConstraints = {
            audio: false, 
            video: {
                deviceId: webcamDevice.deviceId,
            }
        }

        if(targetFPS > 0){
            newConstraints.video['frameRate'] = {ideal: targetFPS}
        }
        navigator.mediaDevices.getUserMedia(newConstraints).then((stream) => {
            webcamDevice.stream = stream;
            if (startCallback) {
                startCallback(webcamDevice);
            }
        }).catch((error) =>{
            console.log("Error getting new stream " +error.message)
        })
    }

    useEffect(() => {
        if(webcamDevice == null) return;
        console.log(`Changed webcam selection to ${webcamDevice.deviceIdx} - ${webcamDevice.deviceLabel}`, webcamList)
        startWebcam(webcamDevice, onWebcamSelected)
    }, [webcamDevice]);

    useEffect(() => {
        // console.log("WEBCAMLIST SET ", webcamList)
        if (webcamList.length > 0) {
            var idx = defaultIdx;
            if(defaultCameraRegExp != null){
                for(let i = 0; i < webcamList.length; i++){
                    if(webcamList[i].deviceLabel && webcamList[i].deviceLabel.toLowerCase().includes(defaultCameraRegExp.toLowerCase())){
                        idx = i;
                        break;
                    }
                }
            }
            updateWebcamIdx(idx)
        }
    }, [webcamList]);

    useEffect(() => {
        stopAllTracks()
        updateUserMedia((items) => {
         console.log("Updated user media", items)
            setWebcamList(items);
        }).catch(e => {
            console.error('Error updating user media devices!: ' + e.message);
        });
    }, []);

    return (
        <FormControl className="webcam-dropdown"
            margin='dense'
            size='small'
            sx={{
                // width: '100%',
                height: '100%',
                margin: '0',
                padding: '0',
                flexDirection: 'row',
                backgroundColor: 'rgba(0,0,0,0.5)',
                '.MuiInputBase-root': {
                    borderRadius: '0px',
                    border: '0px',                }
            }}>
            {/* {webcamList.length > 0 &&
                <Select
                    labelId="cameraList"
                    defaultValue={() => updateCameraDropdown()}
                    value={updateCameraDropdown()}
                    onChange={(event) => {
                        var webcamIdx = event.target.value;
                        updateWebcamIdx(webcamIdx)
                    }}
                    inputProps={{ 'aria-label': 'Without label' }}
                    sx={{
                        fontSize: '0.95rem',
                        zIndex: '101',
                        height: '1.5rem',
                    }}>
                    {webcamList.map((device, idx) => {
                        return(<MenuItem className="webcamDevice" value={idx} key={`${device.deviceId}_${device.deviceIdx}`}>
                        {device.menuLabel}
                        </MenuItem>)
                    })}
                </Select>
            }
            <FormControlLabel
                control={<Checkbox
                    icon={<VisibilityIcon sx={{ fontSize: '0.9rem' }} />}
                    checkedIcon={<VisibilityOffIcon  sx={{ fontSize: '0.9rem' }}/>}
                    onChange={(e) => {
                        if(e.target.checked){
                            // stopAllTracks(webcamDevice.deviceId)
                            if(onHideFeed){
                                onHideFeed(webcamDevice);
                            }
                            return;
                        }
                        startWebcam(webcamDevice, onShowFeed)
                        return;
                    }}
                    // onChange={(val) => posesManager.showVideo = val}
                />}
                  sx={{
                    display: `${showVisibiliyCheckbox ? 'block' : 'none'}`,
                    margin: 0,
                    padding: 0,
                    '& .MuiCheckbox-root': {
                      padding: '0rem 0.2rem !important'
                    },
                    '& .MuiCheckbox-root.Mui-checked': {
                        color: 'rgba(143, 144, 143, 0.5)'
                    }
                  }} /> */}
            </FormControl>)
}