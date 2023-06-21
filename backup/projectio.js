projectio.on("connection", (socket) => {
  socket.join("projection-test");

  socket.on("projection-connect", (data) => {
    const { room, user } = data;
    // socket.join("projection-" + room);
    console.log(
      '+ a projection was connected in room: " ' + room + ", user: " + user
    );
  });
});
