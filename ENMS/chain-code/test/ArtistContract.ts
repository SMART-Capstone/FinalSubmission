import { User, UserSmartContract, USER_DOC_TYPE } from "../src/User";
import {
  Milestone,
  MilestoneSmartContract,
  ActionTypes,
  MILESTONE_DOC_TYPE,
  MilestoneStatuses,
} from "../src/Milestone";
import {
  ArtistContract,
  ArtistContractSmartContract,
  ARTIST_CONTRACT_DOC_TYPE,
  ContractStatuses,
} from "../src/ArtistContract";
import { Context } from "fabric-contract-api";
import { suite, test } from "@testdeck/mocha";
import {
  mock,
  instance,
  capture,
  reset,
  when,
  resetCalls,
  anyString,
} from "ts-mockito";
import {
  ChaincodeResponse,
  ChaincodeStub,
  Iterators,
  StateQueryResponse,
  Timestamp,
} from "fabric-shim";
import { UserTypes, DisputeStatuses } from "../src/HelperTypes/EnumTypes";
import stringify from "json-stringify-deterministic";
import sortKeysRecursive from "sort-keys-recursive";
import assert from "node:assert";
import {
  Dispute,
  DisputeSmartContract,
  DISPUTE_DOC_TYPE,
} from "../src/Dispute";
import {
  createArtistContract,
  createDispute,
  createMilestone,
  mockDateNow,
  createUser,
  invalidContractActionStates,
} from "./Helpers";
import { ClientIdentity } from "fabric-shim";

class Iter<T> {
  close(): Promise<void> {
    return null;
  }
  next(): Promise<Iterators.NextResult<T>> {
    return null;
  }
}
@suite
class ArtistContractTest {
  client = new User();
  artist = new User();
  artist2 = new User();
  dispute = new Dispute();
  milestone1 = new Milestone();
  milestone2 = new Milestone();
  artistContract = new ArtistContract();
  artistSmartContract = new ArtistContractSmartContract();
  userSmartContract = new UserSmartContract();
  milestoneSmartContract = new MilestoneSmartContract();
  disputeSmartContract = new DisputeSmartContract();

  mockContext = mock(Context);
  stub = mock(ChaincodeStub);
  clientIdentity = mock(ClientIdentity);
  iter = mock(Iter);

  async configUsers() {
    console.log("configg users");
    when(this.clientIdentity.getAttributeValue(anyString())).thenReturn(
      this.client.UserId
    );
    this.mockContext.clientIdentity = instance(this.clientIdentity);
    await createUser(this.mockContext, this.stub, this.client);
    when(this.clientIdentity.getAttributeValue(anyString())).thenReturn(
      this.artist.UserId
    );
    this.mockContext.clientIdentity = instance(this.clientIdentity);
    await createUser(this.mockContext, this.stub, this.artist);
  }

  before() {
    this.client.UserId = "u1234";
    this.client.DocType = "user";
    this.client.Email = "rand@random.ca";
    this.client.WalletAddress = "0x1234";
    this.client.UserType = UserTypes.CLIENT;
    this.client.NftIds = JSON.stringify([]);

    this.artist.UserId = "u5678";
    this.artist.DocType = "user";
    this.artist.Email = "Email@Email.com";
    this.artist.WalletAddress = "0x5678";
    this.artist.UserType = UserTypes.ARTIST;
    this.artist.NftIds = JSON.stringify([]);

    this.artist2.UserId = "u54343678";
    this.artist2.DocType = "user";
    this.artist2.Email = "Emai322l@Email.com";
    this.artist2.WalletAddress = "0x564378";
    this.artist2.UserType = UserTypes.ARTIST;
    this.artist2.NftIds = JSON.stringify([]);

    this.artistContract.ArtistId = "u5678";
    this.artistContract.ClientId = "u1234";
    this.artistContract.ContractId = "c1234";

    this.milestone1.MilestoneId = "m1234";
    this.milestone1.DocType = MILESTONE_DOC_TYPE;
    this.milestone1.ContractId = this.artistContract.ContractId;
    this.milestone1.ActionType = ActionTypes.ROYALTY;
    this.milestone1.Amount = 100;
    this.milestone1.Currency = "eth";
    this.milestone1.Status = MilestoneStatuses.INPROGRESS;
    this.milestone1.FileHashes = "[]";
    this.milestone1.FileKeys = "[]";

    this.milestone2.MilestoneId = "m5678";
    this.milestone2.DocType = MILESTONE_DOC_TYPE;
    this.milestone2.ContractId = this.artistContract.ContractId;
    this.milestone2.ActionType = ActionTypes.DEPOSIT;
    this.milestone2.Amount = 100;
    this.milestone2.Currency = "btc";
    this.milestone2.FileHashes = "[]";
    this.milestone2.FileKeys = "[]";

    this.mockContext.stub = instance(this.stub);

    this.dispute.DisputeId = "d1234";
    this.dispute.StartDate = 0;
    this.dispute.DocType = DISPUTE_DOC_TYPE;
    this.dispute.EndDate = null;
    this.dispute.Status = DisputeStatuses.INPROGRESS;
    this.dispute.ContractId = this.artistContract.ContractId;
  }

