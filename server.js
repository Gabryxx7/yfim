import express from "express";
import path from "path";
import multer from "multer";
import fs from "fs";
import http from "http";
import https from "https";
import { Server } from 'socket.io';
// import sio from "sio";
import favicon from "serve-favicon";
import compression from "compression";
import bodyParser from "body-parser";
import SessionManager from "./src/backend/SessionManager.js";
import console  from "./src/utils/colouredLogger.js";
import Nano from "nano";
import { URL } from 'url'; // in Browser, the URL in native accessible on window
import { ROUTES } from "./src/backend/Definitions.js";

const __filename = new URL('', import.meta.url).pathname;
// Will contain trailing slash
const __dirname = new URL('.', import.meta.url).pathname;

// const express = require("express");
// const path = require("path");
// const multer = require('multer');
// const fs = require("fs");
// const http = require("http");
// const https = require("https");
// const sio = require("socket.io");
// const favicon = require("serve-favicon");
// const compression = require("compression");
// const bodyParser = require("body-parser");
// const { SessionManager } = require("./src/backend/SessionManager")
// const { console  } = require("./src/utils/colouredLogger")

// CouchDB
const COUCHDB_URL = process.env.COUCHDB_URL || 'http://localhost:5984';
// const nano = require("nano")("http://admin:admin@localhost:5984");
// const nano = require("nano")(COUCHDB_URL);
const nano = Nano(COUCHDB_URL);
const tableName = "occlusion_mask";

// require("dotenv").config();
import dotenv from 'dotenv'
dotenv.config()
// const db = nano.db.use(tableName);

// nano.db
//   .create(process.env.DB_NAME)
//   .then((data) => {
//     // success - response is in 'data'
//     console.log("New database created: " + process.env.DB_NAME);
//     couch = nano.use(process.env.DB_NAME);
//     app.set("couch", couch);
//   })
//   .catch((err) => {
//     // failure - error information is in 'err'
//     console.log("Connected to existing database: " + process.env.DB_NAME);
//     couch = nano.use(process.env.DB_NAME);
//     app.set("couch", couch);
//   });


const server_port = process.env.PORT || 3000

// Certificate
// var SSLPath = "/etc/letsencrypt/live/yfim.gmarini.com-0001/";
var SSLPath = "./SSL/yfim_";
var privateKey = null;
var certificate = null;
var ca = null;
try{
  privateKey = fs.readFileSync(SSLPath+'privkey.pem', 'utf8');
  certificate = fs.readFileSync(SSLPath+'cert.pem', 'utf8');
  ca = fs.readFileSync(SSLPath+'chain.pem', 'utf8');

} catch(error){
  console.warn(`No SSL certificates found in folder ${SSLPath}, using local certificates in ./SSL/`)
  // SSLPath = "./SSL/yfim_";
  SSLPath = "/etc/letsencrypt/live/yfim.gmarini.com-0001/";  
  privateKey = fs.readFileSync(SSLPath+'privkey.pem', 'utf8');
  certificate = fs.readFileSync(SSLPath+'cert.pem', 'utf8');
  ca = fs.readFileSync(SSLPath+'chain.pem', 'utf8');
}

const credentials = {
	key: privateKey,
	cert: certificate,
	ca: ca
};
const app = express();
//const httpServer = http.createServer(app).listen(server_port);
const httpsServer = https.createServer(credentials, app).listen(server_port);
const io = new Server(httpsServer);

console.log(`\nServing on port: ${server_port}`);
console.log("Available pages: ")
for(let route in ROUTES){
  console.error(`- ${ROUTES[route].name}: https://localhost:${server_port}${ROUTES[route].path} `);
  console.error(`${ROUTES[route].description}\n`);
}
// chatio = io.of("chat");
// controlio = io.of("control");
// projectio = io.of("projection");

const sessionManager = new SessionManager(io)
// sessionManager = new SessionManager(io)

console.log("starting server on port: " + server_port);

// parse application/json
app.use(bodyParser.json());

// parse application/x-www-form-urlencoded
app.use(bodyParser.urlencoded({ extended: true }));

