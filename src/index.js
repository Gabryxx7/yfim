import React from "react";
import { render } from "react-dom";
import { Provider } from "react-redux";
import { BrowserRouter, Switch, Route } from "react-router-dom";
import store from "./store.js";
import Home from "./containers/HomePage.js";
// import RoomPage from "./containers/RoomPage.js";
import RoomPage from "./containers/RoomPageNew.js";
import { FaceVideoTest, SurveyTest } from "./containers/TestContainers.js";
import RoomControl from "./containers/RoomControl.js";
import SurveyPage from "./containers/SurveyPage.js";
import NotFound from "./components/NotFound.js";
import DataMonitor from "./containers/DataMonitor.js";
// import styles from "/Users/marinig/Documents/GitHub/yfim/src/surveyStyle.scss";
import "./app.scss"

import ProjectionPage from "./containers/ProjectionPage.js";

render(
  <Provider store={store}>
    <BrowserRouter>
      <Switch>
        <Route exact path="/" component={Home} />
        <Route exact path="/faceTest/" component={FaceVideoTest} />
        <Route exact path="/surveyTest/" component={SurveyTest} />
        <Route exact path="/room/:room/" component={RoomPage} />
        {/* <Route path="*" component={NotFound} /> */}
        <Route exact path="/control/:room" component={RoomControl} />
        <Route exact path="/survey/:room/:user" component={SurveyPage} />
        <Route
          exact
          path="/projection/:room/:user"
          component={ProjectionPage}
        />
        <Route exact path="/data" component={DataMonitor} />
      </Switch>
    </BrowserRouter>
  </Provider>,
  document.getElementById("app")
);

// if (module.hot) module.hot.accept();
