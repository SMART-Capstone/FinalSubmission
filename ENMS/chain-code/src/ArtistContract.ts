import { Returns } from "fabric-contract-api";
import {
  Object,
  Property,
  Transaction,
  Contract,
  Context,
  Info,
} from "fabric-contract-api";
import { HistoryQueryResult } from "./HelperTypes/HistoryQueryResult";
import { ChaincodeResponse, Iterators, Shim } from "fabric-shim";
import stringify from "json-stringify-deterministic";
import sortKeysRecursive from "sort-keys-recursive";
import { Dispute, DisputeSmartContract, DISPUTE_DOC_TYPE } from "./Dispute";
import {
  Milestone,
  MilestoneSmartContract,
  MilestoneStatuses,
  MILESTONE_DOC_TYPE,
} from "./Milestone";
import { UserSmartContract } from "./User";
import { AuthChecker } from "./HelperTypes/AuthChecker";

export enum ContractStatuses {
  INPROGRESS = "INPROGRESS",
  INDISPUTE = "INDISPUTE",
  COMPLETED = "COMPLETED",
  MINTED = "MINTED",
}

export const ARTIST_CONTRACT_DOC_TYPE = "ARTISTCONTRACT";

@Object()
export class ArtistContract {
  @Property()
  MilestoneIds: string;

  @Property()
  ArtistId: string;

  @Property()
  ClientId: string;

  @Property()
  Status: string;

  @Property()
  DisputeIds: string;

  @Property()
  NftId: string;

  @Property()
  ContractId: string;

  @Property()
  CurrentMilestone: number;

  @Property()
  DocType: string;
}

@Info({
  title: "ArtistContract",
  description: "Smart contract for artist's contracts",
})
export class ArtistContractSmartContract extends Contract {
  @Transaction()
  public async createArtistContract(
    ctx: Context,
    milestones: string,
    ArtistId: string,
    ClientId: string,
    ContractId: string,
    StartDate: number
  ) {
    let artistContract = new ArtistContract();
    let userContract = new UserSmartContract();
    let milestoneInstances: Milestone[] = [];
    let MilestoneIds: string[] = [];
    if (!AuthChecker.checkAuth(ctx, ArtistId)) {
      return Shim.error(Buffer.from("Unauthorized" + " ARTISTCONTRACT12"));
    }
    artistContract.DocType = ARTIST_CONTRACT_DOC_TYPE;
    artistContract.ArtistId = ArtistId;
    artistContract.ClientId = ClientId;
    artistContract.Status = ContractStatuses.INPROGRESS;
    artistContract.DisputeIds = JSON.stringify([]);
    artistContract.CurrentMilestone = 0;
    artistContract.NftId = null;
    artistContract.ContractId = ContractId;
    if (!(await userContract.artistExists(ctx, ArtistId))) {
      return Shim.error(
        Buffer.from("Artist does not exist" + " ARTISTCONTRACT03")
      );
    }
    if (!(await userContract.clientExists(ctx, ClientId))) {
      return Shim.error(
        Buffer.from("Client does not exist" + " ARTISTCONTRACT04")
      );
    }

    if (await this.artistContractExists(ctx, ContractId)) {
      return Shim.error(
        Buffer.from("Contract already exists" + " ARTISTCONTRACT05")
      );
    }

    try {
      milestoneInstances = <Milestone[]>JSON.parse(milestones);
    } catch (error) {
      console.log(error);
      return Shim.error(
        Buffer.from("Invalid milestone " + error + " ARTISTCONTRACT01")
      );
    }
    let milestoneSmartContract = new MilestoneSmartContract();

    if (milestoneInstances.length == 0) {
      return Shim.error(
        Buffer.from("Milestones cannot be empty" + " ARTISTCONTRACT06")
      );
    }

    for (let i = 0; i < milestoneInstances.length; i++) {
      console.log("Creating milestone", milestoneInstances[i].MilestoneId);
      milestoneInstances[i].StartDate = null;
      if (i == 0) {
        milestoneInstances[i].StartDate = StartDate;
        milestoneInstances[i].Status = MilestoneStatuses.INPROGRESS;
      }
      if (
        await milestoneSmartContract.milestoneExists(
          ctx,
          milestoneInstances[i].MilestoneId
        )
      ) {
        return Shim.error(
          Buffer.from("Milestone already exists" + " ARTISTCONTRACT02")
        );
      }
      MilestoneIds.push(milestoneInstances[i].MilestoneId);
      let res: ChaincodeResponse = await milestoneSmartContract.createMilestone(
        ctx,
        milestoneInstances[i].MilestoneId,
        milestoneInstances[i].ActionType,
        milestoneInstances[i].Amount,
        JSON.stringify(artistContract),
        milestoneInstances[i].StartDate,
        milestoneInstances[i].Currency,
        milestoneInstances[i].Status
      );
      if (res.status != 200) {
        return res;
      }
    }

    artistContract.MilestoneIds = JSON.stringify(MilestoneIds);
    const { ...object } = artistContract;
    console.info(`Buffer input ${stringify(sortKeysRecursive(object))}`);
    try {
      await ctx.stub.putState(
        artistContract.ContractId,
        Buffer.from(stringify(sortKeysRecursive(object)))
      );
      return Shim.success();
    } catch (error) {
      return Shim.error(Buffer.from(error + " ARTISTCONTRACT07"));
    }
  }