const upload = multer({
  dest: "./uploads/",
  storage: multer.diskStorage({
    destination: function (req, file, next) {
      console.log(req.body, req.body.sessionId, file);
      const sessionFolder = req.body?.sessionId ?? "NO_SESSION";
      const stageFolder = req.body?.stageIndex == null ? "Stage_0" : `Stage_${parseInt(req.body.stageIndex)+1}`;
      const finalPath = path.join(__dirname, "uploads", sessionFolder, stageFolder);
      fs.mkdirSync(finalPath, { recursive: true })
      next(null, finalPath);
    },
    filename: function (req, file, cb) {
      // console.log(req.body, req.file, file);
      cb(null, file.originalname.replace("//", "-"));
    }
  }),
  limits: {
     fieldSize: '500mb',
  }});
app.use('/upload_stage_results', upload.any());
// app.post('/upload_stage_results', upload.any(), function (req, res) {
//   console.log(req.files, req.file, req.body)
// });

app.use(function (req, res, next) {
  req.io = io;
  next();
});

// compress all requests
app.set("socketIo", io);
app.use(compression());
app.use(express.static(path.join(__dirname, "dist")));
// app.use(express.static(path.join(__dirname, "backend", "public")));
app.use((req, res) => res.sendFile(__dirname + "/dist/index.html"));

app.use(favicon("./dist/favicon.ico"));
// Switch off the default 'X-Powered-By: Express' header
app.disable("x-powered-by");


// control_room_list = {};
// ready_user_by_room = {};
// rating_by_user = {};
// projection_room_list = {};
// survey_room_list = {};

// survey_socket = {
//   //? Does the app support multiple concurring conversations in different rooms? What happens if new rooms are opened?
//   guest: undefined,
//   host: undefined,
// };

// emotion_ready = { host: false, guest: false };
// question_ready = { host: false, guest: false };
// survey_ready = { host: false, guest: false };
// emotion_data = {
//   host: {},
//   guest: {},
// };
// question_data = {
//   host: {},
//   guest: {},
// };
// record_by_user = {
//   //What's this?
//   host: true,
//   guest: true,
// };

// const mask_set = ["endWithEyes", "endWithMouth", "opposite"];

// var sessionId;
// var sessionRev;
// var startTime;
// var timmer;
// var current_cfg;
// var current_rating;
// var question_selected = [];
// var survey_in_progress = false;
// var stage;

// function generateId(stime) {
//   // let year = stime.getFullYear();
//   // let month = stime.getMonth() + 1;
//   // let day = stime.getDate();
//   // let hours = stime.getHours();
//   // let minutes = stime.getMinutes();
//   // let seconds = stime.getSeconds();
//   // let datestr = year * 10000 + month * 100 + day;

//   // datestr += year + "/" + month + "/" + day;
//   // let timestr = "";
//   // timestr += hours + "/" + minutes + "/" + seconds;
//   // const sid = {
//   //   dateId: datestr,
//   //   timeId: timestr,
//   // };

//   // creating a hash from current timestamp and random number
//   return hash(
//     new Date().getTime().toString() + Math.floor(Math.random() * 100000) + 1
//   );

//   // const sid = datestr.toString();
//   // sessionId = response.id;
// }

// function processStart(room, start_time, cfg) {
//   console.log("+ process start in room: " + room);
//   console.log("config ", cfg);
//   stage = 0;
//   const { duration } = cfg["setting"][0];
//   const questionset = require("./assets/topics/topics.json");
//   const icebreaker = questionset["icebreaker"];
//   const wouldyou = questionset["wouldyou"];
//   const quest = [
//     ...questionset["quest"][current_rating],
//     ...questionset["quest"]["general"],
//   ];

//   let endTime = start_time + 1000 * duration;
//   // create a timmer
//   if (timmer == undefined || (timmer != undefined && timmer["_destroyed"])) {
//     // pick up a questionnaire from the list
//     let stop = false;
//     let count = 0;
//     // start chatting
//     timmer = setInterval(() => {
//       let nowTime = new Date().getTime();
//       if (time_left > 150) {
//         //stage1
//         if (stage != 1) {
//           stage = 1;
//           //send mask
//           console.log(time_left, "stage 1");
//           let mask_setting = cfg["setting"][stage];
//           const rindex = Math.floor(Math.random() * icebreaker.length);
//           let topic = icebreaker[rindex];

