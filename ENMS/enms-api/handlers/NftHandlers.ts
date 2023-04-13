import { Request, Response } from "express";
import { ChainWriter } from "../fabric-helpers/ChainWriter";
import {
  ClientCredentials,
  getVerifiedEmailToken,
} from "../mongoose/Credentials";
import {
  MintRequest,
  NftRequest,
  User,
  MilestoneType,
  NftType,
  ContractType,
  NftFileIncludeType,
} from "./types/BlockChainTypes";
import {
  ApiMessageResponseType,
  ApiMessagePayloadResponseType,
} from "./types/ResponseTypes";
import bcrypt from "bcrypt";
import { sendEmail } from "../email-service";
import { File } from "../mongoose/File";
import { Project } from "../mongoose/Project";
import Stream, { Readable } from "node:stream";
import {
  FileResponse,
  downloadFileByKey,
  generateBlobDownloadUrlByKey,
  uploadProjectFromBase64,
} from "../storage-service";
import {
  getFileByKey,
  initStorageService,
  uploadProject,
} from "../storage-service";
import * as archiver from "archiver";
import { hashFile } from "../hashing-service";
archiver.registerFormat("zip-encrypted", require("archiver-zip-encrypted"));
// OR new Packer(options)

const NFT_CONTRACT_NAME = "NftSmartContract";

