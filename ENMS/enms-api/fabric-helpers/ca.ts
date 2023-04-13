import { getConnectionConfig } from "./config";
import FabricCAServices, {
  IRevokeRequest,
  IRestriction,
} from "fabric-ca-client";
import { CustomIdentity } from "./types/CustomIdentity";
import { User } from "fabric-common";
class CaClient {
  orgName: string;
  constructor(orgName: string) {
    this.orgName = orgName;
  }

  async registerUser(
    req: FabricCAServices.IRegisterRequest,
    registrar: User
  ): Promise<string> {
    const cli = this.createCaClientForOrg();
    console.log("Registering user: ", req);
    return await cli.register(req, registrar);
  }

  async enrollUser(
    username: string,
    secret: string
  ): Promise<FabricCAServices.IEnrollResponse> {
    const cli = this.createCaClientForOrg();
    return await cli.enroll({
      enrollmentID: username,
      enrollmentSecret: secret,
    });
  }

  createCaClientForOrg() {
    const connectionProfile = getConnectionConfig(this.orgName);
    const org =
      connectionProfile.organizations[connectionProfile.client.organization];
    const caKey = org.certificateAuthorities[0];
    const tlscaCerts =
      connectionProfile.certificateAuthorities[caKey].tlsCACerts.pem;
    const tlsOptions: FabricCAServices.TLSOptions = {
      trustedRoots: [tlscaCerts],
      verify: false,
    };
    const url: FabricCAServices.IFabricCAService =
      connectionProfile.certificateAuthorities[caKey].url;
    const cli = new FabricCAServices(
      url,
      tlsOptions,
      connectionProfile.certificateAuthorities[caKey].caName
    );
    return cli;
  }

  async enrollApiAdminUser(): Promise<CustomIdentity> {
    try {
      console.log("enrolling admin user");
      const conn = getConnectionConfig(this.orgName);
      const cli = this.createCaClientForOrg();
      const username =
        process.env[`API_ADMIN_${this.orgName.toUpperCase()}_USER`];
      const userPw = process.env[`API_ADMIN_${this.orgName.toUpperCase()}_PW`];
      if (!username || !userPw) {
        throw new Error(
          `API_ADMIN_${this.orgName.toUpperCase()}_USER or API_ADMIN_${this.orgName.toUpperCase()}_PW not set`
        );
      }
      const reqBody: FabricCAServices.IEnrollmentRequest = {
        enrollmentID: username,
        enrollmentSecret: userPw,
      };
      console.log("Calling enroll: ", reqBody);
      const enrol = await cli.enroll(reqBody);
      console.log("enrolled");
      const x509Identity: CustomIdentity = {
        credentials: {
          certificate: enrol.certificate,
          privateKey: enrol.key.toBytes(),
        },
        mspId: conn.organizations[conn.client.organization].mspid,
        type: "X.509",
        isValidated: true,
        isAdmin: true,
        _id: undefined,
      };
      return x509Identity;
    } catch (err) {
      console.log(err);
      throw err;
    }
  }

  async revokePermission(revokeRequest: IRevokeRequest, admin: User) {
    const cli = this.createCaClientForOrg();
    cli.revoke(revokeRequest, admin);
    const restriction: IRestriction = {
      revokedBefore: new Date(),
    };
    const crl = await cli.generateCRL(restriction, admin);
    console.log(crl, "CRL Generated");
  }
}
export { CaClient };
