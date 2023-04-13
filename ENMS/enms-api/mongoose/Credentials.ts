import { mongo, Schema } from "mongoose";
import BaseModel from "./BaseModel";
import mongoose from "mongoose";
import {
  ClientIdentity,
  CustomIdentity,
  UserIdentity,
} from "../fabric-helpers/types/CustomIdentity";
import bcrypt from "bcrypt";
import crypto from "crypto";
const ADMIN_CREDENTIALS_TYPE = "AdminCredentials";
const USER_CREDENTIALS_TYPE = "UserCredentials";
const CREDENTIALS_TYPE = "CREDENTIALS";
const CLIENT_CREDENTIALS_TYPE = "ClientCredentials";
const options = { discriminatorKey: "kind" };

export const validatePassword = (password: string) => {
  // Minimum eight characters, at least one uppercase letter, one lowercase letter, one number and one special character.
  const regex = new RegExp(
    "^(?=.*[a-z])(?=.*[A-Z])(?=.*[0-9])(?=.*[!@#$%^&*,.])[A-Za-z0-9@$!@#$%^&*.,]{8,}$"
  );
  return regex.test(password);
};

const credentialsBase = {
  ...BaseModel,
  credentials: {
    certificate: String,
    privateKey: String,
  },
  mspId: String,
  type: String,
  isValidated: Boolean,
  isAdmin: { type: Boolean, default: false },
};

const AdminCredentials = mongoose.model<CustomIdentity>(
  ADMIN_CREDENTIALS_TYPE,
  new Schema(
    { ...credentialsBase, isAdmin: { type: Boolean, default: true } },
    options
  )
);
const userCredentialsSchema = new Schema<UserIdentity>(
  {
    ...credentialsBase,
    username: { type: String, unique: true, required: true },
    password: String,
    isValidated: { type: Boolean, default: true },
  },
  options
);

userCredentialsSchema.pre("save", async function (next) {
  console.log(this.isValidated, this.password, 232);
  if (this.isModified("password") && this.password) {
    //Minimum eight characters, at least one uppercase letter, one lowercase letter, one number and one special character.
    if (!validatePassword(this.password)) {
      // throw new Error("Password is invalid,");
    } else {
      this.password = await bcrypt.hash(this.password, 12);
      console.log(this.password);
    }
  }
});

const UserCredentials = mongoose.model<UserIdentity>(
  USER_CREDENTIALS_TYPE,
  userCredentialsSchema
);

const clientCredentialsSchema = new Schema<ClientIdentity>(
  {
    secureLoginToken: String,
    secureLoginTokenExpiry: Date,
    username: { type: String, unique: true, required: true },
    password: String,
    isValidated: { type: Boolean, default: false },
  },
  options
);

const ClientCredentials = UserCredentials.discriminator<ClientIdentity>(
  CLIENT_CREDENTIALS_TYPE,
  clientCredentialsSchema
);

const getVerifiedEmailToken = function () {
  let emailToken = crypto.randomBytes(5).toString("hex");
  return emailToken;
};

export {
  ADMIN_CREDENTIALS_TYPE,
  AdminCredentials,
  UserCredentials,
  ClientCredentials,
  clientCredentialsSchema,
  getVerifiedEmailToken,
};
