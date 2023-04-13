import {
  Object,
  Property,
  Transaction,
  Contract,
  Context,
  Info,
} from "fabric-contract-api";
import { Shim } from "fabric-shim";
import stringify from "json-stringify-deterministic";
import sortKeysRecursive from "sort-keys-recursive";
import {
  ArtistContract,
  ArtistContractSmartContract,
  ContractStatuses,
} from "./ArtistContract";
import { AuthChecker } from "./HelperTypes/AuthChecker";
import { User, UserSmartContract } from "./User";

export const NFT_DOC_TYPE = "NFT";

@Object()
export class NftObject {
  @Property()
  public NftId: string;

  @Property()
  public DocType: string;

  @Property()
  public OwnerId: string;

  @Property()
  public FileHashs: string;

  @Property()
  public TimeStamp: number;

  @Property()
  public FileKeys: string;

  @Property()
  public OriginalProjectId: string;

  @Property()
  public DisplayAssetKey: string;

  @Property()
  public DisplayAssetHash: string;
}

@Info({ title: "NftContract", description: "Smart contract for NFTs" })
export class NftSmartContract extends Contract {
  @Transaction()
  public async createNft(
    ctx: Context,
    fileHashs: string,
    fileKeys: string,
    originalProjectId: string,
    currDate: number,
    displayAssetKey: string,
    displayAssetHash: string
  ) {
    let fileHashsParsed: string[] = JSON.parse(fileHashs);
    let fileKeysParsed: string[] = JSON.parse(fileKeys);
    if (fileHashsParsed.length !== fileKeysParsed.length) {
      return Shim.error(
        Buffer.from(
          "File hashes and keys are not equal" +
            " Hashes: " +
            fileHashs +
            " Keys:" +
            fileKeys +
            " NFTOBJECT02"
        )
      );
    }

    if (fileHashsParsed.length === 0) {
      return Shim.error(
        Buffer.from("File hashes and keys are empty" + " NFTOBJECT03")
      );
    }
    let nft = new NftObject();
    let userSmartContract = new UserSmartContract();
    let artistSmartContract = new ArtistContractSmartContract();
    let artistContractRes = await artistSmartContract.getArtistContract(
      ctx,
      originalProjectId
    );
    if (!(artistContractRes.status === 200)) {
      return Shim.error(
        Buffer.from("Artist contract does not exist" + " NFTOBJECT01")
      );
    }
    const artistContract: ArtistContract = JSON.parse(
      artistContractRes.payload.toString()
    );

    const milestoneRes =
      await artistSmartContract.getMilestonesFromArtistContract(
        ctx,
        artistContractRes.payload.toString()
      );
    if (!(milestoneRes.status === 200)) {
      return Shim.error(Buffer.from("Error getting milestones"));
    }
    const milestones = JSON.parse(milestoneRes.payload.toString());
    const hashesDict = new Map<string, boolean>();
    fileHashsParsed.forEach((hash) => {
      hashesDict.set(hash, true);
    });
    for (let i = 0; i < milestones.length; i++) {
      let milestoneHashes = JSON.parse(milestones[i].FileHashes);
      for (let j = 0; j < milestoneHashes.length; j++) {
        if (!hashesDict.get(milestoneHashes[j])) {
          return Shim.error(
            Buffer.from(
              "File hashes do not contain all milestone hashes" +
                " NFTOBJECT04" +
                " Milestone: " +
                i +
                " Hash: " +
                milestoneHashes[j]
            )
          );
        }
      }
    }
    const res = await userSmartContract.getClientOfContract(
      ctx,
      artistContract
    );
    if (artistContract.Status !== ContractStatuses.COMPLETED) {
      return Shim.error(
        Buffer.from(
          "Artist contract not complete status:" +
            artistContract.Status +
            " NFTOBJECT02"
        )
      );
    }
    console.log("Parsing user", res.payload.toString());
    let user: User = JSON.parse(res.payload.toString());
    let nftIds: string[] = JSON.parse(user.NftIds);
    nftIds.push(ctx.stub.getTxID());
    user.NftIds = stringify(nftIds);
    const { ...userObject } = user;
    await ctx.stub.putState(
      user.UserId,
      Buffer.from(stringify(sortKeysRecursive(userObject)))
    );
    nft.NftId = ctx.stub.getTxID();
    nft.DocType = NFT_DOC_TYPE;
    nft.OwnerId = user.UserId;
    nft.FileHashs = fileHashs;
    nft.TimeStamp = currDate;
    nft.FileKeys = fileKeys;
    nft.OriginalProjectId = originalProjectId;
    nft.DisplayAssetHash = displayAssetHash;
    nft.DisplayAssetKey = displayAssetKey;
    const { ...object } = nft;
    // FIXME: Validate the owner, and contract
    console.info(`Buffer input ${stringify(sortKeysRecursive(object))}`);
    await ctx.stub.putState(
      nft.NftId,
      Buffer.from(stringify(sortKeysRecursive(object)))
    );
    artistContract.NftId = nft.NftId;
    artistContract.Status = ContractStatuses.MINTED;
    await ctx.stub.putState(
      artistContract.ContractId,
      Buffer.from(stringify(sortKeysRecursive(artistContract)))
    );
    return Shim.success(
      Buffer.from(stringify({ nftId: nft.NftId, clientId: user.UserId }))
    );
  }

  @Transaction(false)
  public async getNftsByOwner(ctx: Context) {
    let userSmartContract = new UserSmartContract();
    let res = await userSmartContract.getUser(
      ctx,
      ctx.clientIdentity.getAttributeValue("hf.EnrollmentID")
    );
    if (res.status !== 200) {
      return Shim.error(Buffer.from("Client does not exist" + "NFTOBJECT09"));
    }
    let user: User = JSON.parse(res.payload.toString());
    console.log("User:", user);
    let nftIds: string[] = JSON.parse(user.NftIds);
    let promises: Promise<NftObject>[] = nftIds.map(async (nftId) => {
      let res = await ctx.stub.getState(nftId);
      console.log(res.toString(), "Query result", nftId);
      return JSON.parse(res.toString());
    });

    let nftObjects: NftObject[] = await Promise.all<NftObject>(promises);
    console.log(nftObjects, "Nft objects");
    return Shim.success(Buffer.from(stringify(nftObjects)));
  }

  @Transaction(false)
  public async getNftById(ctx: Context, NftId: string) {
    let res = await ctx.stub.getState(NftId);
    const nft: NftObject = JSON.parse(res.toString());
    if (!AuthChecker.checkAuth(ctx, nft.OwnerId)) {
      return Shim.error(Buffer.from("not authorized" + "NFTOBJECT09"));
    }

    return Shim.success(Buffer.from(stringify(nft)));
  }
}