//           question_selected.push(topic);
//           console.log("- sending update to projection in room: " + room);
//           chatio.emit(CMDS.SOCKET.STAGE_CONTROL.cmd, {
//             mask: mask_setting,
//             topic: [topic],
//             stage,
//           });
//           projectio.emit(CMDS.SOCKET.STAGE_CONTROL.cmd, {
//             mask: mask_setting,
//             topic: [topic],
//             stage,
//           });
//         }
//       } else if (time_left < 150 && time_left > 90) {
//         //stage2
//         if (stage != 2) {
//           // previous stage finish, raise a survey
//           console.log(
//             "- sending survey start to room: " +
//               room +
//               " (stage: " +
//               stage +
//               ")"
//           );
//           chatio.emit(CMDS.SOCKET.SURVEY_START.cmd, { stage: stage });
//           controlio.emit(CMDS.SOCKET.SURVEY_START.cmd, { stage: stage });
//           survey_in_progress = true;
//           stage = 2;
//           //send mask
//           console.log(time_left, "stage 2");
//           let mask_setting = cfg["setting"][stage];
//           const rindex = Math.floor(Math.random() * wouldyou.length);
//           let topic = wouldyou[rindex];
//           question_selected.push(topic);
//           console.log(
//             "- sending stage control to room: " +
//               room +
//               " (stage: " +
//               stage +
//               ", mask: " +
//               mask_setting +
//               ", topic: " +
//               topic +
//               ")"
//           );
//           chatio.emit(CMDS.SOCKET.STAGE_CONTROL.cmd, {
//             mask: mask_setting,
//             topic: [topic],
//             stage,
//           });
//           controlio.emit(CMDS.SOCKET.STAGE_CONTROL.cmd, { stage });
//         }
//       } else if (time_left < 90 && time_left > 0) {
//         //stage3
//         if (stage != 3) {
//           console.log(
//             "- sending survey start to room: " +
//               room +
//               " (stage: " +
//               stage +
//               ")"
//           );
//           chatio.emit(CMDS.SOCKET.SURVEY_START.cmd, { stage: stage });
//           controlio.emit(CMDS.SOCKET.SURVEY_START.cmd, { stage: stage });
//           survey_in_progress = true;
//           stage = 3;
//           //send mask
//           console.log(time_left, "stage 3");
//           let mask_setting = cfg["setting"][stage];
//           const rindex = Math.floor(Math.random() * quest.length);
//           let topic = quest[rindex];
//           question_selected.push(topic);
//           console.log(
//             "- sending stage control to room: " +
//               room +
//               " (stage: " +
//               stage +
//               ", mask: " +
//               mask_setting +
//               ", topic: " +
//               topic +
//               ")"
//           );
//           chatio.emit(CMDS.SOCKET.STAGE_CONTROL.cmd, { mask: mask_setting, topic, stage });
//           controlio.emit(CMDS.SOCKET.STAGE_CONTROL.cmd, { stage });
//         }
//       }

//       if (time_left <= 0) {
//         if (stage != 4) {
//           stage = 4;
//           console.log(
//             "- sending survey start to room: " +
//               room +
//               " (stage: " +
//               stage +
//               ")"
//           );
//           chatio.emit(CMDS.SOCKET.SURVEY_START.cmd, { stage: stage });
//           controlio.emit(CMDS.SOCKET.SURVEY_START.cmd, { stage: stage });
//           survey_in_progress = true;
//         }
//         if (!stop && !survey_in_progress) {
//           count += 1;
//           console.log("stop count ", count);
//           stop = true;
//           processStop(room, false);
//         }
//       }

//       console.log(
//         "- Second timer for room: " +
//           room +
//           ", stage: " +
//           stage +
//           ", time left: " +
//           time_left
//       );
//     }, 1000);
//   } else {
//     console.log("timmer running", typeof timmer);
//   }
// }
// function processStop(room, accident_stop) {
//   console.log("+ process stop ");
//   if (accident_stop) {
//     question_selected = [];
//   }

//   survey_in_progress = false;
//   // clear timmer
//   clearInterval(timmer);
//   // socket send stop

//   // io.to(room).emit(CMDS.SOCKET.PROCESS_STOP.cmd, { accident_stop });
//   chatio.emit(CMDS.SOCKET.PROCESS_STOP.cmd, { accident_stop });
//   controlio.emit(CMDS.SOCKET.PROCESS_STOP.cmd, { accident_stop });
//   projectio.emit(CMDS.SOCKET.PROCESS_STOP.cmd, { accident_stop });
// }
