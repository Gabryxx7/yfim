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

// CouchDB
// const nano = require("nano")("http://admin:admin@localhost:5984");
const nano = require("nano")(process.env.COUCHDB_URL);
const tableName = "occlusion_mask";

// const db = nano.db.use(tableName);

nano.db
  .create(process.env.DB_NAME)
  .then((data) => {
    // success - response is in 'data'
    console.log("New database created: " + process.env.DB_NAME);
    couch = nano.use(process.env.DB_NAME);
    app.set("couch", couch);
  })
  .catch((err) => {
    // failure - error information is in 'err'
    console.log("Connected to existing database: " + process.env.DB_NAME);
    couch = nano.use(process.env.DB_NAME);
    app.set("couch", couch);
  });

const app = express(),
  options = {
    key: fs.readFileSync(__dirname + "/rtc-video-room-key.pem"),
    cert: fs.readFileSync(__dirname + "/rtc-video-room-cert.pem"),
  },
  port = process.env.PORT || 3000,
  server =
    process.env.NODE_ENV === "production"
      ? http.createServer(app).listen(port)
      : https.createServer(options, app).listen(port),
  io = sio(server);

chatio = io.of("chat");
controlio = io.of("control");
projectio = io.of("projection");

console.log("starting server on port: " + port);

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

control_room_list = {};
ready_user_by_room = {};
rating_by_user = {};
projection_room_list = {};
survey_room_list = {};

survey_socket = {
  //? Does the app support multiple concurring conversations in different rooms? What happens if new rooms are opened?
  guest: undefined,
  host: undefined,
};

emotion_ready = { host: false, guest: false };
question_ready = { host: false, guest: false };
survey_ready = { host: false, guest: false };
emotion_data = {
  host: {},
  guest: {},
};
question_data = {
  host: {},
  guest: {},
};
record_by_user = {
  //What's this?
  host: true,
  guest: true,
};

const mask_set = ["endWithEyes", "endWithMouth", "opposite"];

var sessionId;
var sessionRev;
var startTime;
var timmer;
var current_cfg;
var current_rating;
var topic_selected = [];
var survey_in_progress = false;
var stage;

function generateId(stime) {
  // let year = stime.getFullYear();
  // let month = stime.getMonth() + 1;
  // let day = stime.getDate();
  // let hours = stime.getHours();
  // let minutes = stime.getMinutes();
  // let seconds = stime.getSeconds();
  // let datestr = year * 10000 + month * 100 + day;

  // datestr += year + "/" + month + "/" + day;
  // let timestr = "";
  // timestr += hours + "/" + minutes + "/" + seconds;
  // const sid = {
  //   dateId: datestr,
  //   timeId: timestr,
  // };

  // creating a hash from current timestamp and random number
  return hash(
    new Date().getTime().toString() + Math.floor(Math.random() * 100000) + 1
  );

  // const sid = datestr.toString();
  // sessionId = response.id;
}