  @test async "Create artist contract"() {
    reset(this.stub);
    reset(this.mockContext);
    // Mock Date.now() to be 0
    Date = mockDateNow as any;
    this.mockContext.stub = instance(this.stub);
    await createUser(this.mockContext, this.stub, this.client);
    await createUser(this.mockContext, this.stub, this.artist);
    let milestones = [{ ...this.milestone1 }, { ...this.milestone2 }];
    console.log("Here3434");
    console.log(
      "Ctx: ",
      this.mockContext.clientIdentity.getAttributeValue("hf.EnrollmentID")
    );
    await createArtistContract(
      this.mockContext,
      this.stub,
      this.artistContract,
      milestones
    );
    // Two users then first milestone then second milestone then artist contract
    const [firstMilestoneId, firstMilestoneBuffer] = capture(
      this.stub.putState
    ).byCallIndex(2);
    const [secondMilestonId, secondMilestoneBuffer] = capture(
      this.stub.putState
    ).byCallIndex(3);
    const [contractId, contractBuffer] = capture(
      this.stub.putState
    ).byCallIndex(4);
    const expectedMilestoneBodyOne = {
      ...this.milestone1,
      MilestoneId: this.milestone1.MilestoneId,
      StartDate: Date.now(),
      DocType: MILESTONE_DOC_TYPE,
    };
    console.log("EX: ", expectedMilestoneBodyOne);
    const expectedMilestoneBodyTwo = {
      ...this.milestone2,
      MilestoneId: this.milestone2.MilestoneId,
      StartDate: null,
      DocType: MILESTONE_DOC_TYPE,
    };
    const expectedArtistContractBody = {
      ...this.artistContract,
      DocType: ARTIST_CONTRACT_DOC_TYPE,
      ContractId: this.artistContract.ContractId,
      MilestoneIds: JSON.stringify([
        this.milestone1.MilestoneId,
        this.milestone2.MilestoneId,
      ]),
      CurrentMilestone: 0,
      DisputeIds: JSON.stringify([]),
      NftId: null,
      Status: ContractStatuses.INPROGRESS,
    };
    assert.strictEqual(firstMilestoneId, this.milestone1.MilestoneId);
    assert.strictEqual(
      firstMilestoneBuffer.toString(),
      stringify(sortKeysRecursive(expectedMilestoneBodyOne))
    );
    assert.strictEqual(secondMilestonId, this.milestone2.MilestoneId);
    assert.strictEqual(
      secondMilestoneBuffer.toString(),
      stringify(sortKeysRecursive(expectedMilestoneBodyTwo))
    );
    assert.strictEqual(contractId, this.artistContract.ContractId);
    assert.strictEqual(
      contractBuffer.toString(),
      stringify(sortKeysRecursive(expectedArtistContractBody))
    );
  }

  @test async "Cannot create artist contract with invalid artist"() {
    reset(this.stub);
    reset(this.mockContext);
    this.mockContext.stub = instance(this.stub);
    await createUser(this.mockContext, this.stub, this.client);
    let milestones = JSON.stringify([
      { ...this.milestone1 },
      { ...this.milestone2 },
    ]);
    let res: ChaincodeResponse =
      await this.artistSmartContract.createArtistContract(
        this.mockContext,
        milestones,
        "invalid",
        this.artistContract.ClientId,
        this.artistContract.ContractId,
        Date.now()
      );
    assert.notStrictEqual(res.status, 200);
    if (res.status !== 200) {
      console.log(res.message.toString(), 65787);
    }
    assert(res.message.toString().includes("Unauthorized"));
  }

