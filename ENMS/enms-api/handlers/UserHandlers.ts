import { Request, Response, NextFunction } from "express";
import { ChainWriter } from "../fabric-helpers/ChainWriter";
import { CaClient } from "../fabric-helpers/ca";
import { CredentialsProvider } from "../fabric-helpers/CredentialsProvider";
import { ApiMessageResponseType } from "./types/ResponseTypes";
import bcrypt from "bcrypt";
import {
  AdminCredentials,
  ClientCredentials,
  UserCredentials,
  validatePassword,
} from "../mongoose/Credentials";
import {
  UserInfo,
  ValidateClientInfo,
  ClientResetKeyInfo,
  RevokeCredentialTypeInfo,
  CredentialTypes,
} from "./types/BlockChainTypes";
import { IRevokeRequest } from "fabric-ca-client";
import { Wallets } from "fabric-network";

const USER_CONTRACT_NAME = "UserSmartContract";

interface ClientInfo {
  Email: string;
  WalletAddress: string;
}
// const getUserInfo = async (req: Request, res: Response) => {
//     // ??
//     let result = req.body;
//     let user: UserInfo = result.data;
//     const userString = JSON.stringify(user)
//     return res.status(200).json({
//             UserInfo: {
//                 Email: user.Email,
//                 UserId: user.UserId,
//                 WalletAddress: user.WalletAddress,
//                 UserType: user.UserType
//             }
//      });
// }