  @Transaction()
  public async putContractInDispute(
    ctx: Context,
    ArtistContractId: string,
    StartDate: number
  ) {
    const disputeContract = new DisputeSmartContract();
    const retrieveContract = await this.getArtistContract(
      ctx,
      ArtistContractId
    );
    if (retrieveContract.status !== 200) {
      return retrieveContract;
    }
    const artistContract: ArtistContract = JSON.parse(
      retrieveContract.payload.toString()
    );
    if (artistContract.Status === ContractStatuses.COMPLETED) {
      return Shim.error(
        Buffer.from("Contract already completed" + "ARTISTCONTRACT11")
      );
    }
    if (artistContract.Status === ContractStatuses.INDISPUTE) {
      return Shim.error(
        Buffer.from("Contract already in dispute " + "ARTISTCONTRACT08")
      );
    }
    artistContract.Status = ContractStatuses.INDISPUTE;
    let res = await disputeContract.createDispute(
      ctx,
      StartDate,
      ArtistContractId
    );
    if (res.status !== 200) {
      return Shim.error(
        Buffer.from("Error creating dispute " + "ARTISTCONTRACT09")
      );
    }
    const milestone = await this.getMilestoneFromArtistContract(
      ctx,
      JSON.stringify(artistContract),
      artistContract.CurrentMilestone
    );
    milestone.Status = MilestoneStatuses.INDISPUTE;
    const disputeMilestone = Buffer.from(JSON.stringify(milestone));
    await ctx.stub.putState(milestone.MilestoneId, disputeMilestone);
    const dispute: Dispute = JSON.parse(res.payload.toString());
    let disputeIds = JSON.parse(artistContract.DisputeIds);
    disputeIds.push(dispute.DisputeId);
    artistContract.DisputeIds = JSON.stringify(disputeIds);
    const { ...object } = artistContract;
    await ctx.stub.putState(
      artistContract.ContractId,
      Buffer.from(stringify(sortKeysRecursive(object)))
    );
    return Shim.success();
  }

  @Transaction(false)
  public async getArtistContractWithMilestones(
    ctx: Context,
    ArtistContractId: string
  ): Promise<ChaincodeResponse> {
    const artistContract = await ctx.stub.getState(ArtistContractId);
    if (!artistContract || artistContract.length === 0) {
      return Shim.error(Buffer.from("Contract does not exist"));
    }
    const contract: ArtistContract = JSON.parse(artistContract.toString());
    if (!AuthChecker.checkAuth(ctx, contract.ArtistId)) {
      console.log(
        ctx.clientIdentity.getAttributeValue("hf.EnrollmentID"),
        JSON.parse(artistContract.toString()).ArtistId
      );
      return Shim.error(
        Buffer.from(
          "Unauthorized" +
            " ARTISTCONTRACT13" +
            ctx.clientIdentity.getAttributeValue("hf.EnrollmentID") +
            " " +
            contract.ArtistId +
            " " +
            JSON.stringify(contract) +
            " " +
            ArtistContractId +
            " "
        )
      );
    }

    const artistSmartContract = new ArtistContractSmartContract();
    const milestonePromise =
      artistSmartContract.getMilestonesFromArtistContract(
        ctx,
        JSON.stringify(contract)
      );
    const disputePromise = artistSmartContract.getDisputesFromArtistContract(
      ctx,
      JSON.stringify(contract)
    );
    const milestoneRes = await milestonePromise;
    const disputeRes = await disputePromise;

    if (milestoneRes.status !== 200) {
      return milestoneRes;
    }
    if (disputeRes.status !== 200) {
      return disputeRes;
    }
    const Milestones: Milestone[] = JSON.parse(milestoneRes.payload.toString());
    const Disputes: Dispute[] = JSON.parse(disputeRes.payload.toString());
    console.log("Returning contract " + artistContract.toString());
    return Shim.success(
      Buffer.from(JSON.stringify({ ...contract, Milestones, Disputes }))
    );
  }

