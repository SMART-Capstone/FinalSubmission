import {
  ArtistContract,
  ArtistContractSmartContract,
  ContractStatuses,
} from "./ArtistContract";
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
import { NftSmartContract } from "./Nft";
import { AuthChecker } from "./HelperTypes/AuthChecker";

export const MILESTONE_DOC_TYPE = "MILESTONE";

export enum MilestoneStatuses {
  INPROGRESS = "INPROGRESS",
  INDISPUTE = "INDISPUTE",
  COMPLETED = "COMPLETED",
  NOTSTARTED = "NOTSTARTED",
}

export enum ActionTypes {
  DEPOSIT = "DEPOSIT",
  ROYALTY = "ROYALTY",
}

@Object()
export class Milestone {
  @Property()
  MilestoneId: string;

  @Property()
  ActionType: string;

  @Property()
  Amount: number;

  @Property()
  Currency: string;

  @Property()
  ContractId: string;

  @Property()
  DocType: string;

  @Property()
  StartDate: number;

  @Property()
  FileKeys: string;

  @Property()
  FileHashes: string;

  @Property()
  EndDate: number;

  @Property()
  Status: string;
}

@Info({ title: "Milestone", description: "Smart contract for milestones" })
export class MilestoneSmartContract extends Contract {
  @Transaction()
  public async createMilestone(
    ctx: Context,
    MilestoneId: string,
    ActionType: string,
    Amount: number,
    ContractString: string,
    StartDate: number,
    Currency: string,
    Status: string
  ) {
    const milestone = new Milestone();
    const Contract = <ArtistContract>JSON.parse(ContractString);
    if (!AuthChecker.checkAuth(ctx, Contract.ArtistId)) {
      return Shim.error(Buffer.from("Not authorized"));
    }
    milestone.MilestoneId = MilestoneId;
    milestone.ActionType = ActionType;
    milestone.Amount = Amount;
    milestone.ContractId = Contract.ContractId;
    milestone.StartDate = StartDate;
    milestone.DocType = MILESTONE_DOC_TYPE;
    milestone.Currency = Currency;
    milestone.Status = Status;
    milestone.FileKeys = JSON.stringify([]);
    milestone.FileHashes = JSON.stringify([]);
    if (!ActionType || !Amount || !Contract.ContractId || !MilestoneId) {
      return Shim.error(Buffer.from("Invalid milestone " + " MILESTONE01"));
    }
    const { ...object } = milestone;
    try {
      await ctx.stub.putState(
        milestone.MilestoneId,
        Buffer.from(stringify(sortKeysRecursive(object)))
      );
      return Shim.success(Buffer.from("Milestone created"));
    } catch (error) {
      return Shim.error(Buffer.from(error + " MILESTONE01"));
    }
  }

  @Transaction(false)
  @Returns("boolean")
  public async milestoneExists(
    ctx: Context,
    MilestoneId: string
  ): Promise<boolean> {
    const buffer = await ctx.stub.getState(MilestoneId);
    return buffer && buffer.length > 0;
  }

  @Transaction()
  public async advanceMilestone(
    ctx: Context,
    contractId: string,
    currDate: number,
    fileKeys: string,
    fileHashes: string
  ): Promise<ChaincodeResponse> {
    let artistContractSmartContract = new ArtistContractSmartContract();
    // checks auth
    const contractRes = await artistContractSmartContract.getArtistContract(
      ctx,
      contractId
    );
    if (contractRes.status !== 200) {
      return contractRes;
    }
    const contractString = contractRes.payload.toString();
    console.log("Contract String: " + contractString);
    const contract: ArtistContract = JSON.parse(contractString);
    // get milestone:
    let milestone =
      await artistContractSmartContract.getMilestoneFromArtistContract(
        ctx,
        JSON.stringify(contract),
        contract.CurrentMilestone
      );
    if (!milestone) {
      return Shim.error(
        Buffer.from(
          "Milestone not found for contract " +
            contract.ContractId +
            "MILESTONE11"
        )
      );
    }
    // get contract:
    // checks auth

    let currentStatus = milestone.Status;
    let currentContractStatus = contract.Status;
    if (currentContractStatus === ContractStatuses.INDISPUTE) {
      return Shim.error(
        Buffer.from("Cannot advance milestone when contract in dispute")
      );
    } else if (currentContractStatus !== ContractStatuses.INPROGRESS) {
      return Shim.error(
        Buffer.from("Cannot advance milestone when contract is not in progress")
      );
    }
    switch (currentStatus) {
      case MilestoneStatuses.COMPLETED:
        return Shim.error(Buffer.from("Cannot advance an completed milestone"));
      case MilestoneStatuses.INDISPUTE:
        return Shim.error(
          Buffer.from("Cannot advance an milestone if in dispute")
        );
      case MilestoneStatuses.INPROGRESS:
        let fileHashsParsed: string[] = JSON.parse(fileHashes);
        let fileKeysParsed: string[] = JSON.parse(fileKeys);
        if (fileHashsParsed.length !== fileKeysParsed.length) {
          return Shim.error(
            Buffer.from(
              "File hashes and keys are not equal" +
                " Hashes: " +
                fileHashes +
                " Keys:" +
                fileKeys +
                " NFTOBJECT02"
            )
          );
        }
        milestone.FileHashes = fileHashes;
        milestone.FileKeys = fileKeys;
        // Update Status & Set EndDate:
        milestone.Status = MilestoneStatuses.COMPLETED;
        milestone.EndDate = currDate;
        // Check if there's next milestone:
        let currentMilestoneIndex = contract.CurrentMilestone;
        let mileStoneIds: Array<string> = JSON.parse(contract.MilestoneIds);
        contract.CurrentMilestone += 1;

        if (currentMilestoneIndex === mileStoneIds.length - 1) {
          contract.Status = ContractStatuses.COMPLETED;
        } else if (currentMilestoneIndex < mileStoneIds.length - 1) {
          // Update Index:
          // Call advanceMilestone again for the next milestone from NOTSTARTED to INPROGRESS, which will go to another case. Loop Safe.
          const nextMilestone =
            await artistContractSmartContract.getMilestoneFromArtistContract(
              ctx,
              JSON.stringify(contract),
              contract.CurrentMilestone
            );
          if (!nextMilestone) {
            return Shim.error(Buffer.from("Milestone not found"));
          }
          nextMilestone.StartDate = currDate;
          nextMilestone.Status = MilestoneStatuses.INPROGRESS;
          await ctx.stub.putState(
            nextMilestone.MilestoneId,
            Buffer.from(stringify(sortKeysRecursive(nextMilestone)))
          );
        } else {
          return Shim.error(Buffer.from("Milestone Index Out of Bounds Error"));
        }
        let updatedContract = Buffer.from(
          stringify(sortKeysRecursive(contract))
        );
        console.log("Updating contract");
        await ctx.stub.putState(contractId, updatedContract);
        break;
      case MilestoneStatuses.NOTSTARTED:
        // Update Status & Set StartDate:
        milestone.Status = MilestoneStatuses.INPROGRESS;
        milestone.StartDate = currDate;
        break;
      default:
        return Shim.error(Buffer.from("Invalid Milestone Status"));
    }

    // Put new Milestone:
    let advancedMilestone = Buffer.from(
      stringify(sortKeysRecursive(milestone))
    );
    await ctx.stub.putState(milestone.MilestoneId, advancedMilestone);
    return Shim.success();
  }
}