  @test async "Cannot create artist contract with invalid client"() {
    reset(this.stub);
    reset(this.mockContext);
    this.mockContext.stub = instance(this.stub);
    await createUser(this.mockContext, this.stub, this.artist);
    let milestones = JSON.stringify([
      { ...this.milestone1 },
      { ...this.milestone2 },
    ]);
    let res: ChaincodeResponse =
      await this.artistSmartContract.createArtistContract(
        this.mockContext,
        milestones,
        this.artistContract.ArtistId,
        "invalid",
        this.artistContract.ContractId,
        Date.now()
      );
    assert.notStrictEqual(res.status, 200);
    assert(res.message.includes("Client does not exist"));
  }

  @test async "Cannot create artist contract with preexisting milestones"() {
    reset(this.stub);
    reset(this.mockContext);
    this.mockContext.stub = instance(this.stub);
    await createUser(this.mockContext, this.stub, this.client);
    await createUser(this.mockContext, this.stub, this.artist);
    await createMilestone(
      this.mockContext,
      this.stub,
      this.milestone1,
      this.artistContract
    );
    await createMilestone(
      this.mockContext,
      this.stub,
      this.milestone2,
      this.artistContract
    );
    let milestones = JSON.stringify([
      { ...this.milestone1 },
      { ...this.milestone2 },
    ]);
    let res: ChaincodeResponse =
      await this.artistSmartContract.createArtistContract(
        this.mockContext,
        milestones,
        this.artistContract.ArtistId,
        this.artistContract.ClientId,
        this.artistContract.ContractId,
        Date.now()
      );
    assert.notStrictEqual(res.status, 200);
    assert(res.message.includes("Milestone already exists"));
  }

  @test async "Cannot create artist contract with invalid milestones"() {
    reset(this.stub);
    reset(this.mockContext);
    this.mockContext.stub = instance(this.stub);
    await createUser(this.mockContext, this.stub, this.client);
    await createUser(this.mockContext, this.stub, this.artist);
    let milestones = JSON.stringify([
      { key: "Not a milestone" },
      { ...this.milestone2 },
    ]);
    let res: ChaincodeResponse =
      await this.artistSmartContract.createArtistContract(
        this.mockContext,
        milestones,
        this.artistContract.ArtistId,
        this.artistContract.ClientId,
        this.artistContract.ContractId,
        Date.now()
      );
    assert.notStrictEqual(res.status, 200);
    assert(res.message.toString().includes("Invalid milestone"));
  }

  @test async "Cannot create artist contract with no milestones"() {
    reset(this.stub);
    reset(this.mockContext);
    this.mockContext.stub = instance(this.stub);
    console.log("calling config users");
    await this.configUsers();
    let milestones = JSON.stringify([]);
    let res: ChaincodeResponse =
      await this.artistSmartContract.createArtistContract(
        this.mockContext,
        milestones,
        this.artistContract.ArtistId,
        this.artistContract.ClientId,
        this.artistContract.ContractId,
        Date.now()
      );
    assert.notStrictEqual(res.status, 200);
    assert(res.message.includes("Milestones cannot be empty"));
  }

  @test async "Cannot create duplicate contract"() {
    reset(this.stub);
    reset(this.mockContext);
    this.mockContext.stub = instance(this.stub);
    await this.configUsers();
    let milestones = JSON.stringify([
      { ...this.milestone1 },
      { ...this.milestone2 },
    ]);
    let res: ChaincodeResponse =
      await this.artistSmartContract.createArtistContract(
        this.mockContext,
        milestones,
        this.artistContract.ArtistId,
        this.artistContract.ClientId,
        this.artistContract.ContractId,
        Date.now()
      );
    if (res.status !== 200) {
      throw new Error(res.message);
    } else {
      when(this.stub.getState(this.artistContract.ContractId)).thenResolve(
        Buffer.from(JSON.stringify(this.artistContract))
      );
    }
    res = await this.artistSmartContract.createArtistContract(
      this.mockContext,
      milestones,
      this.artistContract.ArtistId,
      this.artistContract.ClientId,
      this.artistContract.ContractId,
      Date.now()
    );
    assert.notStrictEqual(res.status, 200);
    assert(res.message.includes("Contract already exists"));
  }

