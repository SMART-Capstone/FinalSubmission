"use strict";
import express from "express";
import mongoose from "mongoose";
import dotenv from "dotenv";
import Path from "path";
import bodyParser from "body-parser";
import passport from "passport";
import session from "express-session";

import { userRouter } from "./endpoints/User";
import { artistContractRouter } from "./endpoints/ArtistContract";
import { milestoneRouter } from "./endpoints/Milestone";
import { disputeRouter } from "./endpoints/Dispute";
import { nftRouter } from "./endpoints/Nft";
import cors from "cors";
import { passportInit, checkAuth, checkNotAuth } from "./auth-service";
import { uploadFile, deleteFile } from "./handlers/MilestoneHandlers";
import fileUpload from "express-fileupload";
import http from "http";
import socket from "socket.io";

const app = express();

var jsonParser = bodyParser.json();

let result = dotenv.config({ path: `${__dirname}` + Path.sep + `.env` });

console.log("Allowing: ", process.env.CLIENT_URL);

if (result.error) {
  throw new Error("Could not find .env file " + result.error);
}

if (!process.env.DATABASE) {
  throw new Error("Please define the DATABASE variable in your .env file");
}

if (!process.env.DB_USERNAME || !process.env.DB_PASSWORD) {
  throw new Error(
    "Please define the DB_USERNAME and DB_PASSWORD variables in your .env file"
  );
}
if (!process.env.SESSION_SECRET) {
  throw new Error("Please define the SESSION_SECRET in your .env file");
}

let db = process.env.DATABASE.replace("<DB_PASSWORD>", process.env.DB_PASSWORD);
db = db.replace("<DB_USERNAME>", process.env.DB_USERNAME);

app.use(express.urlencoded({ extended: true }));
const SESSION_CONFIG = session({
  secret: process.env.SESSION_SECRET,
  resave: false,
  saveUninitialized: false,
});

app.use(SESSION_CONFIG);
passportInit(passport);
app.use(passport.initialize());
app.use(passport.session());

app.get("/", (req, res) => {
  res.send("Hello World!");
});

app.use(fileUpload({ useTempFiles: true, tempFileDir: "/tmp/" }));

app.use(cors({ origin: process.env.CLIENT_URL, credentials: true }));

app.post("/upload", checkAuth, uploadFile);

app.post("/delete", checkAuth, jsonParser, deleteFile);

app.use("/User", jsonParser, userRouter);

app.use("/Contract", checkAuth, jsonParser, artistContractRouter);

app.use("/Milestone", checkAuth, milestoneRouter);

app.use("/Dispute", checkAuth, jsonParser, disputeRouter);

app.use("/NFT", checkAuth, jsonParser, nftRouter);

app.post("/login", checkNotAuth, passport.authenticate("local"), (req, res) => {
  console.log("successfully logged in");
  res.json({ message: `Successfully logged in as ${req.body.identifier}` });
});

app.post("/login/user", checkAuth, (req, res) => {
  const userObj = req.user as any;
  res.status(200).json({
    username: req.user?.username,
    kind: userObj.kind,
    _id: req.user?._id,
    credentials: req.user?.credentials,
  });
});

app.delete("/logout", checkAuth, (req, res) => {
  req.logOut(function (err) {
    if (err) return res.status(400).send("Logout failed");
    return res.status(200).send("Logout success");
  });
});

mongoose
  .connect(db, {})
  .then(async (connected) => {
    if (connected) {
      console.log("MongoDB connected");
      /**
       * This code shows how to interact with blockchain
       */
      // let chainWriter = new ChainWriter();
      // await chainWriter.connectToChain();
      // let caClient = new CaClient(process.env.ORG_NAME || "");
      // await CredentialsProvider.registerUser(
      //   "aowenstadsd33364512553345",
      //   "randomPasswo432%",
      //   process.env.ORG_NAME || "",
      //   caClient
      // );
      // if (!process.env.CHAINCODE_NAME) {
      //   throw new Error("Chaincode name not set");
      // }
      // let res = await chainWriter.invokeChain(
      //   process.env.CHAINCODE_NAME,
      //   ["1234", "user", "t@ualberta.ca", "CLIENT"],
      //   "createUser",
      //   "aowenstadsd33364512553345"
      // );
      // console.log(res);
      // console.log("block chain connnected");
    }
  })
  .catch((err) => console.log(err));

const port = process.env.PORT || 3000;

let server = http.createServer(app);

server.listen(port, () => {
  console.log(`Listening on port ${port}...`);
});

var io = require("socket.io")(server, {
  cors: {
    origin: process.env.CLIENT_URL,
    methods: ["GET", "POST"],
    credentials: true,
  },
});

io.sockets
  .use(function (socket: any, next: any) {
    // Wrap the express middleware
    SESSION_CONFIG(socket.request, {} as any, next);
  })
  .on("connection", async function (socket: any) {
    console.log("connecting");
    if (!socket.request.session.passport) {
      console.log("not auth");
      socket.disconnect();
      return;
    }
    var userId = socket.request.session.passport.user;
    socket.join(userId);
    console.log("Your User ID is", userId);
  });

export { io };
