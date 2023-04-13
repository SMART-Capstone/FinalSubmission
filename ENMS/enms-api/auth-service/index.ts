import express from "express";
import bcrypt from "bcrypt";
import { PassportStatic } from "passport";
import { IVerifyOptions, Strategy as LocalStrategy } from "passport-local";

import { UserCredentials } from "../mongoose/index";
import { UserIdentity } from "../fabric-helpers/types/CustomIdentity";

declare global {
  namespace Express {
    interface User extends UserIdentity {}
  }
}

async function authUser(
  req: express.Request,
  identifier: string,
  password: string,
  done: (
    error: any,
    user?: Express.User | false,
    options?: IVerifyOptions
  ) => void
): Promise<void> {
  try {
   //  console.log(identifier);
    const existingUser = await UserCredentials.findOne({
      username: identifier,
    }).exec();
   //  console.log(existingUser);
    if (existingUser == null) return done(null, false, { message: "User DNE" });
    if (
      !existingUser.credentials ||
      !existingUser.credentials.certificate ||
      !existingUser.credentials.privateKey
    )
      return done(null, false, { message: "Permission Revoked" });

    const stored_pw = existingUser.password || "";
    if (await bcrypt.compare(password, stored_pw)) {
      if (!existingUser.username) {
        throw new Error("no username");
      }
      // console.log("here");

      return done(null, existingUser);
    } else {
      // console.log("here2");
      return done(null, false, { message: "invalid password." });
    }
  } catch (error) {
    console.log(error);
    return done(null, false, { message: String(error) });
  }
}

export function passportInit(passport: PassportStatic) {
  // set up local strategy
  passport.use(
    new LocalStrategy(
      {
        usernameField: "identifier",
        passwordField: "password",
        passReqToCallback: true,
      },
      authUser
    )
  );

  // user serialization and deserialization
  passport.serializeUser((user, done) => done(null, user.username));

  passport.deserializeUser(async (identifier, done) => {
    const currUser = await UserCredentials.findOne({ username: identifier });
    return done(null, currUser);
  });
}

export function checkAuth(
  req: express.Request,
  res: express.Response,
  next: express.NextFunction
) {
  if (req.isAuthenticated()) return next();
  console.log("user is not auth")
  return (res.status(401).send("User is not authenticated"));
}

export function checkNotAuth(
  req: express.Request,
  res: express.Response,
  next: express.NextFunction
) {
  if (!req.isAuthenticated()) return next();
  return res.status(401).send("User is authenticated");
}
