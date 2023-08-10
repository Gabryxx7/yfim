
controlio.on("connection", (socket) => {
  console.log("+ new connection from a socket");
  let rooms = controlio.adapter.rooms["survey-test"];

  if (rooms === undefined) {
    socket.join("survey-test");
    rooms = controlio.adapter.rooms["survey-test"];
    console.log("++ control reconnect from recover ", rooms.length);
  } else if (rooms.length < 2) {
    console.log("++ control reconnect from recover ", rooms.length);
    socket.join("survey-test");
    controlio.emit("room-idle");
  }

  socket.on("disconnecting", () => {
    console.log("- client left room: ");
    console.log(socket.rooms);
  });

  //survey
  socket.on("survey-connect", (data) => {
    const { room, user } = data;
    socket.join("survey-" + room);
    survey_socket[user] = socket;
    console.log(
      "+ a survey was connected in room: " + room + ", user: " + user
    );
  });
  socket.on("data-connect", () => {
    db.view("search", "all", function (err, data) {
      const len = data.rows.length;
      console.log("- on data-connect()");
      console.log(data.rows, len);
      socket.emit("data-retrieve", data.rows);
    });
  });
  // survey send and control
  socket.on("survey-start", (data) => {
    console.log("survey start", data);
    const params_room = data.room;
    socket.broadcast.to(params_room).emit("survey-start");
    socket.broadcast.to("survey-" + params_room).emit("survey-start");
    console.log('+ send survey and room control in room: " ' + room);
  });
  socket.on("survey-end", (data) => {
    const { room, user } = data;
    console.log('- survey was ended in room: " ' + room + ", user: " + user);
    survey_ready[user] = true;
    console.log(
      "- Who`s ready? Guest: " +
        survey_ready["guest"] +
        ", Host: " +
        survey_ready["host"]
    );
    if (survey_ready["guest"] && survey_ready["host"]) {
      survey_in_progress = false;
      survey_ready = { host: false, guest: false };
      let stage_startTime = new Date().getTime();
      let extend_time = 0;
      if (stage == 2) {
        extend_time = 150;
      }
      if (stage == 3) {
        extend_time = 90;
      }
      let duration = extend_time;
      console.log("moving on: after", duration);
      chatio.emit("survey-end", { stage_startTime, duration, stage });
      projectio.emit("stage-control", {
        stage,
      });
    }
  });
  socket.on("reset", (data) => {
    const { room } = data;
    console.log("- resetting room: " + room);
    processStop(room, true);
  });

  socket.on("face-detected", (data) => {
    const { room, user } = data;
    console.log(
      "- face-detected received in room: " + room + ", user: " + user
    );
    if (survey_socket[user] != undefined) {
      const sid = survey_socket[user].id;
      controlio.emit("face-detected");
      chatio.emit("face-detected", user);
    }
  });
  socket.on("process-control", (data) => {
    const params_room = data.room;

    current_cfg = data.cfg;
    current_rating = data.topic;

    console.log("+ process-control received: ");
    console.log(current_cfg);
    console.log(current_rating);

    socket.broadcast.to(params_room).emit("process-control");
  });
  socket.on("process-ready", (data) => {
    const { room, user, rating, record } = data;
    // socket.broadcast.to(room).emit("process-start");
    console.log(`+ ${user} in room ${room} is ready to record: `, record);

    if (room in ready_user_by_room) {
      ready_user_by_room[room][user] = true;
      rating_by_user[user] = rating;
      record_by_user[user] = record;
      if (
        ready_user_by_room[room]["host"] &&
        ready_user_by_room[room]["guest"]
      ) {
        try {
          console.log("+ both ready: start process", ready_user_by_room);
          startTime = new Date().getTime();
          // processStart(room, startTime, current_cfg);

          sessionId = generateId(new Date(startTime));

          let mask_id = Math.floor(Math.random() * 3);
          current_cfg = require("./assets/MaskSetting/" +
            mask_set[mask_id] +
            ".json");
          current_rating = "general";
          if (rating_by_user["host"] == rating_by_user["guest"]) {
            current_rating = rating_by_user["host"];
          }

          console.log("- current rating:");
          console.log(current_rating);
          console.log("- rating by user:");
          console.log(rating_by_user);

          processStart(room, startTime, current_cfg);
          const { duration } = current_cfg["setting"][0];
          chatio.emit("process-start", {
            startTime,
            duration,
            record_by_user,
            sessionId,
          });
          controlio.emit("process-start");

          console.log("- resetting ready_user_by_room for next survey (?)");
          ready_user_by_room[room] = {
            host: false,
            guest: false,
          };
        } catch (err) {
          console.log(
            "Ooops! Something went wrong: Please confirm that the admin has started the process"
          );
          console.log(err);
        }

        // socket.broadcast.to(room).emit("process-start");
        // socket.emit("process-start");
      } else {
        console.log("- not all users ready yet");
      }
    } else {
      ready_user_by_room[room] = {
        host: false,
        guest: false,
      };
      ready_user_by_room[room][user] = true;
      rating_by_user[user] = rating;
      record_by_user[user] = record;
    }
    console.log("- ready_user_by_room:");
    console.log(ready_user_by_room);

    console.log("- rating_by_user:");
    console.log(rating_by_user);

    console.log("- record_by_user:");
    console.log(record_by_user);
  });
  socket.on("process-stop", (data) => {
    console.log("- process-stop");
    console.log(data);

    const params_room = data.room;
    control_socket = control_room_list[params_room];
    control_socket.emit("process-stop");
  });

  socket.on("data-send", (data_get) => {
    console.log("- data-send");
    console.log(data_get);

    const { data_type, data, user, room } = data_get;
    if (data_type == "question") {
      question_ready[user] = true;
      question_data[user] = data;
    } else if (data_type == "emotion") {
      emotion_ready[user] = true;
      emotion_data[user] = data;
    }
    setTimeout(() => {
      console.log("waiting for data uploading");
      if (
        emotion_ready["host"] &&
        emotion_ready["guest"] &&
        question_ready["host"] &&
        question_ready["guest"]
      ) {
        console.log("- call store data");
        storeData(room);
      }
    }, 5000);
  });

  socket.on("control", (data) => {
    console.log("- control");
    console.log(data);

    const params_room = data.room;
    const params_data = data.data;
    socket.broadcast.to(params_room).emit("control", params_data);
  });
});