  @test async "Put artist contract in dispute"() {
    reset(this.stub);
    reset(this.mockContext);
    this.mockContext.stub = instance(this.stub);
    Date = mockDateNow as any;
    await this.configUsers();
    let milestones = [{ ...this.milestone1 }, { ...this.milestone2 }];
    await createArtistContract(
      this.mockContext,
      this.stub,
      this.artistContract,
      milestones
    );
    await createMilestone(
      this.mockContext,
      this.stub,
      this.milestone1,
      this.artistContract
    );
    await createMilestone(
      this.mockContext,
      this.stub,
      this.milestone1,
      this.artistContract
    );

    let disputeId = this.dispute.DisputeId;

    const expectedArtistContractBody = {
      ...this.artistContract,
      DocType: ARTIST_CONTRACT_DOC_TYPE,
      ContractId: this.artistContract.ContractId,
      MilestoneIds: JSON.stringify([
        this.milestone1.MilestoneId,
        this.milestone2.MilestoneId,
      ]),
      CurrentMilestone: 0,
      NftId: null,
      DisputeIds: JSON.stringify([disputeId]),
      Status: ContractStatuses.INDISPUTE,
    };
    resetCalls(this.stub);
    when(this.stub.getTxID()).thenReturn(this.dispute.DisputeId);
    let res: ChaincodeResponse =
      await this.artistSmartContract.putContractInDispute(
        this.mockContext,
        this.artistContract.ContractId,
        Date.now()
      );
    assert.strictEqual(res.status, 200);
    // make the stub getState return the dispute
    const [actualDisputeId, disputeBody] = capture(
      this.stub.putState
    ).byCallIndex(0);
    const [milestoneId, milestoneBody] = capture(
      this.stub.putState
    ).byCallIndex(1);
    const [actualContractId, contractBody] = capture(
      this.stub.putState
    ).byCallIndex(2);
    assert.strictEqual(actualDisputeId, disputeId);
    assert.deepStrictEqual(JSON.parse(disputeBody.toString()), {
      ...this.dispute,
      DisputeId: this.dispute.DisputeId,
    });
    assert.strictEqual(milestoneId, this.milestone1.MilestoneId);
    assert.deepStrictEqual(JSON.parse(milestoneBody.toString()), {
      ...this.milestone1,
      Status: MilestoneStatuses.INDISPUTE,
    });
    assert.strictEqual(actualContractId, expectedArtistContractBody.ContractId);
    assert.deepStrictEqual(
      JSON.parse(contractBody.toString()),
      expectedArtistContractBody
    );
  }

  @test async "Test dispute Resolution"() {
    console.log("Testing dispute res");
    reset(this.stub);
    reset(this.mockContext);
    this.mockContext.stub = instance(this.stub);
    await this.configUsers();
    let milestones = [{ ...this.milestone1 }, { ...this.milestone2 }];
    this.artistContract.DisputeIds = JSON.stringify([this.dispute.DisputeId]);
    this.artistContract.Status = ContractStatuses.INDISPUTE;
    await createArtistContract(
      this.mockContext,
      this.stub,
      this.artistContract,
      milestones
    );

    const expectedArtistContractBody = {
      ...this.artistContract,
      DocType: ARTIST_CONTRACT_DOC_TYPE,
      ContractId: this.artistContract.ContractId,
      MilestoneIds: JSON.stringify([
        this.milestone1.MilestoneId,
        this.milestone2.MilestoneId,
      ]),
      CurrentMilestone: 0,
      NftId: null,
      DisputeIds: JSON.stringify([this.dispute.DisputeId]),
      Status: ContractStatuses.INPROGRESS,
    };

    this.artistContract.Status = ContractStatuses.INDISPUTE;
    when(this.stub.getState(this.artistContract.ContractId)).thenResolve(
      Buffer.from(
        JSON.stringify({
          ...expectedArtistContractBody,
          Status: ContractStatuses.INDISPUTE,
        })
      )
    );

    when(this.stub.getTxID()).thenReturn(
      this.dispute.DisputeId,
      this.milestone1.MilestoneId,
      this.milestone2.MilestoneId
    );

    await createDispute(this.mockContext, this.stub, {
      ...this.dispute,
      DisputeId: this.dispute.DisputeId,
    });

    await createMilestone(
      this.mockContext,
      this.stub,
      {
        ...this.milestone1,
        Status: MilestoneStatuses.INDISPUTE,
      },
      this.artistContract
    );
    await createMilestone(
      this.mockContext,
      this.stub,
      this.milestone2,
      this.artistContract
    );
    resetCalls(this.stub);

    let res: ChaincodeResponse = await this.disputeSmartContract.resolveDispute(
      this.mockContext,
      this.artistContract.ContractId
    );
    if (res.status !== 200) {
      console.log("resolve dispute test failed", res.message.toString());
    }
    assert.strictEqual(res.status, 200);
    //assert.deepStrictEqual(res.message, "");
    let [actualDisputeId, actualDisputeBody] = capture(
      this.stub.putState
    ).byCallIndex(0);
    let [actualMilestoneId, actualMilestoneBody] = capture(
      this.stub.putState
    ).byCallIndex(1);
    let [actualContractId, contractBody] = capture(
      this.stub.putState
    ).byCallIndex(2);
    assert.strictEqual(actualDisputeId, this.dispute.DisputeId);
    assert.deepStrictEqual(JSON.parse(actualDisputeBody.toString()), {
      ...this.dispute,
      DisputeId: this.dispute.DisputeId,
      Status: DisputeStatuses.RESOLVED,
    });
    assert.strictEqual(actualMilestoneId, this.milestone1.MilestoneId);
    assert.deepStrictEqual(JSON.parse(actualMilestoneBody.toString()), {
      ...this.milestone1,
      MilestoneId: this.milestone1.MilestoneId,
    });
    assert.strictEqual(actualContractId, expectedArtistContractBody.ContractId);
    assert.deepStrictEqual(
      JSON.parse(contractBody.toString()),
      expectedArtistContractBody
    );
  }

