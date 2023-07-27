const express = require("express");
const path = require("path");
const fs = require("fs");
const http = require("http");
const https = require("https");
const sio = require("socket.io");
const favicon = require("serve-favicon");
const compression = require("compression");
const bodyParser = require("body-parser");
require("dotenv").config();
var hash = require("object-hash");
const { EntryPlugin } = require("webpack");
const { SessionManager } = require("./src/managers/SessionManager")
// const { ControlManager } = require("./src/managers/ControlManager")
// const ChatsManager = require("./src/managers/ChatsManager")

server_port = process.env.PORT || 3000
const app = express(),
  options = {
    key: fs.readFileSync(__dirname + "/rtc-video-room-key.pem"),
    cert: fs.readFileSync(__dirname + "/rtc-video-room-cert.pem"),
  },
  port = server_port,
  server = process.env.NODE_ENV === "production"
      ? http.createServer(app).listen(port)
      : https.createServer(options, app).listen(port),
  io = sio(server);

  console.log(`\nServing on port: ${server_port}`);
  console.log(`Room 1 control: on port: https://localhost:${server_port}/control/1/`);
  console.log(`Room 1 chat: on port: https://localhost:${server_port}/r/1/guest`);
  console.log(`Room 1 survey: on port: https://localhost:${server_port}/s/1/guest`);

const questionset = require("./assets/topics/topics.json");
const stagesConfig = require("./assets/stages.json");
const masksConfig = require("./assets/MaskSetting/masks.json");
const sessionManager = new SessionManager(io, stagesConfig, masksConfig, questionset)
sessionManager.startTimer();