import { Context } from "fabric-contract-api";
import { suite, test } from "@testdeck/mocha";
import { mock, instance, capture, reset, when, resetCalls } from "ts-mockito";
import { ChaincodeStub } from "fabric-shim";
import { User, UserSmartContract } from "../src/User";
import { UserTypes } from "../src/HelperTypes/EnumTypes";
import { NftObject, NftSmartContract, NFT_DOC_TYPE } from "../src/Nft";

import {
  createUser,
  createNft,
  mockDateNow,
  createArtistContract,
  invalidContractActionStates,
  mockLoggedInUser,
  createMilestone,
} from "./Helpers";
import assert from "node:assert";
import stringify from "json-stringify-deterministic";
import sortKeysRecursive from "sort-keys-recursive";
import {
  ArtistContract,
  ArtistContractSmartContract,
  ARTIST_CONTRACT_DOC_TYPE,
  ContractStatuses,
} from "../src/ArtistContract";
import {
  ActionTypes,
  Milestone,
  MilestoneStatuses,
  MILESTONE_DOC_TYPE,
} from "../src/Milestone";

@suite
class NftObjectTest {
  mockContext = mock(Context);
  stub = mock(ChaincodeStub);

  artist = new User();
  client = new User();
  client2 = new User();
  nft1 = new NftObject();
  nft2 = new NftObject();

  nftSmartContract = new NftSmartContract();
  userSmartContract = new UserSmartContract();
  artistContract = new ArtistContract();
  artistContract2 = new ArtistContract();

  milestone1 = new Milestone();

  before() {
    this.artistContract.ArtistId = "5678";
    this.artistContract.ClientId = "1234";
    this.artistContract.ContractId = "c1234";
    this.artistContract.CurrentMilestone = 1;
    this.artistContract.DisputeIds = JSON.stringify([]);
    this.artistContract.DocType = ARTIST_CONTRACT_DOC_TYPE;
    this.artistContract.Status = ContractStatuses.COMPLETED;

    this.artistContract2.ArtistId = "5678";
    this.artistContract2.ClientId = "1234";
    this.artistContract2.ContractId = "c5678";
    this.artistContract2.CurrentMilestone = 1;
    this.artistContract2.DisputeIds = JSON.stringify([]);
    this.artistContract2.DocType = ARTIST_CONTRACT_DOC_TYPE;
    this.artistContract2.Status = ContractStatuses.COMPLETED;

    this.milestone1.MilestoneId = "m1234";
    this.milestone1.DocType = MILESTONE_DOC_TYPE;
    this.milestone1.ContractId = this.artistContract.ContractId;
    this.milestone1.ActionType = ActionTypes.ROYALTY;
    this.milestone1.Amount = 100;
    this.milestone1.Currency = "eth";
    this.milestone1.Status = MilestoneStatuses.COMPLETED;
    this.milestone1.FileHashes = "[]";
    this.milestone1.FileKeys = "[]";

    this.client.UserId = "1234";
    this.client.DocType = "user";
    this.client.Email = "rand@random.ca";
    this.client.WalletAddress = "0x1234";
    this.client.UserType = UserTypes.CLIENT;
    this.client.NftIds = JSON.stringify([]);

    this.client2.UserId = "4567";
    this.client2.DocType = "user";
    this.client2.Email = "ran2d@random.ca";
    this.client2.WalletAddress = "0x12345";
    this.client2.UserType = UserTypes.CLIENT;
    this.client2.NftIds = JSON.stringify([]);

    this.artist.UserId = "5678";
    this.artist.DocType = "user";
    this.artist.Email = "Email@Email.com";
    this.artist.WalletAddress = "0x5678";
    this.artist.UserType = UserTypes.ARTIST;
    this.artist.NftIds = JSON.stringify([]);

    this.nft1.NftId = "nft1";
    this.nft1.DocType = NFT_DOC_TYPE;
    this.nft1.FileHashs = JSON.stringify(["hash1", "hash2"]);
    this.nft1.FileKeys = JSON.stringify(["key1", "key2"]);
    this.nft1.OriginalProjectId = this.artistContract.ContractId;
    this.nft1.OwnerId = this.client.UserId;
    this.nft1.TimeStamp = mockDateNow.now();
    this.nft1.DisplayAssetHash = "";
    this.nft1.DisplayAssetKey = "";

    this.nft2.NftId = "nft1";
    this.nft2.DocType = NFT_DOC_TYPE;
    this.nft2.FileHashs = JSON.stringify(["hash3", "hash4"]);
    this.nft2.FileKeys = JSON.stringify(["key3", "key4"]);
    this.nft2.OriginalProjectId = this.artistContract2.ContractId;
    this.nft2.OwnerId = this.client.UserId;
    this.nft2.TimeStamp = mockDateNow.now();
    this.nft2.DisplayAssetHash = "";
    this.nft2.DisplayAssetKey = "";
  }