  @test async "Cannot resolve dispute that does not exist"() {
    reset(this.stub);
    reset(this.mockContext);
    this.mockContext.stub = instance(this.stub);
    await this.configUsers();
    let milestones = [{ ...this.milestone1 }, { ...this.milestone2 }];
    await createArtistContract(
      this.mockContext,
      this.stub,
      this.artistContract,
      milestones
    );
    let res: ChaincodeResponse = await this.disputeSmartContract.resolveDispute(
      this.mockContext,
      this.artistContract.ContractId
    );
    assert.notStrictEqual(res.status, 200);
    console.log(res.message.toString(), 5656);
    assert(res.message.toString().includes("Dispute does not exist"));
  }

  @test async "Cannot put contract in dispute if contract does not exist"() {
    reset(this.stub);
    reset(this.mockContext);
    this.mockContext.stub = instance(this.stub);
    await this.configUsers();
    let res: ChaincodeResponse =
      await this.artistSmartContract.putContractInDispute(
        this.mockContext,
        this.artistContract.ContractId,
        Date.now()
      );
    assert.notStrictEqual(res.status, 200);
    assert(res.message.includes("Contract does not exist"));
  }

  @test
  async "Cannot put contract in dispute if contract already in dispute"() {
    reset(this.stub);
    reset(this.mockContext);
    this.mockContext.stub = instance(this.stub);
    await this.configUsers();
    let milestones = [{ ...this.milestone1 }, { ...this.milestone2 }];
    await createArtistContract(
      this.mockContext,
      this.stub,
      this.artistContract,
      milestones
    );
    this.artistContract.Status = ContractStatuses.INDISPUTE;
    when(this.stub.getState(this.artistContract.ContractId)).thenResolve(
      Buffer.from(JSON.stringify(this.artistContract))
    );
    let res: ChaincodeResponse =
      await this.artistSmartContract.putContractInDispute(
        this.mockContext,
        this.artistContract.ContractId,
        Date.now()
      );
    assert.notStrictEqual(res.status, 200);
    assert(res.message.includes("Contract already in dispute"));
  }

  @test async "Cannot put contract in dispute if contract is completed"() {
    reset(this.stub);
    reset(this.mockContext);
    this.mockContext.stub = instance(this.stub);
    await this.configUsers();
    let milestones = [{ ...this.milestone1 }, { ...this.milestone2 }];
    await createArtistContract(
      this.mockContext,
      this.stub,
      this.artistContract,
      milestones
    );
    this.artistContract.Status = ContractStatuses.COMPLETED;
    when(this.stub.getState(this.artistContract.ContractId)).thenResolve(
      Buffer.from(JSON.stringify(this.artistContract))
    );
    let res: ChaincodeResponse =
      await this.artistSmartContract.putContractInDispute(
        this.mockContext,
        this.artistContract.ContractId,
        Date.now()
      );
    assert.notStrictEqual(res.status, 200);
    assert(res.message.includes("Contract already completed"));
  }

