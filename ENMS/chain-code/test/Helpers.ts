import { Context } from "fabric-contract-api";
import { ChaincodeResponse, ChaincodeStub, ClientIdentity } from "fabric-shim";
import {
  ArtistContract,
  ArtistContractSmartContract,
} from "../src/ArtistContract";
import {
  Milestone,
  MilestoneSmartContract,
  MILESTONE_DOC_TYPE,
} from "../src/Milestone";
import { ARTIST_CONTRACT_DOC_TYPE } from "../src/ArtistContract";
import { ContractStatuses } from "../src/ArtistContract";
import { instance, mock, when } from "ts-mockito";
import {
  Dispute,
  DisputeSmartContract,
  DISPUTE_DOC_TYPE,
} from "../src/Dispute";
import { User, UserSmartContract, USER_DOC_TYPE } from "../src/User";
import { NftObject, NftSmartContract } from "../src/Nft";

export class mockDateNow {
  static time = 0;
  public static now() {
    return mockDateNow.time;
  }

  toISOString() {
    return "12345";
  }

  mockDateNow() {
    console.log(mockDateNow.now());
    return new mockDateNow();
  }
}

async function createDispute(
  mockContext: Context,
  stub: ChaincodeStub,
  dispute: Dispute
) {
  let disputeContract = new DisputeSmartContract();
  let res = await disputeContract.createDispute(
    mockContext,
    dispute.StartDate,
    dispute.ContractId
  );
  if (res.status !== 200) {
    throw new Error("Did not create dispute");
  }
  console.log("SETTING DISPUTE ", dispute.DisputeId);
  when(stub.getState(dispute.DisputeId)).thenResolve(
    Buffer.from(
      JSON.stringify({
        ...dispute,
        DisputeId: dispute.DisputeId,
      })
    )
  );
}

async function createNft(
  mockContext: Context,
  stub: ChaincodeStub,
  nft: NftObject
): Promise<ChaincodeResponse> {
  let nftContract = new NftSmartContract();
  let res = await nftContract.createNft(
    mockContext,
    nft.FileHashs,
    nft.FileKeys,
    nft.OriginalProjectId,
    Date.now(),
    "",
    ""
  );
  if (res.status !== 200) {
    console.log(res.message.toString());
    return res;
  }
  console.log({
    ...nft,
  });
  console.log(nft.NftId, "Body");
  when(stub.getState(nft.NftId)).thenResolve(
    Buffer.from(
      JSON.stringify({
        ...nft,
      })
    )
  );
  return {
    status: 200,
    message: "",
    payload: null,
  };
}
async function createMilestone(
  mockContext: Context,
  stub: ChaincodeStub,
  milestone: Milestone,
  contract: ArtistContract
) {
  let milestoneSmartContract = new MilestoneSmartContract();
  let create_milestone = milestoneSmartContract.createMilestone(
    mockContext,
    milestone.MilestoneId,
    milestone.ActionType,
    milestone.Amount,
    JSON.stringify(contract),
    milestone.StartDate,
    milestone.Currency,
    milestone.Status
  );
  if ((await create_milestone).status !== 200) {
    throw new Error("milestone wasn't created");
  }
  console.log("Created milestone", milestone.MilestoneId);
  when(stub.getState(milestone.MilestoneId)).thenResolve(
    Buffer.from(
      JSON.stringify({
        ...milestone,
        MilestoneId: milestone.MilestoneId,
      })
    )
  );
}
async function createArtistContract(
  mockContext: Context,
  stub: ChaincodeStub,
  artistContract: ArtistContract,
  milestones: Array<Milestone>
) {
  let artistSmartContract = new ArtistContractSmartContract();
  let create_contract: ChaincodeResponse =
    await artistSmartContract.createArtistContract(
      mockContext,
      JSON.stringify(milestones),
      artistContract.ArtistId,
      artistContract.ClientId,
      artistContract.ContractId,
      Date.now()
    );
  if (create_contract.status !== 200) {
    throw new Error(create_contract.message);
  }
  let milestoneIds = milestones.map((milestone) => milestone.MilestoneId);
  when(stub.getState(artistContract.ContractId)).thenResolve(
    Buffer.from(
      JSON.stringify({
        ...artistContract,
        DisputeIds: artistContract.DisputeIds
          ? artistContract.DisputeIds
          : JSON.stringify([]),
        Status: artistContract.Status
          ? artistContract.Status
          : ContractStatuses.INPROGRESS,
        DocType: ARTIST_CONTRACT_DOC_TYPE,
        ContractId: artistContract.ContractId,
        MilestoneIds: JSON.stringify(milestoneIds),
        CurrentMilestone: artistContract.CurrentMilestone
          ? artistContract.CurrentMilestone
          : 0,
        NftId: null,
      })
    )
  );
}

async function mockLoggedInUser(
  mockContext: Context,
  stub: ChaincodeStub,
  user: User
) {
  let clientIdentity = mock(ClientIdentity);
  when(clientIdentity.getAttributeValue("hf.EnrollmentID")).thenReturn(
    user.UserId
  );
  mockContext.clientIdentity = instance(clientIdentity);
  when(stub.getState(user.UserId)).thenResolve(
    Buffer.from(JSON.stringify(user))
  );
}

async function createUser(
  mockContext: Context,
  stub: ChaincodeStub,
  user: User
) {
  let userSmartContract = new UserSmartContract();
  mockLoggedInUser(mockContext, stub, user);
  let res: ChaincodeResponse = await userSmartContract.createUser(
    mockContext,
    user.UserId,
    user.Email,
    user.WalletAddress,
    user.UserType
  );
  if (res.status !== 200) {
    throw new Error(res.message);
  }
  when(stub.getState(user.UserId)).thenResolve(
    Buffer.from(JSON.stringify(user))
  );
}

let invalidContractActionStates = [
  ContractStatuses.INDISPUTE,
  ContractStatuses.INPROGRESS,
  ContractStatuses.MINTED,
];
export {
  createArtistContract,
  createDispute,
  createMilestone,
  createUser,
  createNft,
  invalidContractActionStates,
  mockLoggedInUser,
};