  @test async "Create nft"() {
    Date = mockDateNow as any;

    const idOne = "0";
    this.nft1.NftId = idOne;
    when(this.stub.getTxID()).thenReturn(idOne);
    let mockStub = instance(this.stub);
    this.mockContext.stub = mockStub;
    await createUser(this.mockContext, this.stub, this.client);
    await createUser(this.mockContext, this.stub, this.artist);

    await createArtistContract(
      this.mockContext,
      this.stub,
      this.artistContract,
      [this.milestone1]
    );
    await createMilestone(
      this.mockContext,
      this.stub,
      this.milestone1,
      this.artistContract
    );
    resetCalls(this.stub);
    console.log("Contract id:", this.nft1.OriginalProjectId);
    const res = await createNft(this.mockContext, this.stub, this.nft1);
    if (res.status !== 200) {
      console.log(res.message.toString(), 67965);
    }
    let [clientId, clientBody] = capture(this.stub.putState).byCallIndex(0);
    let [nftId, nftBody] = capture(this.stub.putState).byCallIndex(1);
    let [contractId, contractBody] = capture(this.stub.putState).byCallIndex(2);

    let expectedIds = [this.nft1.NftId];
    assert.strictEqual(clientId, this.client.UserId);
    assert.deepStrictEqual(JSON.parse(clientBody.toString()), {
      ...this.client,
      NftIds: JSON.stringify(expectedIds),
    });
    assert.strictEqual(nftId, this.nft1.NftId);
    assert.deepStrictEqual(JSON.parse(nftBody.toString()), {
      ...this.nft1,
      NftId: idOne,
    });
    assert.strictEqual(contractId, this.artistContract.ContractId);
    assert.deepStrictEqual(JSON.parse(contractBody.toString()), {
      ...this.artistContract,
      Status: ContractStatuses.MINTED,
      ContractId: this.artistContract.ContractId,
      MilestoneIds: JSON.stringify([this.milestone1.MilestoneId]),
      NftId: this.nft1.NftId,
    });
  }

  @test async "Cannot create nft for contract which is not completed"() {
    Date = mockDateNow as any;
    invalidContractActionStates.forEach(async (status) => {
      const idOne = "0";
      this.nft1.NftId = idOne;
      when(this.stub.getTxID()).thenReturn(idOne);
      let mockStub = instance(this.stub);
      this.mockContext.stub = mockStub;
      await createUser(this.mockContext, this.stub, this.client);
      await createUser(this.mockContext, this.stub, this.artist);
      this.artistContract.CurrentMilestone = 0;
      this.artistContract.Status = status;
      await createMilestone(
        this.mockContext,
        this.stub,
        this.milestone1,
        this.artistContract
      );
      await createArtistContract(
        this.mockContext,
        this.stub,
        this.artistContract,
        [this.milestone1]
      );
      resetCalls(this.stub);
      let res = await createNft(this.mockContext, this.stub, this.nft1);
      assert(res.status !== 200);
      assert(res.message.includes("Artist contract is not complete"));
    });
  }
  @test async "Create nft with invalid contract"() {
    Date = mockDateNow as any;

    const idOne = "0";
    this.nft1.NftId = idOne;
    when(this.stub.getTxID()).thenReturn(idOne);
    let mockStub = instance(this.stub);
    this.mockContext.stub = mockStub;
    await createUser(this.mockContext, this.stub, this.client);
    await createUser(this.mockContext, this.stub, this.artist);

    resetCalls(this.stub);
    let res = await createNft(this.mockContext, this.stub, this.nft1);
    assert(res.message.includes("Artist contract does not exist"));
  }

