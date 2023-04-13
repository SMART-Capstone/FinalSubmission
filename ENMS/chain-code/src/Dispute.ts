import {
  ArtistContract,
  ArtistContractSmartContract,
  ARTIST_CONTRACT_DOC_TYPE,
  ContractStatuses,
} from "./ArtistContract";
import { MilestoneSmartContract, MilestoneStatuses } from "./Milestone";
import {
  Object,
  Property,
  Transaction,
  Contract,
  Context,
  Info,
  Returns,
} from "fabric-contract-api";
import { Shim, ChaincodeResponse } from "fabric-shim";
import stringify from "json-stringify-deterministic";
import sortKeysRecursive from "sort-keys-recursive";
import { DisputeStatuses } from "./HelperTypes/EnumTypes";

export const DISPUTE_DOC_TYPE = "DISPUTE";

@Object()
export class Dispute {
  @Property()
  DisputeId: string;

  @Property()
  StartDate: number;

  @Property()
  EndDate: number;

  @Property()
  ContractId: string;

  @Property()
  Status: string;

  @Property()
  DocType: string;
}

@Info({ title: "Dispute", description: "Smart contract for disputes" })
export class DisputeSmartContract extends Contract {
  @Transaction()
  public async createDispute(
    ctx: Context,
    StartDate: number,
    ContractId: string
  ) {
    const dispute = new Dispute();
    dispute.DisputeId = ctx.stub.getTxID();
    dispute.StartDate = StartDate;
    dispute.ContractId = ContractId;
    dispute.Status = DisputeStatuses.INPROGRESS;
    dispute.EndDate = null;
    dispute.DocType = DISPUTE_DOC_TYPE;
    const { ...object } = dispute;
    if (await this.disputeExists(ctx, dispute.DisputeId)) {
      return Shim.error(Buffer.from("Dispute already exists"));
    }
    let artistContractSmartContract = new ArtistContractSmartContract();
    const res = await artistContractSmartContract.getArtistContract(
      ctx,
      ContractId
    );
    // not authorized
    if (res.status !== 200) {
      return Shim.error(Buffer.from(res.message));
    }
    await ctx.stub.putState(
      dispute.DisputeId,
      Buffer.from(stringify(sortKeysRecursive(object)))
    );
    return Shim.success(Buffer.from(stringify(sortKeysRecursive(object))));
  }

  @Transaction(false)
  @Returns("boolean")
  public async disputeExists(
    ctx: Context,
    disputeId: string
  ): Promise<boolean> {
    const buffer = await ctx.stub.getState(disputeId);
    return !!buffer && buffer.length > 0;
  }

  @Transaction()
  public async resolveDispute(ctx: Context, contractId: string) {
    let artistContractSmartContract = new ArtistContractSmartContract();
    const retrieveContract =
      await artistContractSmartContract.getArtistContract(ctx, contractId);
    if (retrieveContract.status !== 200) {
      return retrieveContract;
    }
    const contract: ArtistContract = JSON.parse(
      retrieveContract.payload.toString()
    );
    const dispute: Dispute =
      await artistContractSmartContract.getDisputeFromArtistContract(
        ctx,
        JSON.stringify(contract)
      );
    if (!dispute) {
      return Shim.error(Buffer.from("Dispute does not exist"));
    }
    // Get Dispute from ID:
    console.log("Resolving dispute");
    // Move DisputeStatus to RESOLVED:
    // Cannot resolve if resolved:
    if (dispute.Status === DisputeStatuses.RESOLVED) {
      return Shim.error(Buffer.from("Dispute already resolved"));
    }
    dispute.Status = DisputeStatuses.RESOLVED;
    const resolvedDispute = Buffer.from(
      JSON.stringify(sortKeysRecursive(dispute))
    );
    console.log("Putting dispute");
    await ctx.stub.putState(dispute.DisputeId, resolvedDispute);
    // Need to confirm this:
    // Get Contract(get ContractID from disput obj) and get that milestone eventually:
    // Go back to the previous milestone - its the same currentMilestone, change the status only:
    // Call function in Milstones to change status:
    let res = await this.resolveDisputeHelper(ctx, JSON.stringify(contract));
    if (res.status !== 200) {
      return Shim.error(Buffer.from(res.message));
    }
    return Shim.success();
  }

  // For milestone indispute:
  // @Transaction()
  // public async startDispute(
  //   ctx: Context,
  //   contractId: string,
  // ) {
  //   const milestone = await this.getMilestoneFromArtistContractFromContractId(ctx, contractId);
  //   milestone.Status = MilestoneStatuses.INDISPUTE;
  //   const disputeMilestone = Buffer.from(JSON.stringify(milestone));
  //   await ctx.stub.putState( milestone.MilestoneId, disputeMilestone)
  //   return Shim.success();
  // }

  @Transaction()
  public async resolveDisputeHelper(ctx: Context, contractString: string) {
    const contract: ArtistContract = JSON.parse(contractString);
    console.log("Resolve dispute helper");
    const artistContractSmartContract = new ArtistContractSmartContract();
    if (contract.Status !== ContractStatuses.INDISPUTE) {
      return Shim.error(Buffer.from("Contract Already Resolved"));
    }
    const milestone =
      await artistContractSmartContract.getMilestoneFromArtistContract(
        ctx,
        JSON.stringify(contract),
        contract.CurrentMilestone
      );
    if (milestone.Status !== MilestoneStatuses.INDISPUTE) {
      return Shim.error(Buffer.from("Milestone Already Resolved"));
    }
    milestone.Status = MilestoneStatuses.INPROGRESS;
    const disputeMilestone = Buffer.from(
      JSON.stringify(sortKeysRecursive(milestone))
    );
    console.log("Putting milestone");
    await ctx.stub.putState(milestone.MilestoneId, disputeMilestone);
    // checks auth
    contract.Status = ContractStatuses.INPROGRESS;
    const updatedContract = Buffer.from(
      JSON.stringify(sortKeysRecursive(contract))
    );
    await ctx.stub.putState(contract.ContractId, updatedContract);

    return Shim.success();
  }
}