async function mintNFTHandler(req: Request, res: Response) {
  try {
    const mintRequest: MintRequest = req.body;

    if (!req.user || !req.user.username) {
      res.status(400).send("no user id");
      return;
    }
    console.log("Minting nft");
    const chainWriter = new ChainWriter();
    await chainWriter.connectToChain();
    const contractBcRes = await chainWriter.queryChain(
      process.env.CHAINCODE_NAME,
      req.user.username,
      [mintRequest.ContractId],
      "ArtistContractSmartContract" + ":getArtistContractWithMilestones"
    );
    if (contractBcRes.status !== 200) {
      res.status(400).send("Error fetching contract details from chain");
    }
    const contract: ContractType = JSON.parse(
      Buffer.from(contractBcRes.payload.data).toString()
    );
    let allFileKeys = [];
    let allFileHashes = [];
    const contractDb = await Project.findById(mintRequest.ContractId);
    if (!contractDb) {
      res.status(400).send("contract does not exist on db");
      return;
    }
    const storageService = await initStorageService();
    // upload project files
    const filesToHashAndSaveOnChain = await File.find({
      _id: { $in: contractDb.files },
      currentMilestone: contract.CurrentMilestone,
    });
    const projectFileHashPromises = filesToHashAndSaveOnChain
      ? filesToHashAndSaveOnChain.map(async (file) => {
          const fileData = await getFileByKey(storageService, file.filePath);
          if (!fileData.status.lastModified) {
            throw new Error("Last modified not found");
          }
          return hashFile(
            Stream.Readable.from(
              Buffer.from(fileData.status.lastModified?.toUTCString())
            )
          );
        })
      : [];

    let displayAssetHashPromise: Promise<string> | null = null;
    let displayAssetUploadPromise: Promise<FileResponse> | null = null;

    // upload and hash display asset
    if (mintRequest.DisplayAsset) {
      const dispBuf = Buffer.from(
        mintRequest.DisplayAsset.fileBase64Data,
        "base64"
      );
      const dispBufStream = Stream.Readable.from(dispBuf);
      displayAssetHashPromise = hashFile(dispBufStream);
      displayAssetUploadPromise = uploadProjectFromBase64(
        storageService,
        contract.ClientId,
        mintRequest.ContractId,
        mintRequest.DisplayAsset.fileName,
        mintRequest.DisplayAsset.fileBase64Data,
        mintRequest.DisplayAsset.fileType
      );
    }

    // milestone files
    const contractFiles = contract.Milestones.map((milestone) => {
      console.log("FileKeys: ", milestone.FileKeys);
      return JSON.parse(milestone.FileKeys);
    }).flat();
    console.log("All File Keys:", contractFiles);
    const fileObjectsPromise = contractFiles.map(async (file) => {
      try {
        return getFileByKey(storageService, file);
      } catch (e) {
        throw new Error("Error getting file by key: " + file + " " + e);
      }
    });

    const fileObjects = await Promise.all(fileObjectsPromise);
    console.log("Hashing");
    const hashesPromise = fileObjects.map(async (file) => {
      if (!file || !file.status.lastModified) {
        throw new Error("Last modified not found" + file);
      }
      return hashFile(
        Stream.Readable.from(
          Buffer.from(file.status.lastModified?.toUTCString())
        )
      );
    });

    const hashes = await Promise.all(hashesPromise);
    for (let i = 0; i < fileObjects.length; i++) {
      const obj = fileObjects[i];
      obj && allFileKeys.push(obj.key);
      allFileHashes.push(hashes[i]);
    }

    const projectFileHashes = await Promise.all(projectFileHashPromises);

    for (let i = 0; i < projectFileHashes.length; i++) {
      const obj = filesToHashAndSaveOnChain[i];
      obj && allFileKeys.push(obj.filePath);
      allFileHashes.push(projectFileHashes[i]);
    }

    const displayAssetHash = displayAssetHashPromise
      ? await displayAssetHashPromise
      : "";
    const displayAssetUpload = displayAssetUploadPromise
      ? await displayAssetUploadPromise
      : { key: "", status: null };
    console.log("Invoking chain");
    console.log(allFileHashes);
    console.log(allFileKeys);
    let bcRes = await chainWriter.invokeChain(
      process.env.CHAINCODE_NAME,
      [
        JSON.stringify(allFileHashes),
        JSON.stringify(allFileKeys),
        mintRequest.ContractId,
        Date.now(),
        displayAssetUpload.key,
        displayAssetHash,
      ],
      NFT_CONTRACT_NAME + ":" + "createNft",
      req.user?.username
    );
    console.log("Chaing res", bcRes);
    if (bcRes.status !== 200) {
      const apiRes: ApiMessageResponseType = {
        status: bcRes.status,
        message: bcRes.stringMessage,
      };
      res.status(bcRes.status).send(apiRes);
      return;
    }
    console.log(bcRes.stringMessage, 54);
    const clientId = JSON.parse(bcRes.stringMessage).clientId;
    const clientCredentials = await ClientCredentials.findOne({
      username: clientId,
    });
    let link = "";
    let token = "";
    if (!process.env.ENMS_LOGIN_URL) {
      throw new Error("ENMS_LOGIN_URL not defined");
    }
    if (!clientCredentials) {
      res.status(400).send("client credentials not found");
      return;
    } else if (clientCredentials.isValidated) {
      // send notification email
      link = process.env.ENMS_LOGIN_URL;
    } else {
      // send sign up email
      token = getVerifiedEmailToken();
      console.log("TOKEN:", token);
      clientCredentials.secureLoginToken = await bcrypt.hash(token, 12);
      clientCredentials.secureLoginTokenExpiry =
        Date.now() + 60 * 1000 * 60 * 48;
      await clientCredentials.save();
      link =
        process.env.ENMS_CLIENT_SIGNUP_URL +
        `?key=${token}&email=${clientCredentials.username}`;
    }

    const projectDb = await Project.findById(mintRequest.ContractId);
    if (!projectDb) {
      res.status(400).send("project not found");
      return;
    }
    const emailRes = await sendEmail(
      clientId,
      clientId,
      projectDb.ProjectName as string,
      req.user.username,
      link,
      token
    );
    if (!emailRes) {
      res.status(400).send("email not sent");
      return;
    }

    const apiRes: ApiMessageResponseType = {
      status: bcRes.status,
      message: "NFT minted to Client on ENMS",
    };
    console.log(bcRes);
    res.send(apiRes);
  } catch (e) {
    console.log(e);
    res.status(400).send("error");
  }
}

