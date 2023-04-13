var io = require("socket.io")(app)
  .use(function (socket, next) {
    // Wrap the express middleware
    sessionMiddleware(socket.request, {}, next);
  })
  .on("connection", function (socket) {
    var userId = socket.request.session.passport.user;
    console.log("Your User ID is", userId);
  });
