import FabricCAServices from "fabric-ca-client";
import { Wallets } from "fabric-network";
import { AdminCredentials, UserCredentials } from "../mongoose/Credentials";
import { CaClient } from "./ca";
import { CustomIdentity, UserIdentity } from "./types/CustomIdentity";
import { ChainWriter } from "./ChainWriter";
import { validatePassword } from "../mongoose/Credentials";

export class CredentialsProvider {
  static adminCredentials: CustomIdentity | undefined;

  static async getAdminCredentials(
    caClient: CaClient
  ): Promise<CustomIdentity> {
    if (this.adminCredentials) {
      return this.adminCredentials;
    }
    const creds =
      process.env.NODE_ENV !== "DEV" ? await AdminCredentials.find({}) : [];

    if (creds.length === 0) {
      console.log("Enrolling admin user");
      return await CredentialsProvider.enrollAdminUser(caClient);
    }
    this.adminCredentials = creds[0];
    return creds[0];
  }

  private static async saveAdminCredentialsToDb(identity: CustomIdentity) {
    // save identity to db
    const creds = new AdminCredentials({ ...identity });
    await creds.save();
  }

  public static async enrollAdminUser(
    caClient: CaClient
  ): Promise<CustomIdentity> {
    console.log("connecting");
    // fix me save api admin user identity in db and write a getter?
    console.log("enrolling adming user");

    let adminId: CustomIdentity = await caClient.enrollApiAdminUser();

    console.log("saving admin credentials to db");
    process.env.NODE_ENV !== "DEV" &&
      (await CredentialsProvider.saveAdminCredentialsToDb(adminId));
    this.adminCredentials = adminId;
    return adminId;
  }

  public static async getUserCredentials(username: string) {
    const userCreds = await UserCredentials.findOne({
      username: username,
    });

    return userCreds;
  }

  public static getEnrollmentId(orgName: string): string {
    const id = process.env[`API_ADMIN_${orgName.toUpperCase()}_USER`];
    if (!id) {
      throw new Error("Enrollment ID not set");
    }
    return id;
  }

  private static getEnrollmentSecret(orgName: string): string {
    const id = process.env[`API_ADMIN_${orgName.toUpperCase()}_PW`];
    if (!id) {
      throw new Error("Enrollment ID not set");
    }
    return id;
  }

  public static async registerUser(
    username: string,
    password: string,
    orgName: string,
    caClient: CaClient
  ): Promise<UserIdentity> {
    if (await CredentialsProvider.getUserCredentials(username)) {
      throw new Error("User already exists");
    }
    const chainWriter = new ChainWriter();
    const gateway = await chainWriter.getGatewayAsAdmin(orgName);
    const idContext = gateway.identityContext;
    const registerRequest: FabricCAServices.IRegisterRequest = {
      enrollmentID: username,
      affiliation: orgName,
      enrollmentSecret: password,
      role: "client",
    };
    if (!idContext) {
      throw new Error("Identity context not set");
    }
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
    let adminIdentity: any = {
      type: adminCreds.type,
      mspId: adminCreds.mspId,
      credentials: {
        certificate: adminCreds.credentials.certificate,
        privateKey: adminCreds.credentials.privateKey,
      },
    };
    const wallet = await Wallets.newInMemoryWallet();

    wallet.put("admin", adminIdentity);
    const provider = wallet
      .getProviderRegistry()
      .getProvider(adminIdentity.type);
    const adminUser = await provider.getUserContext(
      adminIdentity,
      CredentialsProvider.getEnrollmentId(orgName)
    );
    let res = await caClient.registerUser(registerRequest, adminUser);
    console.log("Registered user", res);
    let enrolResponse = await caClient.enrollUser(username, password);
    console.log("Enrolled user");
    const userIdentity: UserIdentity = {
      credentials: {
        certificate: enrolResponse.certificate,
        privateKey: enrolResponse.key.toBytes(),
      },
      mspId: adminCreds.mspId,
      type: "X.509",
      username: username,
      password,
      isValidated: false,
      isAdmin: false,
      _id: undefined,
    };
    return { ...userIdentity };
  }
}