async function getAllNftforOwner(req: Request, res: Response) {
  console.log(req.body, req.params, "Get all nfts.");

  let chainWriter = new ChainWriter();
  await chainWriter.connectToChain();
  if (!req.user || !req.user.username) {
    res.status(400).send("user not found");
    return;
  }
  let bcRes = await chainWriter.queryChain(
    process.env.CHAINCODE_NAME,
    req.user?.username.toString(),
    [],
    NFT_CONTRACT_NAME + ":" + "getNftsByOwner"
  );
  if (bcRes.status !== 200) {
    const apiRes: ApiMessageResponseType = {
      status: bcRes.status,
      message: bcRes.stringMessage,
    };
    res.status(bcRes.status).send(apiRes);
    return;
  }

  const nfts: NftType[] = JSON.parse(
    Buffer.from(bcRes.payload.data).toString()
  );
  const storageService = await initStorageService();
  const nftWithDisplayUrl = await Promise.all(
    nfts.map(async (nft) => {
      const projectProjectPromise = Project.findById(nft.OriginalProjectId);
      const displayUrl = await generateBlobDownloadUrlByKey(
        storageService,
        nft.DisplayAssetKey
      );
      const project = await projectProjectPromise;
      return {
        ...nft,
        DisplayAssetUrl: displayUrl,
        ProjectName: project ? project.ProjectName : "",
      };
    })
  );
  const apiRes: ApiMessagePayloadResponseType = {
    status: bcRes.status,
    message: bcRes.stringMessage,
    payloadString: JSON.stringify(nftWithDisplayUrl),
  };
  console.log(bcRes);
  console.log(JSON.parse(Buffer.from(bcRes.payload.data).toString()));
  res.send(apiRes);
}

async function getNftFileDownloadUrls(req: Request, res: Response) {
  console.log(req.body, req.params, "Get all nfts.");
  const nftReq: NftRequest = req.body;

  let chainWriter = new ChainWriter();
  await chainWriter.connectToChain();
  if (!req.user || !req.user.username) {
    res.status(400).send("user not found");
    return;
  }
  let bcRes = await chainWriter.queryChain(
    process.env.CHAINCODE_NAME,
    req.user?.username,
    [nftReq.nftId],
    NFT_CONTRACT_NAME + ":" + "getNftById"
  );

  if (bcRes.status !== 200) {
    const apiRes: ApiMessageResponseType = {
      status: bcRes.status,
      message: bcRes.stringMessage,
    };
    res.status(bcRes.status).send(apiRes);
    return;
  }

  const nft: NftType = JSON.parse(Buffer.from(bcRes.payload.data).toString());

  const fileKeys: string[] = JSON.parse(nft.FileKeys);
  const storageService = await initStorageService();
  interface FileAndUrl {
    file: FileResponse;
    url: string;
  }
  try {
    const filesAndUrls: FileAndUrl[] = await Promise.all(
      fileKeys.map(async (key): Promise<FileAndUrl> => {
        const filePromise = getFileByKey(storageService, key);
        const downloadUrlPromise = generateBlobDownloadUrlByKey(
          storageService,
          key
        );
        const file = await filePromise;
        const url = await downloadUrlPromise;
        return {
          file,
          url,
        };
      })
    );

    const displayAssetUrl = await generateBlobDownloadUrlByKey(
      storageService,
      nft.DisplayAssetKey
    );
    const hashesPromise = filesAndUrls.map(async (file) => {
      if (!file.file.status.lastModified) {
        res.status(400).send("lastModified not found");
        return;
      }
      return hashFile(
        Stream.Readable.from(
          Buffer.from(file.file.status.lastModified?.toUTCString())
        )
      );
    });

    const hashes = await Promise.all(hashesPromise);
    const expectedHashes = JSON.parse(nft.FileHashs);
    for (let i = 0; i < hashes.length; i++) {
      if (hashes[i] !== expectedHashes[i]) {
        res.status(400).send("file corruption error");
        return;
      }
    }

    const nftResponse: NftFileIncludeType = {
      ...nft,
      FileUrls: filesAndUrls.map((file) => file.url),
      DisplayAssetUrl: displayAssetUrl,
    };

    const apiRes: ApiMessagePayloadResponseType = {
      status: bcRes.status,
      message: bcRes.stringMessage,
      payloadString: JSON.stringify(nftResponse),
    };
    console.log(bcRes);
    console.log(JSON.parse(Buffer.from(bcRes.payload.data).toString()));
    res.send(apiRes);
  } catch (e) {
    console.log(e);
    res.status(400).send("file corruption error");
  }
}