  @test async "Can't advance milestone in invalid milestone states"() {
    let contractStatuses = invalidContractActionStates;
    let statuses = [MilestoneStatuses.COMPLETED, MilestoneStatuses.INDISPUTE];
    let messages = [
      "Cannot advance an completed milestone",
      "Cannot advance an milestone if in dispute",
    ];
    for (let i = 0; i < statuses.length; i++) {
      for (let j = 0; j < contractStatuses.length; j++) {
        reset(this.stub);
        reset(this.mockContext);
        this.mockContext.stub = instance(this.stub);
        await createUser(this.mockContext, this.stub, this.client);
        await createUser(this.mockContext, this.stub, this.artist);
        let milestones = [{ ...this.milestone1 }, { ...this.milestone2 }];
        await createArtistContract(
          this.mockContext,
          this.stub,
          this.artistContract,
          milestones
        );

        let disputeId = this.dispute.DisputeId;

        const expectedArtistContractBody = {
          ...this.artistContract,
          DocType: ARTIST_CONTRACT_DOC_TYPE,
          ContractId: this.artistContract.ContractId,
          MilestoneIds: JSON.stringify([
            this.milestone1.MilestoneId,
            this.milestone2.MilestoneId,
          ]),
          CurrentMilestone: 0,
          NftId: null,
          DisputeIds: JSON.stringify([disputeId]),
          Status: ContractStatuses.INPROGRESS,
        };

        when(this.stub.getState(this.artistContract.ContractId)).thenResolve(
          Buffer.from(
            JSON.stringify({
              ...expectedArtistContractBody,
              Status: contractStatuses[j],
            })
          )
        );

        await createMilestone(
          this.mockContext,
          this.stub,
          {
            ...this.milestone1,
            Status: statuses[i],
          },
          this.artistContract
        );
        resetCalls(this.stub);

        let res: ChaincodeResponse =
          await this.milestoneSmartContract.advanceMilestone(
            this.mockContext,
            this.artistContract.ContractId,
            Date.now(),
            JSON.stringify([]),
            JSON.stringify([])
          );

        assert.notStrictEqual(res.status, 200);
        if (contractStatuses[j] !== ContractStatuses.INPROGRESS) {
          assert(res.status !== 200);
        } else {
          console.log(res.message.toString(), messages[i], 8787);
          assert(res.message.toString().includes(messages[i]));
        }
      }
    }
  }