  @test async "Create nft without files"() {
    Date = mockDateNow as any;

    const idOne = "0";
    this.nft1.NftId = idOne;
    this.nft1.FileHashs = JSON.stringify([]);
    this.nft1.FileKeys = JSON.stringify([]);
    when(this.stub.getTxID()).thenReturn(idOne);
    let mockStub = instance(this.stub);
    this.mockContext.stub = mockStub;
    await createUser(this.mockContext, this.stub, this.client);
    await createUser(this.mockContext, this.stub, this.artist);
    await createArtistContract(
      this.mockContext,
      this.stub,
      this.artistContract,
      [this.milestone1]
    );
    resetCalls(this.stub);
    let res = await createNft(this.mockContext, this.stub, this.nft1);
    assert(res.message.toString().includes("File hashes and keys are empty"));
  }

  @test async "Create nft with different file count"() {
    Date = mockDateNow as any;

    const idOne = "0";
    this.nft1.NftId = idOne;
    this.nft1.FileHashs = JSON.stringify(["hash1", "hash2"]);
    this.nft1.FileKeys = JSON.stringify(["key1"]);
    when(this.stub.getTxID()).thenReturn(idOne);
    let mockStub = instance(this.stub);
    this.mockContext.stub = mockStub;
    await createUser(this.mockContext, this.stub, this.client);
    await createUser(this.mockContext, this.stub, this.artist);
    await createArtistContract(
      this.mockContext,
      this.stub,
      this.artistContract,
      [this.milestone1]
    );
    resetCalls(this.stub);
    let res = await createNft(this.mockContext, this.stub, this.nft1);
    assert(
      res.message.toString().includes("File hashes and keys are not equal")
    );
  }

  @test async "get nfts by client id"() {
    Date = mockDateNow as any;

    const idOne = "0";
    const idTwo = "1";

    this.nft1.NftId = idOne;
    this.nft2.NftId = idTwo;

    when(this.stub.getTxID()).thenReturn(idOne);
    let mockStub = instance(this.stub);
    this.client.NftIds = JSON.stringify([idOne, idTwo]);
    this.mockContext.stub = mockStub;
    await createUser(this.mockContext, this.stub, this.client);
    await createUser(this.mockContext, this.stub, this.client2);
    await createUser(this.mockContext, this.stub, this.artist);

    await createArtistContract(
      this.mockContext,
      this.stub,
      this.artistContract,
      [this.milestone1]
    );
    await createArtistContract(
      this.mockContext,
      this.stub,
      this.artistContract2,
      [this.milestone1]
    );
    await createMilestone(
      this.mockContext,
      this.stub,
      this.milestone1,
      this.artistContract
    );
    resetCalls(this.stub);
    await createNft(this.mockContext, this.stub, this.nft1);
    when(this.stub.getTxID()).thenReturn(idTwo);
    await createNft(this.mockContext, this.stub, this.nft2);
    resetCalls(this.stub);
    mockLoggedInUser(this.mockContext, this.stub, this.client);
    let nfts = await this.nftSmartContract.getNftsByOwner(
      this.mockContext,
      this.client.UserId
    );
    console.log(nfts, "NFts", nfts.status);
    console.log(JSON.parse(nfts.payload.toString()), "NFts");
    console.log([this.nft1, this.nft2], "NFts2");
    assert.deepStrictEqual(
      nfts.payload.toString(),
      stringify(sortKeysRecursive([this.nft1, this.nft2]))
    );
    mockLoggedInUser(this.mockContext, this.stub, this.client2);

    let nfts2 = await this.nftSmartContract.getNftsByOwner(
      this.mockContext,
      this.client2.UserId
    );
    assert.deepStrictEqual(nfts2.payload.toString(), JSON.stringify([]));
  }
}
