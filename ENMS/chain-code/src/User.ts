import { Returns } from "fabric-contract-api";
import {
  Object,
  Property,
  Transaction,
  Contract,
  Context,
  Info,
} from "fabric-contract-api";
import { ChaincodeResponse, Shim } from "fabric-shim";
import stringify from "json-stringify-deterministic";
import sortKeysRecursive from "sort-keys-recursive";
import { ArtistContract } from "./ArtistContract";
import { AuthChecker } from "./HelperTypes/AuthChecker";
import { UserTypes } from "./HelperTypes/EnumTypes";
export const USER_DOC_TYPE = "USER";

@Object()
export class User {
  @Property()
  public UserId: string;

  @Property()
  public DocType: string;

  @Property()
  public Email: string;

  @Property()
  public WalletAddress: string;

  @Property()
  public UserType: string;

  @Property()
  public NftIds: string;
}

@Info({ title: "UserContract", description: "Smart contract for users" })
export class UserSmartContract extends Contract {
  @Transaction()
  public async createUser(
    ctx: Context,
    UserId: string,
    Email: string,
    WalletAddress: string,
    UserType: string
  ): Promise<ChaincodeResponse> {
    // console.log(ctx.clientIdentity.getID());
    const user = new User();
    if (!AuthChecker.checkAuth(ctx, UserId)) {
      return Shim.error(Buffer.from("Unauthorized"));
    }
    user.UserId = UserId;
    user.DocType = USER_DOC_TYPE;
    user.Email = Email;
    user.WalletAddress = WalletAddress;
    user.NftIds = JSON.stringify([]);
    if (!(UserType in UserTypes)) {
      return Shim.error(Buffer.from("Invalid user type"));
    }

    user.UserType = UserType;
    const { ...object } = user;

    console.info(`User ${user} initialized`);
    console.info(`Buffer input ${stringify(sortKeysRecursive(object))}`);

    try {
      await ctx.stub.putState(
        user.UserId,
        Buffer.from(stringify(sortKeysRecursive(object)))
      );
      return Shim.success();
    } catch (error) {
      return Shim.error(Buffer.from(error + " USER01"));
    }
  }

  @Transaction(false)
  public async getUser(
    ctx: Context,
    UserId: string
  ): Promise<ChaincodeResponse> {
    const user = await ctx.stub.getState(UserId);
    if (!user || user.length === 0) {
      return Shim.error(Buffer.from("User does not exist"));
    }
    if (!AuthChecker.checkAuth(ctx, UserId)) {
      return Shim.error(Buffer.from("Unauthorized"));
    }
    return Shim.success(user);
  }

  @Transaction(false)
  @Returns("boolean")
  public async getClientOfContract(ctx: Context, contract: ArtistContract) {
    if (AuthChecker.checkAuth(ctx, contract.ArtistId) === false) {
      return Shim.error(Buffer.from("Unauthorized"));
    }
    const user = await ctx.stub.getState(contract.ClientId);
    if (!user || user.length === 0) {
      return Shim.error(Buffer.from("User does not exist"));
    }
    return Shim.success(user);
  }

  @Transaction(false)
  @Returns("boolean")
  public async clientExists(ctx: Context, UserId: string): Promise<boolean> {
    const user = await ctx.stub.getState(UserId);
    if (!user || user.length === 0) {
      return false;
    }
    console.log("Found user: " + user + " for id: " + UserId);
    let is_client = JSON.parse(user.toString()).UserType === UserTypes.CLIENT;
    return is_client;
  }

  @Transaction(false)
  @Returns("boolean")
  public async artistExists(ctx: Context, UserId: string): Promise<boolean> {
    const user = await ctx.stub.getState(UserId);
    console.log("Found user: " + user + " for id: " + UserId);
    if (!user || user.length === 0) {
      return false;
    }
    let is_artist = JSON.parse(user.toString()).UserType === UserTypes.ARTIST;
    return is_artist;
  }
}
