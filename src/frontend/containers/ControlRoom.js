import React, { useEffect, useState, useRef, useContext } from "react";
import io from "socket.io-client";
import "survey-react/survey.css";
import { CMDS } from "../../backend/Definitions.js";
import 'react-toastify/dist/ReactToastify.css';
import { ToastCommunications, TOASTS } from "../components/ToastCommunications.js";
import { SessionContext } from "../classes/ClientSession.js";
import { STAGE } from "../../backend/Definitions.js"
import RoomControlPanel from "../components/Controls/RoomControlPanel.js";
import SettingsPanel from "../components/Controls/SettingsPanel.js";
// import * as React from 'react';
import PropTypes from 'prop-types';
import Tabs from '@mui/material/Tabs';
import Tab from '@mui/material/Tab';
import Typography from '@mui/material/Typography';
import Box from '@mui/material/Box';
import RoomsView from "./RoomsView.js";
import MaskControlPanel from "./MaskControlPanel.js";
import { useSocket } from "../classes/SocketContext.js";

function a11yProps(index) {
  return {
    id: `simple-tab-${index}`,
    'aria-controls': `simple-tabpanel-${index}`,
	 style: {color: 'white'}
  };
}

function CustomTabPanel(props) {
	const { children, value, index, ...other } = props;
 
	return (
	  <div
		 role="tabpanel"
		 hidden={value !== index}
		 id={`simple-tabpanel-${index}`}
		 aria-labelledby={`simple-tab-${index}`}
		 style={{ width: '100%', height: '100%'}}
		 {...other}>
		 {children}
	  </div>
	);
 }
 
 CustomTabPanel.propTypes = {
	children: PropTypes.node,
	index: PropTypes.number.isRequired,
	value: PropTypes.number.isRequired,
 };
 


export default function ControlRoom() {
	const [value, setValue] = React.useState(0);
	const socket = useSocket(CMDS.NAMESPACES.CONTROL)
 
	const handleChange = (event, newValue) => {
	  setValue(newValue);
	};
 
	return (
	  <Box sx={{ width: '100vw', height: '100vh' }} className="control-room-page">
		 <Box sx={{ borderBottom: 1, borderColor: 'divider' }}>
			<Tabs value={value} onChange={handleChange} aria-label="basic tabs example">
			  <Tab label="Rooms" {...a11yProps(0)} />
			  <Tab label="Mask" {...a11yProps(1)} />
			  {/* <Tab label="Item Three" {...a11yProps(2)} /> */}
			</Tabs>
		 </Box>
		 <CustomTabPanel value={value} index={0}> <RoomsView/> </CustomTabPanel>
		 <CustomTabPanel value={value} index={1}> <MaskControlPanel/></CustomTabPanel>
	  </Box>
	);
 }