function processStart(room, start_time, cfg) {
  console.log("+ process start in room: " + room);
  console.log("config ", cfg);
  stage = 0;
  const { duration } = cfg["setting"][0];
  const questionset = require("./assets/topics/topics.json");
  const icebreaker = questionset["icebreaker"];
  const wouldyou = questionset["wouldyou"];
  const quest = [
    ...questionset["quest"][current_rating],
    ...questionset["quest"]["general"],
  ];

  let endTime = start_time + 1000 * duration;
  // create a timmer
  if (timmer == undefined || (timmer != undefined && timmer["_destroyed"])) {
    // pick up a questionnaire from the list
    let stop = false;
    let count = 0;
    // start chatting
    timmer = setInterval(() => {
      let nowTime = new Date().getTime();
      if (survey_in_progress) {
        let extend_time = 0;
        if (stage == 2) {
          extend_time = 1000 * 150;
        }
        if (stage == 3) {
          extend_time = 1000 * 90;
        }
        endTime = nowTime + extend_time;
      }
      let time_left = Math.round((endTime - nowTime) / 1000);

      if (time_left > 150) {
        //stage1
        if (stage != 1) {
          stage = 1;
          //send mask
          console.log(time_left, "stage 1");
          let mask_setting = cfg["setting"][stage];
          const rindex = Math.floor(Math.random() * icebreaker.length);
          let topic = icebreaker[rindex];

          topic_selected.push(topic);
          console.log("- sending update to projection in room: " + room);
          chatio.emit("stage-control", {
            mask: mask_setting,
            topic: [topic],
            stage,
          });
          projectio.emit("stage-control", {
            mask: mask_setting,
            topic: [topic],
            stage,
          });
        }
      } else if (time_left < 150 && time_left > 90) {
        //stage2
        if (stage != 2) {
          // previous stage finish, raise a survey
          console.log(
            "- sending survey start to room: " +
              room +
              " (stage: " +
              stage +
              ")"
          );
          chatio.emit("survey-start", { stage: stage });
          controlio.emit("survey-start", { stage: stage });
          survey_in_progress = true;
          stage = 2;
          //send mask
          console.log(time_left, "stage 2");
          let mask_setting = cfg["setting"][stage];
          const rindex = Math.floor(Math.random() * wouldyou.length);
          let topic = wouldyou[rindex];
          topic_selected.push(topic);
          console.log(
            "- sending stage control to room: " +
              room +
              " (stage: " +
              stage +
              ", mask: " +
              mask_setting +
              ", topic: " +
              topic +
              ")"
          );
          chatio.emit("stage-control", {
            mask: mask_setting,
            topic: [topic],
            stage,
          });
          controlio.emit("stage-control", { stage });
        }
      } else if (time_left < 90 && time_left > 0) {
        //stage3
        if (stage != 3) {
          console.log(
            "- sending survey start to room: " +
              room +
              " (stage: " +
              stage +
              ")"
          );
          chatio.emit("survey-start", { stage: stage });
          controlio.emit("survey-start", { stage: stage });
          survey_in_progress = true;
          stage = 3;
          //send mask
          console.log(time_left, "stage 3");
          let mask_setting = cfg["setting"][stage];
          const rindex = Math.floor(Math.random() * quest.length);
          let topic = quest[rindex];
          topic_selected.push(topic);
          console.log(
            "- sending stage control to room: " +
              room +
              " (stage: " +
              stage +
              ", mask: " +
              mask_setting +
              ", topic: " +
              topic +
              ")"
          );
          chatio.emit("stage-control", { mask: mask_setting, topic, stage });
          controlio.emit("stage-control", { stage });
        }
      }

      if (time_left <= 0) {
        if (stage != 4) {
          stage = 4;
          console.log(
            "- sending survey start to room: " +
              room +
              " (stage: " +
              stage +
              ")"
          );
          chatio.emit("survey-start", { stage: stage });
          controlio.emit("survey-start", { stage: stage });
          survey_in_progress = true;
        }
        if (!stop && !survey_in_progress) {
          count += 1;
          console.log("stop count ", count);
          stop = true;
          processStop(room, false);
        }
      }

      console.log(
        "- Second timer for room: " +
          room +
          ", stage: " +
          stage +
          ", time left: " +
          time_left
      );
    }, 1000);
  } else {
    console.log("timmer running", typeof timmer);
  }
}
function processStop(room, accident_stop) {
  console.log("+ process stop ");
  if (accident_stop) {
    topic_selected = [];
  }

  survey_in_progress = false;
  // clear timmer
  clearInterval(timmer);
  // socket send stop

  // io.to(room).emit("process-stop", { accident_stop });
  chatio.emit("process-stop", { accident_stop });
  controlio.emit("process-stop", { accident_stop });
  projectio.emit("process-stop", { accident_stop });
}
async function storeData(room) {
  const results = {
    guest: question_data["guest"],
    host: question_data["host"],
  };
  let phase_result = [];
  for (let i = 0; i < 3; i++) {
    const data = {
      topic: topic_selected[i],
      mask_setting: current_cfg["setting"][i + 1],
      host: {
        survey: question_data["host"][i],
        emotions: emotion_data["host"][i],
      },
      guest: {
        survey: question_data["guest"][i],
        emotions: emotion_data["guest"][i],
      },
    };
    phase_result.push(data);
  }

  const audio = {
    host: record_by_user["host"] ? startTime.toString() + "_host.webm" : "none",
    guest: record_by_user["guest"]
      ? startTime.toString() + "_guest.webm"
      : "none",
  };

  // const video = {
  //   host: record_by_user["host"]
  //     ? startTime.toString() + "_host_video.webm"
  //     : "none",
  //   guest: record_by_user["guest"]
  //     ? startTime.toString() + "_guest_host_video.webm"
  //     : "none",
  // };
  const data = {
    _id: startTime.toString(),
    start_time_stamp: sessionId,
    start_time: startTime,
    phase_01: phase_result[0],
    phase_02: phase_result[1],
    phase_03: phase_result[2],
    audio: audio,
  };
  topic_selected = [];
  emotion_ready = { host: false, guest: false };
  question_ready = { host: false, guest: false };
  emotion_data = {
    host: {},
    guest: {},
  };
  question_data = {
    host: {},
    guest: {},
  };
  record_by_user = {
    host: false,
    guest: false,
  };
  console.log(data);
  chatio.emit("upload-finish", results);
  const response = await couch
    .insert(data)
    .then((res) => {
      console.log("+ SUCCESS: all data saved in db: ");
      console.log(res);
    })
    .catch((error) => {
      console.log("- ERROR: could not save data in db");
      console.log(error);
    });
}
// chatio.js
// controlio.js
// projectio.js