async function streamToString(readableStream: any): Promise<Buffer> {
  return new Promise((resolve, reject) => {
    const chunks: any[] = [];
    readableStream.on("data", (data: any) => {
      chunks.push(data);
    });
    readableStream.on("end", () => {
      console.log("end2");
      resolve(Buffer.concat(chunks));
    });
    readableStream.on("error", reject);
  });
}

async function downloadNftZip(req: Request, res: Response) {
  try {
    const privateKey = req.user?.credentials?.privateKey;
    const header = "-----BEGIN PRIVATE KEY-----";
    const footer = "-----END PRIVATE KEY-----";
    const key = privateKey
      ?.substring(header.length, privateKey.length - footer.length)
      .trim()
      .replace(/(\r\n|\n|\r|-)/gm, "");
    console.log(key, 5465);
    const options: any = {
      zlib: { level: 9 },
      password: key,
      encryptionMethod: "zip20",
    } as any;
    const archive = archiver.create("zip-encrypted", options);
    //const archive = new Packer();
    await new Promise<void>(async (resolve, reject) => {
      const nftReq: NftRequest = req.body;
      console.log(req.body);
      let chainWriter = new ChainWriter();
      await chainWriter.connectToChain();
      if (!req.user || !req.user.username) {
        res.status(400).send("user not found");
        return;
      }
      let bcRes = await chainWriter.queryChain(
        process.env.CHAINCODE_NAME,
        req.user?.username,
        [nftReq.nftId],
        NFT_CONTRACT_NAME + ":" + "getNftById"
      );
      console.log("Status", bcRes.status);
      if (bcRes.status !== 200) {
        const apiRes: ApiMessageResponseType = {
          status: bcRes.status,
          message: bcRes.stringMessage,
        };
        res.status(bcRes.status).send(apiRes);
        return;
      }

      const nft: NftType = JSON.parse(
        Buffer.from(bcRes.payload.data).toString()
      );

      const fileKeys: string[] = JSON.parse(nft.FileKeys);

      console.log("creating");

      // Create a read stream for each file and add it to the archive
      archive.pipe(res);

      for (const fileName of fileKeys) {
        const storageService = await initStorageService();
        const file = await downloadFileByKey(storageService, fileName);
        const blobReadStream = file.status.readableStreamBody;
        const myReader = new Readable().wrap(
          blobReadStream as NodeJS.ReadableStream
        );
        // FIXME: this reading the file into memory, which is not ideal
        // but I can't figure out how to get the stream to work
        const chunks = await streamToString(myReader);
        archive.append(chunks, { name: fileName });
        //archive.append(myReader, { name: fileName });
      }
      console.log("here");
      archive.finalize();

      // Finalize the archive and pipe it to the client
      archive.on("error", function (err: any) {
        console.log(err);
        res.status(500).send({ error: err.message });
      });

      //on stream closed we can end the request
      await new Promise<void>(async (resolve, reject) => {
        archive.on("end", function () {
          console.log("end, 54");
          resolve();
          console.log("Archive wrote %d bytes", archive.pointer());
        });
        archive.on("finish", () => console.log("Finish"));
      });
      console.log("done");
    });
    console.log("setting headers");
    res.setHeader("Content-Type", "application/zip");
    res.setHeader("Content-Disposition", `attachment; filename=nft.zip`);
  } catch (e) {
    console.log(e);
    res.status(400).send("error");
  }
}

export {
  mintNFTHandler,
  getAllNftforOwner,
  getNftFileDownloadUrls,
  downloadNftZip,
};
