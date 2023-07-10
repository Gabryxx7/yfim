import React from "react";
import { render } from "react-dom";
import { Provider } from "react-redux";
import store from "./store";
import { BrowserRouter, Switch, Route } from "react-router-dom";
import Home from "./containers/HomePage";
// import RoomPage from "./containers/RoomPage";
import RoomPage from "./containers/RoomPageNew";
import { FaceVideoTest, SurveyTest } from "./containers/TestContainers";
import RoomControl from "./containers/RoomControl";
import SurveyPage from "./containers/SurveyPage";
import NotFound from "./components/NotFound";
import DataMonitor from "./containers/DataMonitor";

import styles from "./app.scss";
import ProjectionPage from "./containers/ProjectionPage";

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

if (module.hot) module.hot.accept();