  @Transaction(false)
  public async getArtistContract(
    ctx: Context,
    ArtistContractId: string
  ): Promise<ChaincodeResponse> {
    const artistContract = await ctx.stub.getState(ArtistContractId);
    if (!artistContract || artistContract.length === 0) {
      return Shim.error(Buffer.from("Contract does not exist"));
    }
    const contract: ArtistContract = JSON.parse(artistContract.toString());
    if (!AuthChecker.checkAuth(ctx, contract.ArtistId)) {
      console.log(
        ctx.clientIdentity.getAttributeValue("hf.EnrollmentID"),
        JSON.parse(artistContract.toString()).ArtistId
      );
      return Shim.error(
        Buffer.from(
          "Unauthorized" +
            " ARTISTCONTRACT13" +
            ctx.clientIdentity.getAttributeValue("hf.EnrollmentID") +
            " " +
            contract.ArtistId +
            " " +
            JSON.stringify(contract) +
            " " +
            ArtistContractId +
            " "
        )
      );
    }

    console.log("Returning contract " + artistContract.toString());
    return Shim.success(Buffer.from(JSON.stringify({ ...contract })));
  }

  @Transaction(false)
  @Returns("boolean")
  public async artistContractExists(
    ctx: Context,
    ArtistContractId: string
  ): Promise<boolean> {
    console.log("Checking if contract exists " + ArtistContractId);
    const buffer = await ctx.stub.getState(ArtistContractId);
    return buffer && buffer.length > 0;
  }

  @Transaction(false)
  @Returns("boolean")
  public async getArtistContracts(ctx: Context): Promise<ChaincodeResponse> {
    console.log(
      "Getting contracts for artists " +
        ctx.clientIdentity.getAttributeValue("hf.EnrollmentID")
    );

    const artistSmartContract = new ArtistContractSmartContract();
    const iterator = await ctx.stub.getQueryResult(
      `{"selector":{"ArtistId":"${ctx.clientIdentity.getAttributeValue(
        "hf.EnrollmentID"
      )}"}}`
    );
    let next = await iterator.next();

    console.log("Next: " + next.value.value);
    let response: any[] = [];
    while (next && next.value && next.value.value) {
      const contract: ArtistContract = JSON.parse(next.value.value.toString());

      const milestonePromise =
        artistSmartContract.getMilestonesFromArtistContract(
          ctx,
          JSON.stringify(contract)
        );
      const disputePromise = artistSmartContract.getDisputesFromArtistContract(
        ctx,
        JSON.stringify(contract)
      );
      const milestoneRes = await milestonePromise;
      const disputeRes = await disputePromise;

      if (milestoneRes.status !== 200) {
        return milestoneRes;
      }
      if (disputeRes.status !== 200) {
        return disputeRes;
      }
      const Milestones: Milestone[] = JSON.parse(
        milestoneRes.payload.toString()
      );
      const Disputes: Dispute[] = JSON.parse(disputeRes.payload.toString());
      response.push({ ...contract, Milestones, Disputes });
      if (next.done) {
        break;
      }
      next = await iterator.next();
    }
    return Shim.success(Buffer.from(JSON.stringify(response)));
  }

  @Transaction(false)
  public async getMilestoneFromArtistContract(
    ctx: Context,
    artistContractString: string,
    index: number
  ): Promise<Milestone> {
    const artistContract: ArtistContract = JSON.parse(artistContractString);
    if (!AuthChecker.checkAuth(ctx, artistContract.ArtistId)) {
      console.log("UNAUTHORIZED" + " ARTISTCONTRACT14");
      return null;
    }
    const milestone = await ctx.stub.getState(
      JSON.parse(artistContract.MilestoneIds)[index]
    );
    if (!milestone || milestone.length === 0) {
      return null;
    }
    return JSON.parse(milestone.toString());
  }

