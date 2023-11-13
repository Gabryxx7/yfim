import React, { useEffect, useState, useRef} from "react";
import { render, createRoot } from "react-dom/client";
import { Provider } from "react-redux";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import store from "./store.js";
import RoomSession from "./frontend/containers/RoomSession.js";
import { ROUTES } from "./backend/Definitions.js"
// import styles from "/Users/marinig/Documents/GitHub/yfim/src/surveyStyle.scss";
import "./app.scss"
import ControlRoom from "./frontend/containers/ControlRoom.js";
import SurveyTest from "./frontend/containers/SurveyTestPage.js";
import { SocketProvider } from "./frontend/classes/SocketContext.js";
const root = createRoot(document.getElementById("app"));
root.render(
  <Provider store={store}>

		<SocketProvider>
    <BrowserRouter>
      <Routes>
        {/* <Route exact path="/" element={<Home />} /> */}
        {/* <Route path={ROUTES.FACE_API_TEST.path} element={<MaskSettingsPage />} /> */}
        <Route path={ROUTES.SURVEY_TEST.path} element={<SurveyTest />} />
        <Route path={ROUTES.ROOM.path} element={<RoomSession />} />
        <Route path={ROUTES.CONTROL.path} element={<ControlRoom />} />
        {/* <Route path="*" element={<NotFound />} /> */}
        {/* <Route exact path="/control/:room" element={<RoomControl />} /> */}
        {/* <Route exact path="/projection/:room/:user" element={<ProjectionPage />}/> */}
        {/* <Route exact path="/data" element={<DataMonitor />} /> */}
      </Routes>
    </BrowserRouter>
    </SocketProvider>
  </Provider>
);

// if (module.hot) module.hot.accept();
