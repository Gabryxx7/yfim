import React, { Component, useEffect, useRef, useState } from "react";
import { useSettings } from "../../context";

export function ControlPanel(props){
   const { settings, updateSettings } = useSettings();
	return <div className={`${props.className} overlay-panel ${settings.shortcutsEnabled ? 'debug-mode' : ''}`}>
		{props.children}
	</div>
}