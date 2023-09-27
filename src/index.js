import React, { useEffect, useState, useRef } from "react";
import { render } from "react-dom";
import { Provider } from "react-redux";
import { BrowserRouter, Switch, Route } from "react-router-dom";
import store from "./store.js";
import RoomSession from "./frontend/containers/RoomSession.js";
import { ROUTES } from "./backend/Definitions.js"
import { FaceVideoTest, SurveyTest } from "./tests/TestContainers.js";
// import styles from "/Users/marinig/Documents/GitHub/yfim/src/surveyStyle.scss";
import "./app.scss"
import ControlRoom from "./frontend/containers/ControlRoom.js";

render(
  <Provider store={store}>
    <BrowserRouter>
      <Switch>
        {/* <Route exact path="/" component={Home} /> */}
        <Route exact path={ROUTES.FACE_API_TEST.path} component={FaceVideoTest} />
        <Route exact path={ROUTES.SURVEY_TEST.path} component={SurveyTest} />
        <Route exact path={ROUTES.ROOM.path} component={RoomSession} />
        <Route exact path={ROUTES.CONTROL.path} component={ControlRoom} />
        {/* <Route path="*" component={NotFound} /> */}
        {/* <Route exact path="/control/:room" component={RoomControl} /> */}
        {/* <Route exact path="/projection/:room/:user" component={ProjectionPage}/> */}
        {/* <Route exact path="/data" component={DataMonitor} /> */}
      </Switch>
    </BrowserRouter>
  </Provider>,
  document.getElementById("app")
);

// if (module.hot) module.hot.accept();