  @test async "Test advance NOTSTARTED & INPROGRESS milestone"() {
    let statuses = [MilestoneStatuses.NOTSTARTED, MilestoneStatuses.INPROGRESS];
    for (let i = 0; i < statuses.length; i++) {
      reset(this.stub);
      reset(this.mockContext);
      this.mockContext.stub = instance(this.stub);
      await createUser(this.mockContext, this.stub, this.client);
      await createUser(this.mockContext, this.stub, this.artist);
      let milestones = [{ ...this.milestone1 }, { ...this.milestone2 }];
      await createArtistContract(
        this.mockContext,
        this.stub,
        this.artistContract,
        milestones
      );

      const expectedArtistContractBody = {
        ...this.artistContract,
        DocType: ARTIST_CONTRACT_DOC_TYPE,
        ContractId: this.artistContract.ContractId,
        MilestoneIds: JSON.stringify([
          this.milestone1.MilestoneId,
          this.milestone2.MilestoneId,
        ]),
        CurrentMilestone: 0,
        NftId: null,
        DisputeIds: JSON.stringify([this.dispute.DisputeId]),
        Status: ContractStatuses.INPROGRESS,
      };

      when(this.stub.getState(this.artistContract.ContractId)).thenResolve(
        Buffer.from(
          JSON.stringify({
            ...expectedArtistContractBody,
            Status: ContractStatuses.INPROGRESS,
          })
        )
      );

      await createMilestone(
        this.mockContext,
        this.stub,
        {
          ...this.milestone1,
          Status: statuses[i],
        },
        this.artistContract
      );
      await createMilestone(
        this.mockContext,
        this.stub,
        {
          ...this.milestone2,
          Status: MilestoneStatuses.NOTSTARTED,
        },
        this.artistContract
      );
      resetCalls(this.stub);
      console.log("ADVANCING MILESTONE", statuses[i]);
      let res: ChaincodeResponse =
        await this.milestoneSmartContract.advanceMilestone(
          this.mockContext,
          this.artistContract.ContractId,
          Date.now(),
          JSON.stringify([]),
          JSON.stringify([])
        );

      // console.log(res.message.toString(), "LOGGED")
      if (res.status !== 200) {
        throw new Error(res.message.toString() + statuses[i] + this.milestone1);
      }
      assert.strictEqual(res.status, 200);

      if (statuses[i] === MilestoneStatuses.INPROGRESS) {
        let [milestoneTwoId, milestoneTwoBody] = capture(
          this.stub.putState
        ).byCallIndex(0);
        let [artistContractId, artistContractBody] = capture(
          this.stub.putState
        ).byCallIndex(1);
        let [milestoneOneId, milestoneOneBody] = capture(
          this.stub.putState
        ).byCallIndex(2);

        assert.strictEqual(milestoneOneId, this.milestone1.MilestoneId);
        assert.strictEqual(milestoneTwoId, this.milestone2.MilestoneId);
        assert.strictEqual(artistContractId, this.artistContract.ContractId);
        assert.deepStrictEqual(JSON.parse(milestoneOneBody.toString()), {
          ...this.milestone1,
          Status: MilestoneStatuses.COMPLETED,
          MilestoneId: this.milestone1.MilestoneId,
          EndDate: 0,
        });
        assert.deepStrictEqual(JSON.parse(milestoneTwoBody.toString()), {
          ...this.milestone2,
          Status: MilestoneStatuses.INPROGRESS,
          MilestoneId: this.milestone2.MilestoneId,
          StartDate: 0,
        });
        assert.deepStrictEqual(JSON.parse(artistContractBody.toString()), {
          ...expectedArtistContractBody,
          CurrentMilestone: 1,
        });
      } else {
        let [milestoneOneId, milestoneOneBody] = capture(
          this.stub.putState
        ).byCallIndex(0);
        assert.strictEqual(milestoneOneId, this.milestone1.MilestoneId);
        assert.deepStrictEqual(JSON.parse(milestoneOneBody.toString()), {
          ...this.milestone1,
          Status: MilestoneStatuses.INPROGRESS,
          MilestoneId: this.milestone1.MilestoneId,
          StartDate: 0,
        });
      }
    }
  }

  @test async "Cannot put contract in dispute if do not own contract"() {
    reset(this.stub);
    reset(this.mockContext);
    this.mockContext.stub = instance(this.stub);
    await this.configUsers();
    let milestones = [{ ...this.milestone1 }, { ...this.milestone2 }];
    await createArtistContract(
      this.mockContext,
      this.stub,
      this.artistContract,
      milestones
    );
    await createUser(this.mockContext, this.stub, this.artist2);
    let res: ChaincodeResponse =
      await this.artistSmartContract.putContractInDispute(
        this.mockContext,
        this.artistContract.ContractId,
        Date.now()
      );
    assert.notStrictEqual(res.status, 200);
    console.log(res.message.toString(), 54543);
    assert(res.message.toString().includes("Unauthorized"));
  }
  /**
   * Currently not working due to inability to mock out getHistoryForKey method
   */
  // @test async "Test getting history for contract"() {
  //   reset(this.stub);
  //   reset(this.mockContext);
  //   this.mockContext.stub = instance(this.stub);
  //   await createUser(this.mockContext, this.stub,this.client);
  //   await createUser(this.mockContext, this.stub,this.artist);
  //   await createUser(this.mockContext, this.stub,this.artist2);
  //   let milestones = [{ ...this.milestone1 }, { ...this.milestone2 }];
  //   await createArtistContract(
  //     this.mockContext,
  //     this.stub,
  //     this.artistContract,
  //     milestones
  //   );
  //   type HistoryQueryIterator = CommonIterator<KeyModification>;
  //   let historyQueryIterator = mock<HistoryQueryIterator>();
  //   let timestamp: Timestamp = { seconds: new Long(1245), nanos: 1234 };
  //   let keyModification: KeyModification = {
  //     txId: "1234",
  //     value: Buffer.from(JSON.stringify(this.artistContract)),
  //     timestamp,
  //     isDelete: false,
  //   };
  //   console.log("Here");
  //   when(historyQueryIterator.next()).thenResolve({
  //     value: keyModification,
  //     done: true,
  //   });
  //   console.log(
  //     "ID: " + this.artistContract.ContractId
  //   );
  //   when(
  //     this.stub.getHistoryForKey(
  //       this.artistContract.ContractId
  //     )
  //   ).thenResolve(historyQueryIterator);
  //   when(historyQueryIterator.close()).thenResolve();
  //   let res: ChaincodeResponse =
  //     await this.artistSmartContract.getArtistContractHistory(
  //       this.mockContext,
  //       this.artistContract.ContractId,
  //       this.artist.UserId
  //     );
  //   assert.strictEqual(res.status, 200);
  //   assert.deepStrictEqual(JSON.parse(res.payload.toString()), [
  //     {
  //       txId: keyModification.txId,
  //       value: keyModification.value.toString(),
  //     },
  //   ]);
  // }

