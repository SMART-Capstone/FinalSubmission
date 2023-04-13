import { getConnectionConfig } from "./config";
import { Gateway, GatewayOptions, Identity } from "fabric-network";
import { CredentialsProvider } from "./CredentialsProvider";
import { CaClient } from "./ca";
import { ClientCredentials, UserCredentials } from "../mongoose/Credentials";
import { CustomIdentity } from "./types/CustomIdentity";
import { BcResponseType } from "../handlers/types/ResponseTypes";

export class ChainWriter {
  private channelName: string | undefined = process.env.CHANNEL_NAME;
  private chaincodeName: string | undefined = process.env.CHAINCODE_NAME;
  private orgName: string | undefined = process.env.ORG_NAME;
  private gateway: Gateway = new Gateway();

  constructor() {}

  private getGatewayOptionsFromCredentials(
    identity: CustomIdentity
  ): GatewayOptions {
    if (!identity.credentials) {
      throw new Error("Identity credential not found");
    }
    let connectionOptions: GatewayOptions = {
      identity: JSON.parse(
        JSON.stringify({
          credentials: { ...identity.credentials },
          mspId: identity.mspId,
          type: identity.type,
        })
      ),
      tlsInfo: {
        certificate: identity.credentials.certificate,
        key: identity.credentials.privateKey,
      },
    };
    return connectionOptions;
  }

  public setChannelName(channelName: string) {
    this.channelName = channelName;
  }

  public setChaincodeName(chaincodeName: string) {
    this.chaincodeName = chaincodeName;
  }

  public setOrgName(orgName: string) {
    this.orgName = orgName;
  }

  private async connectToChainAsUser(username: string) {
    if (!this.orgName || !this.channelName) {
      throw new Error("Query params not set");
    }
    console.log("Connecting to chain as user", username);
    const userCredentials = await UserCredentials.findOne({
      username: username,
    });
    if (!userCredentials || userCredentials.isAdmin) {
      throw new Error("User not found");
    }

    let connectionOptions: GatewayOptions =
      this.getGatewayOptionsFromCredentials(userCredentials);
    const connectionProfile = getConnectionConfig(this.orgName);

    await this.gateway.connect(connectionProfile, connectionOptions);
    let network = await this.gateway.getNetwork(this.channelName);
    return network;
  }

  public async queryChain(
    chaincodeName: string | undefined,
    username: string,
    args: any[],
    functionName: string
  ): Promise<BcResponseType> {
    chaincodeName = chaincodeName || this.chaincodeName;
    if (!chaincodeName) {
      throw new Error("Chaincode name not set");
    }
    let network = await this.connectToChainAsUser(username);
    let contract = network.getContract(chaincodeName);
    const res = await contract.evaluateTransaction(functionName, ...args);
    return JSON.parse(res.toString());
  }

  public async invokeChain(
    chaincodeName: string | undefined,
    args: any[],
    functionName: string,
    username: string
  ): Promise<BcResponseType> {
    console.log("Connecting to chain", username);
    chaincodeName = chaincodeName || this.chaincodeName;
    if (!chaincodeName) {
      throw new Error("Chaincode name not set");
    }
    let network = await this.connectToChainAsUser(username);
    let contract = network.getContract(chaincodeName);
    const res = await contract.submitTransaction(functionName, ...args);
    const bcRes: BcResponseType = JSON.parse(res.toString());
    if (bcRes.message) {
      bcRes.stringMessage = Buffer.from(bcRes.message).toString();
    } else if (bcRes.payload.data) {
      bcRes.stringMessage = Buffer.from(bcRes.payload.data).toString();
    }
    return bcRes;
  }

  public async invokeChainAsAdmin(
    chaincodeName: string | undefined,
    args: any[],
    functionName: string
  ): Promise<BcResponseType> {
    console.log("Connecting to chain as adminn");
    chaincodeName = chaincodeName || this.chaincodeName;
    if (!chaincodeName) {
      throw new Error("Chaincode name not set");
    }
    let network = await this.connectToChainAsAdmin(this.orgName);
    let contract = network.getContract(chaincodeName);
    const res = await contract.submitTransaction(functionName, ...args);
    return JSON.parse(res.toString());
  }

  public async queryChainAsAdmin(
    chaincodeName: string | undefined,
    args: any[],
    functionName: string
  ): Promise<BcResponseType> {
    console.log("Connecting to chain as adminn");
    chaincodeName = chaincodeName || this.chaincodeName;
    if (!chaincodeName) {
      throw new Error("Chaincode name not set");
    }
    let network = await this.connectToChainAsAdmin(this.orgName);
    let contract = network.getContract(chaincodeName);
    const res = await contract.evaluateTransaction(functionName, ...args);
    return JSON.parse(res.toString());
  }

  public async connectToChain() {
    if (!this.channelName || !this.chaincodeName || !this.orgName) {
      throw new Error("Channel name, chaincode name or org name not set");
    }
    const caClient = new CaClient(this.orgName);
    const adminId = await CredentialsProvider.getAdminCredentials(caClient);

    const connectionProfile = getConnectionConfig(this.orgName);

    if (!adminId.type || !adminId.credentials || !adminId.mspId) {
      throw new Error("Admin identity not set: " + adminId);
    }

    console.log("connecting gateway.");
    let connectionOptions = this.getGatewayOptionsFromCredentials(adminId);
    await this.gateway.connect(connectionProfile, connectionOptions);
    console.log("getting network");

    let network = await this.gateway.getNetwork(this.channelName);
    let contract = network.getContract(this.chaincodeName);
    console.log(contract.chaincodeId);
  }

  public async getGatewayAsAdmin(
    orgName: string | undefined
  ): Promise<Gateway> {
    orgName = orgName || this.orgName;
    if (!orgName) {
      throw new Error("Org name not set");
    }
    const caClient = new CaClient(orgName);
    const adminId = await CredentialsProvider.getAdminCredentials(caClient);
    const connectionProfile = getConnectionConfig(orgName);
    let connectionOptions = this.getGatewayOptionsFromCredentials(adminId);
    await this.gateway.connect(connectionProfile, connectionOptions);
    return this.gateway;
  }

  public async connectToChainAsAdmin(orgName: string | undefined) {
    orgName = orgName || this.orgName;
    if (!this.channelName) {
      throw new Error("Channel name not set");
    }
    let gateway = await this.getGatewayAsAdmin(orgName);
    return await gateway.getNetwork(this.channelName);
  }
}