const validateEmail = (email: string) => {
  if (
    email.match(
      /^(([^<>()[\]\\.,;:\s@\"]+(\.[^<>()[\]\\.,;:\s@\"]+)*)|(\".+\"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/
    )
  ) {
    return true;
  }
  return false;
};

const createClientHandler = async (req: Request, res: Response) => {
  try {
    console.log("Request body2: ", req.body, req.params);
    const clientInfo: ClientInfo = req.body;
    const USER_TYPE = "CLIENT";
    if (!process.env.CLIENT_SECRET) {
      throw new Error("Need client secret to register client.");
    }

    if (!validateEmail(clientInfo.Email)) {
      throw new Error("Invalid email");
    }
    let chainWriter = new ChainWriter();
    console.log("Connecting to chain", "USERHANDLER");
    await chainWriter.connectToChain();
    let caClient = new CaClient(process.env.ORG_NAME || "");
    console.log("registering user", "USERHANDLER");
    let credentials = await CredentialsProvider.registerUser(
      clientInfo.Email,
      process.env.CLIENT_SECRET,
      process.env.ORG_NAME || "",
      caClient
    );

    await new ClientCredentials({
      ...credentials,
      isValidated: false,
      password: "",
    }).save();

    console.log("invoking chain", "USERHANDLER");
    let bcRes = await chainWriter.invokeChain(
      process.env.CHAINCODE_NAME,
      [clientInfo.Email, clientInfo.Email, clientInfo.WalletAddress, USER_TYPE],
      USER_CONTRACT_NAME + ":" + "createUser",
      clientInfo.Email
    );

    if (bcRes.status !== 200) {
      throw new Error("Creating user on chain failed, but user was enrolled");
    }

    const apiRes: ApiMessageResponseType = {
      status: bcRes.status,
      message: "Client succesfully created on ENMS",
    };
    console.log(bcRes);
    res.send(apiRes);
  } catch (err) {
    res.status(400).send("unexpected error");
  }
};

const createArtistHandler = async (req: Request, res: Response) => {
  try {
    console.log("Request body2: ", req.body, req.params);
    const userInfo: UserInfo = req.body;
    const USER_TYPE = "ARTIST";
    let chainWriter = new ChainWriter();
    console.log("Connecting to chain", "USERHANDLER");
    await chainWriter.connectToChain();
    if (!validateEmail(userInfo.Email)) {
      throw new Error("Invalid email");
    }
    let caClient = new CaClient(process.env.ORG_NAME || "");
    if (!validatePassword(userInfo.Password)) {
      throw new Error(
        "Password must be at least 8 characters long, one special character, and one uppercase letter"
      );
    }
    console.log("registering user", "USERHANDLER");
    let credentials = await CredentialsProvider.registerUser(
      userInfo.Username,
      userInfo.Password,
      process.env.ORG_NAME || "",
      caClient
    );

    await new UserCredentials({ ...credentials, isValidated: true }).save();

    console.log("invoking chain", "USERHANDLER");
    let bcRes = await chainWriter.invokeChain(
      process.env.CHAINCODE_NAME,
      [userInfo.Username, userInfo.Email, userInfo.WalletAddress, USER_TYPE],
      USER_CONTRACT_NAME + ":" + "createUser",
      userInfo.Username
    );

    if (bcRes.status !== 200) {
      throw new Error("Creating user on chain failed, but user was enrolled");
    }

    const apiRes: ApiMessageResponseType = {
      status: bcRes.status,
      message: "User succesfully created on ENMS",
    };
    console.log(bcRes);
    res.send(apiRes);
  } catch (err) {
    res.status(400).send("Unexpected error");
  }
};

const deleteUserHandler = async (req: Request, res: Response) => {
  if (!process.env.ORG_NAME) {
    throw Error("Require ORG_NAME env value.");
  }
  const credentialTypeInfo: RevokeCredentialTypeInfo = req.body;
  let chainWriter = new ChainWriter();
  await chainWriter.connectToChain();
  if (!req.user || !req.user.username) {
    res.status(400).send("User not logged in");
    return;
  }
  var requester;
  switch (credentialTypeInfo.Type) {
    case CredentialTypes.Artist:
      requester = await UserCredentials.findOne({
        username: req.user.username,
      });
      break;
    case CredentialTypes.Client:
      requester = await ClientCredentials.findOne({
        username: req.user.username,
      });
      break;
    default:
      res.status(400).send("Invalid user type");
      return;
  }
  if (!requester) {
    res.status(404).send("User not found");
    return;
  } else {
    requester.credentials = undefined;
    await requester.save();
    const revocationRequest: IRevokeRequest = {
      enrollmentID: req.user.username,
      reason: credentialTypeInfo.Reason,
    };
    if (!process.env.CA_SERVICE_URL) {
    }
    let caClient = new CaClient(process.env.ORG_NAME || "");
    const adminCreds = await CredentialsProvider.getAdminCredentials(caClient);
    if (
      !adminCreds.mspId ||
      !adminCreds.type ||
      !adminCreds.credentials ||
      !adminCreds.credentials.certificate ||
      !adminCreds.credentials.privateKey
    ) {
      throw new Error("Admin credentials not set");
    }
    const wallet = await Wallets.newInMemoryWallet();
    let adminIdentity: any = {
      type: adminCreds.type,
      mspId: adminCreds.mspId,
      credentials: {
        certificate: adminCreds.credentials.certificate,
        privateKey: adminCreds.credentials.privateKey,
      },
    };
    wallet.put("admin", adminIdentity);
    const provider = wallet
      .getProviderRegistry()
      .getProvider(adminIdentity.type);
    const adminUser = await provider.getUserContext(
      adminIdentity,
      CredentialsProvider.getEnrollmentId(process.env.ORG_NAME)
    );
    await caClient.revokePermission(revocationRequest, adminUser);
  }
  res.send({
    status: 200,
    message: "User Credential Removed from DB/CA Successfully.",
  });
};

const clientResetKeyHandler = async (req: Request, res: Response) => {
  try {
    const clientInfo: ClientResetKeyInfo = req.body;
    const client = await ClientCredentials.findOne({
      username: clientInfo.Email,
    });
    console.log("resetting", clientInfo.Email, client);
    if (!process.env.CLIENT_SECRET) {
      throw new Error("Need client secret to register client.");
    }
    if (!process.env.EXPIRY_TIME) {
      throw new Error("Require Expiry Time.");
    }
    if (!client) {
      res.status(400).send({ status: 404, message: "Client not found" });
      return;
    }
    if (!client.secureLoginToken || !client.secureLoginTokenExpiry) {
      res
        .status(400)
        .send({ status: 400, message: "Invalid Client does not have token" });
      return;
    }
    console.log("validating");
    // change password process

    if (
      client.secureLoginToken &&
      client.secureLoginTokenExpiry &&
      Date.now() < Number(client.secureLoginTokenExpiry)
    ) {
      const isValidToken = await bcrypt.compare(
        clientInfo.Code,
        client.secureLoginToken
      );
      if (!isValidToken) {
        res.status(400).send({ status: 400, message: "Invalid code" });
        return;
      }
      client.isValidated = true;
      client.password = clientInfo.Password;
      client.secureLoginToken = undefined;
      client.secureLoginTokenExpiry = undefined;
      await client.save();
      res.send({ status: 200, message: "Client Key Set" });
      return;
    } else if (!client.secureLoginToken && !client.secureLoginTokenExpiry) {
      if (!client.password) {
        res.status(400).send({ status: 400, message: "No Set Password" });
        return;
      }
      const isGoodPassword = await bcrypt.compare(
        clientInfo.Code,
        client.password
      );
      console.log("current hash", client.password);
      if (!isGoodPassword) {
        res.status(400).send({
          status: 400,
          message: "Invalid Password! Failed to Change Password",
        });
        return;
      }
      client.password = clientInfo.Password;
      await client.save();
      res.send({ status: 200, message: "Client Reset Password." });
    } else if (Date.now() >= Number(client.secureLoginTokenExpiry)) {
      res.status(400).send({ status: 400, message: "Expired." });
    } else {
      res.status(400).send({ status: 400, message: "Invalid." });
    }
  } catch (err) {
    res.status(400).send("Unexpected error");
  }
};

const queryClientExistsHelper = async (
  clientId: string,
  chainWriter: ChainWriter
) => {
  let existOnChain = await chainWriter.queryChainAsAdmin(
    process.env.CHAINCODE_NAME,
    [clientId],
    USER_CONTRACT_NAME + ":" + "getNftByClientId"
  );
  console.log(existOnChain, "EXIST ON CHAIN");
  return existOnChain;
};

export {
  createArtistHandler,
  queryClientExistsHelper,
  createClientHandler,
  clientResetKeyHandler,
  deleteUserHandler,
};
