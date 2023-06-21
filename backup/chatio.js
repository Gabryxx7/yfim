
chatio.on("connection", (socket) => {
  let startFlag = false;
  console.log("+ new connection from a chat socket");
  let rooms = chatio.adapter.rooms["test"];

  if (startFlag) {
    if (rooms === undefined) {
      socket.join("test");
      rooms = chatio.adapter.rooms["test"];
      console.log("++ reconnect from recover ", rooms.length);
    } else if (rooms.length < 2) {
      console.log("++ reconnect from recover ", rooms.length);
      socket.join("test");
      chatio.emit("reconnect");

      console.log("++ reconnect to test room");
    }
    console.log("++ reconnect from recover ", rooms.length);
  }
  chatio.emit("process-stop", { accident_stop: true });

  let room = "";

  socket.on("disconnecting", () => {
    console.log("- client left room: ");
    console.log(socket.rooms);
    processStop("test", true);
  });
  // sending to all clients in the room (channel) except sender
  socket.on("message", (message) =>
    socket.broadcast.to(room).emit("message", message)
  );
  socket.on("find", () => {
    startFlag = true;
    const url = socket.request.headers.referer.split("/");
    room = url[url.length - 2];

    console.log(" - trying to locate room: " + room);

    const sr = chatio.adapter.rooms[room];
    if (sr === undefined) {
      // no room with such name is found so create it
      socket.join(room);
      socket.emit("create");
      console.log("+ new room created: " + room);
    } else if (sr.length === 1) {
      socket.emit("join");
      console.log("- room (" + room + ") exists: try to join.");
      socket.join(room);
    } else {
      // max two clients
      socket.emit("full", room);
      console.log("- room (" + room + ") exists but is full");
    }
  });
  socket.on("auth", (data) => {
    data.sid = socket.id;
    // sending to all clients in the room (channel) except sender
    socket.broadcast.to(room).emit("approve", data);
    console.log("- authenticate client in room " + room);
  });
  socket.on("accept", (id) => {
    // io.sockets.connected[id].join(room);
    // sending to all clients in 'game' room(channel), include sender
    chatio.emit("bridge");
    console.log("- accept client in room " + room);
  });
  socket.on("reject", () => {
    socket.emit("full");
    console.log("- rejected");
  });

  socket.on("leave", () => {
    // sending to all clients in the room (channel) except sender
    socket.broadcast.to(room).emit("hangup");
    socket.leave(room);
    console.log("- client left room: " + room);
    clearInterval(timmer);
  });
  // control room record
  socket.on("control-room", (data) => {
    const room = data.room;
    control_room_list[room] = socket;
    console.log("- received control-room message for room: " + room);
  });
  socket.on("room-idle", (data) => {
    const { room } = data;
    // console.log(`room ${room} is idle now`);
    controlio.emit("room-idle");
    console.log("- room idle: " + room + " -> initiate process stop");
    processStop(room, true);
  });
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
      projectio.emit("stage-control", { stage });
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

    controlio.emit("face-detected");
    chatio.emit("face-detected", user);
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
        console.log(
          "- process start, both users are ready",
          ready_user_by_room
        );
        try {
          console.log("+ both ready: start process");
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