  @Transaction(false)
  public async getMilestonesFromArtistContract(
    ctx: Context,
    artistContractString: string
  ): Promise<ChaincodeResponse> {
    const artistContract: ArtistContract = JSON.parse(artistContractString);
    if (!AuthChecker.checkAuth(ctx, artistContract.ArtistId)) {
      console.log("UNAUTHORIZED" + " ARTISTCONTRACT14");
      return Shim.error(Buffer.from("Unauthorized" + " ARTISTCONTRACT14"));
    }
    const milestonesIds: string[] = JSON.parse(artistContract.MilestoneIds);
    console.log(milestonesIds, "796978");
    const milestones: Milestone[] = await Promise.all(
      milestonesIds.map(async (milestoneId: string) => {
        const milestone = await ctx.stub.getState(milestoneId);
        console.log(milestone, "43232");
        if (!milestone || milestone.length === 0) {
          return null;
        }
        return JSON.parse(milestone.toString());
      })
    );
    return Shim.success(Buffer.from(stringify(sortKeysRecursive(milestones))));
  }

  @Transaction(false)
  public async getDisputesFromArtistContract(
    ctx: Context,
    artistContractString: string
  ): Promise<ChaincodeResponse> {
    const artistContract: ArtistContract = JSON.parse(artistContractString);
    if (!AuthChecker.checkAuth(ctx, artistContract.ArtistId)) {
      console.log("UNAUTHORIZED" + " ARTISTCONTRACT14");
      return Shim.error(Buffer.from("Unauthorized" + " ARTISTCONTRACT14"));
    }
    const disputeIds: string[] = JSON.parse(artistContract.DisputeIds);
    console.log(disputeIds, "324342");
    const disputes: Dispute[] = await Promise.all(
      disputeIds.map(async (disputeId: string) => {
        const dispute = await ctx.stub.getState(disputeId);
        console.log(JSON.parse(dispute.toString()), "892277");
        if (!dispute || dispute.length === 0) {
          return null;
        }
        return JSON.parse(dispute.toString());
      })
    );
    return Shim.success(Buffer.from(stringify(sortKeysRecursive(disputes))));
  }

  @Transaction(false)
  public async getDisputeFromArtistContract(
    ctx: Context,
    artistContractString: string
  ): Promise<Dispute> {
    const artistContract: ArtistContract = JSON.parse(artistContractString);
    if (artistContract.Status !== ContractStatuses.INDISPUTE) {
      return null;
    }
    if (!AuthChecker.checkAuth(ctx, artistContract.ArtistId)) {
      return null;
    }
    const disputeArray = JSON.parse(artistContract.DisputeIds);
    if (!disputeArray || disputeArray.length === 0) {
      return null;
    }
    const disputeId = disputeArray[disputeArray.length - 1];
    console.log("GETTING DISPUTE", disputeId);
    const dispute = await ctx.stub.getState(disputeId);
    if (!dispute || dispute.length === 0) {
      return null;
    }
    return JSON.parse(dispute.toString());
  }

  @Transaction(false)
  public async getArtistContractHistory(
    ctx: Context,
    ArtistContractId: string
  ): Promise<ChaincodeResponse> {
    console.log("Getting history for contract " + ArtistContractId);
    const contractRes = await this.getArtistContract(ctx, ArtistContractId);
    if (contractRes.status !== 200) {
      return contractRes;
    }

    const artistContract: ArtistContract = JSON.parse(
      contractRes.payload.toString()
    );

    if (!AuthChecker.checkAuth(ctx, artistContract.ArtistId)) {
      return Shim.error(Buffer.from("Unauthorized" + " ARTISTCONTRACT14"));
    }
    console.log("get history for key", ArtistContractId);
    let iterator: Iterators.HistoryQueryIterator =
      await ctx.stub.getHistoryForKey(ArtistContractId);

    let jsonRes: Array<HistoryQueryResult> = [];
    while (true) {
      console.log("in while loop");
      let res = await iterator.next();

      if (res.value && res.value.value.toString()) {
        console.log(res.value.value.toString());
        let currResult: HistoryQueryResult = new HistoryQueryResult();
        currResult.txId = res.value.txId;
        currResult.timestamp = Number(res.value.timestamp.seconds);
        try {
          currResult.value = JSON.parse(res.value.value.toString());
        } catch (err) {
          console.log(err);
          currResult.value = res.value.value.toString();
        }
        jsonRes.push(currResult);
      }
      if (res.done) {
        console.log("end of data");
        await iterator.close();
        console.info(jsonRes);
        return Shim.success(Buffer.from(JSON.stringify(jsonRes)));
      }
    }
  }
}
