import { ObjectId } from "mongoose";

export interface CustomIdentity {
  credentials:
    | {
        certificate: string;
        privateKey: string;
      }
    | undefined;
  mspId: string | undefined;
  type: string | undefined;
  isValidated: boolean | undefined;
  isAdmin: boolean | undefined;
  _id: ObjectId | undefined;
}
export interface UserIdentity extends CustomIdentity {
  username: string | undefined;
  password: string | undefined;
}
export interface ClientIdentity extends UserIdentity {
  secureLoginToken: string | undefined;
  secureLoginTokenExpiry: number | undefined;
}