  @test async "Cannot get history for contract you do not own"() {
    reset(this.stub);
    reset(this.mockContext);
    this.mockContext.stub = instance(this.stub);
    await this.configUsers();
    let milestones = [{ ...this.milestone1 }, { ...this.milestone2 }];
    await createArtistContract(
      this.mockContext,
      this.stub,
      this.artistContract,
      milestones
    );
    await createUser(this.mockContext, this.stub, this.artist2);

    let res: ChaincodeResponse =
      await this.artistSmartContract.getArtistContractHistory(
        this.mockContext,
        this.artistContract.ContractId
      );
    assert.notStrictEqual(res.status, 200);
    console.log(res.message.toString(), 5433343);
    assert(res.message.toString().includes("Unauthorized"));
  }

  @test async "Cannot get history for contract that does not exist"() {
    reset(this.stub);
    reset(this.mockContext);
    this.mockContext.stub = instance(this.stub);
    await this.configUsers();
    let res: ChaincodeResponse =
      await this.artistSmartContract.getArtistContractHistory(
        this.mockContext,
        this.artistContract.ContractId
      );
    assert.notStrictEqual(res.status, 200);
    assert(res.message.includes("Contract does not exist"));
  }

  @test async "Get list of user contracts "() {
    reset(this.stub);
    reset(this.mockContext);
    console.log("here");
    this.mockContext.stub = instance(this.stub);
    await this.configUsers();
    let milestones = [{ ...this.milestone1 }, { ...this.milestone2 }];
    await createArtistContract(
      this.mockContext,
      this.stub,
      this.artistContract,
      milestones
    );
    await createMilestone(
      this.mockContext,
      this.stub,
      this.milestone1,
      this.artistContract
    );
    await createMilestone(
      this.mockContext,
      this.stub,
      this.milestone2,
      this.artistContract
    );

    await this.artistSmartContract.putContractInDispute(
      this.mockContext,
      this.artistContract.ContractId,
      Date.now()
    );
    await createDispute(this.mockContext, this.stub, {
      ...this.dispute,
    });

    const x = [this.artistContract];
    when(this.iter.next()).thenResolve({
      value: {
        value: JSON.stringify({
          ...this.artistContract,
          DisputeIds: JSON.stringify([this.dispute.DisputeId]),
          MilestoneIds: JSON.stringify([
            this.milestone1.MilestoneId,
            this.milestone2.MilestoneId,
          ]),
        }),
      },
      done: true,
    });
    const stateIter = {
      iterator: this.iter,
      metadata: {
        fetchedRecordsCount: 1,
        bookmark: "bookmark",
      },
    } as StateQueryResponse<Iter<ArtistContract>>;
    stateIter.iterator;
    when(
      this.stub.getQueryResult(
        `{"selector":{"ArtistId":"${this.artist.UserId}"}}`
      )
    ).thenResolve(instance(this.iter));
    console.log(
      "Query-:" + `{"selector":{"ArtistId":"${this.artist.UserId}"}}`
    );
    let res2: ChaincodeResponse =
      await this.artistSmartContract.getArtistContracts(this.mockContext);
    console.log(res2.payload.toString(), 5433343);
    const contracts = JSON.parse(res2.payload.toString());
    assert.strictEqual(contracts.length, 1);
    assert.strictEqual(contracts[0].ContractId, this.artistContract.ContractId);
    assert.strictEqual(contracts[0].Milestones.length, 2);
    assert.strictEqual(contracts[0].Disputes.length, 1);
    assert.deepStrictEqual(contracts[0].Disputes[0], {
      ...this.dispute,
      Status: DisputeStatuses.INPROGRESS,
      DocType: DISPUTE_DOC_TYPE,
    });
    assert.deepStrictEqual(contracts[0].Milestones[0], {
      ...this.milestone1,
      Status: MilestoneStatuses.INPROGRESS,
    });
  }
}
