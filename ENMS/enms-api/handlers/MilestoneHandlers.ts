import { ApiMessageResponseType } from "./types/ResponseTypes";
import { Request, Response, NextFunction } from "express";
import { ChainWriter } from "../fabric-helpers/ChainWriter";
import {
  ContractActionRequest,
  ContractType,
  DeleteFileRequest,
  FileInputObject,
} from "./types/BlockChainTypes";
import { hashFile } from "../hashing-service";
import Stream from "node:stream";
import {
  deleteFileByKey,
  getFileByKey,
  initStorageService,
  uploadProject,
} from "../storage-service";
import { File, FileType } from "../mongoose/File";
import { Project, ProjectType } from "../mongoose/Project";
import mongoose from "mongoose";
import fs from "fs";
import { io } from "../index";
const MILESTONE_CONTRACT_NAME = "MilestoneSmartContract";

async function deleteFile(req: Request, res: Response) {
  try {
    const storageService = await initStorageService();
    const reqParsed: DeleteFileRequest = req.body;
    console.log("Deleting file", reqParsed, req.body);
    const project = await Project.findById(reqParsed.ContractId);
    if (!req.user || !req.user.username) {
      res.status(400).send("User not logged in");
      return;
    }
    const chainWriter = new ChainWriter();
    console.log(reqParsed.ContractId, 546);
    const contractBcRes = await chainWriter.queryChain(
      process.env.CHAINCODE_NAME,
      req.user.username,
      [reqParsed.ContractId],
      "ArtistContractSmartContract" + ":getArtistContractWithMilestones"
    );
    if (contractBcRes.status !== 200) {
      res.status(400).send("Error fetching contract details from chain");
      return;
    }
    console.log(
      "Contract Res Delete FIle",
      Buffer.from(contractBcRes.payload.data).toString()
    );
    const contract: ContractType = JSON.parse(
      Buffer.from(contractBcRes.payload.data).toString()
    );
    if (contract.Status === "MINTED") {
      res.status(400).send("Contract already completed");
      return;
    }
    if (!project) {
      res.status(400).send("Project not found");
      return;
    }
    const file = await File.findOne({
      filePath: reqParsed.FileKey,
      currentMilestone: contract.CurrentMilestone,
    });
    if (!file) {
      res.status(400).send("File not found");
      return;
    }
    project.files =
      project.files.filter((f) => f._id.toString() !== file._id.toString()) ||
      [];
    await project.save();
    await file.delete();
    await deleteFileByKey(storageService, reqParsed.FileKey);
    res.status(200).send("File deleted");
  } catch (e) {
    res.status(400).send("Unexpected error");
  }
}

async function uploadFile(req: Request, res: Response) {
  try {
    console.log(req.body, 43);
    const chainWriter = new ChainWriter();
    console.log("Uploading File");
    if (!req.files) {
      res.status(400).send("no files uploaded");
      return;
    }
    const contractIdFile = [req.files.ContractId].flat()[0];
    const contractId = contractIdFile.name;
    const files: FileType[] = [];
    const project = await Project.findById(contractId);
    if (!req.user || !req.user.username) {
      res.status(400).send("User not logged in");
      return;
    }
    const contractBcRes = await chainWriter.queryChain(
      process.env.CHAINCODE_NAME,
      req.user.username,
      [contractId],
      "ArtistContractSmartContract" + ":getArtistContractWithMilestones"
    );
    if (contractBcRes.status !== 200) {
      res.status(400).send("Error fetching contract details from chain");
      return;
    }
    console.log("Res", Buffer.from(contractBcRes.payload.data).toString());
    const contract: ContractType = JSON.parse(
      Buffer.from(contractBcRes.payload.data).toString()
    );
    if (!project) {
      res.status(400).send("Project not found");
      return;
    }
    const storageService = await initStorageService();
    console.log(req.files);
    const inputFiles = [req.files.file].flat();
    const uploads = await Promise.all(
      inputFiles.map(async (file) => {
        console.log("File name", file.name);
        if (!file.name || !file.tempFilePath) {
          res.status(400).send("File name or path not found");
          return;
        }
        if (!req.user || !req.user.username) {
          res.status(400).send("User not logged in");
          return;
        }
        const name =
          req.user.username + "/project" + contractId + "/" + file.name;
        const fileDb = await File.findOne({ filePath: name });
        console.log("Found", file);
        if (fileDb) {
          console.log("File exists");
          throw new Error("File already exists");
        }
        const stream = fs.createReadStream(file.tempFilePath, {
          highWaterMark: 1024 * 1024,
        });
        stream.on("data", (chunk) => {
          console.log(stream.bytesRead, "bytes read");
          console.log(file.size, "file size");
          console.log(chunk, "chunk");
          if (!req.user) {
            throw new Error("User not logged in");
          }
          io.to(req.user.username).emit("fileUploadProgress", {
            progress: stream.bytesRead / file.size,
            fileName: file.name,
          });
        });
        const filePromise = uploadProject(
          storageService,
          req.user.username,
          contractId,
          file.name,
          stream
        );
        return filePromise;
      })
    );
    uploads.forEach((fileUpload) => {
      if (!req.user) {
        res.status(400).send("User not logged in");
        return;
      }
      files.push(
        new File({
          filePath: fileUpload?.key,
          project: project._id,
          currentMilestone: contract.CurrentMilestone,
          owner: req.user.username,
        })
      );
    });
    console.log("finish", files);
    try {
      const promisese = files.map(async (fileDb) => {
        console.log(fileDb);
        if (!req.user) {
          throw new Error("User not logged in");
        }
        const file = await new File({
          filePath: fileDb.filePath,
          oject: project._id,
          currentMilestone: contract.CurrentMilestone,
        }).save();
        project.files.push(file._id);
      });
      await Promise.all(promisese);
      console.log(project.files, 4354);
      await project.save();
    } catch (e) {
      console.log(e);
      res.status(400).send("Duplicate file name");
      return null;
    }
    const apiRes: ApiMessageResponseType = {
      status: 200,
      message: JSON.stringify(
        files.map((file) => {
          return { key: file.filePath };
        })
      ),
    };
    console.log("here");
    res.send(apiRes);
  } catch (e) {
    res.status(400).send("Unexpected error");
  }
}
async function advanceMilestoneHandler(req: Request, res: Response) {
  try {
    const contractActionRequest: ContractActionRequest = req.body;

    const storageService = await initStorageService();
    const projectDb = await Project.findById(req.body.ContractId);
    if (!projectDb) {
      throw new Error("Project not found");
    }
    if (!req.user || !req.user.username) {
      throw new Error("no user id");
    }
    let chainWriter = new ChainWriter();

    const contractBcRes = await chainWriter.queryChain(
      process.env.CHAINCODE_NAME,
      req.user.username,
      [req.body.ContractId],
      "ArtistContractSmartContract" + ":getArtistContractWithMilestones"
    );
    if (contractBcRes.status !== 200) {
      res.status(400).send("Error fetching contract details from chain");
      return;
    }
    console.log("Res", Buffer.from(contractBcRes.payload.data).toString());
    const contract: ContractType = JSON.parse(
      Buffer.from(contractBcRes.payload.data).toString()
    );
    const filesToHashAndSaveOnChain = await File.find({
      _id: { $in: projectDb.files },
      currentMilestone: contract.CurrentMilestone,
    });
    console.log(
      projectDb.files,
      filesToHashAndSaveOnChain,
      contract.CurrentMilestone,
      8392
    );
    await chainWriter.connectToChain();
    const hashes = await Promise.all(
      filesToHashAndSaveOnChain.map(async (file) => {
        console.log("fetching file", file.filePath);
        const fileData = await getFileByKey(storageService, file.filePath);
        if (!fileData.status.lastModified) {
          throw new Error("lastModified not found");
        }
        return hashFile(
          Stream.Readable.from(
            Buffer.from(fileData.status.lastModified?.toUTCString())
          )
        );
      })
    );
    console.log(
      "Saving files: ",
      filesToHashAndSaveOnChain.map((file) => file.filePath),
      "hashes: ",
      hashes
    );
    let bcRes = await chainWriter.invokeChain(
      process.env.CHAINCODE_NAME,
      [
        contractActionRequest.ContractId,
        Date.now(),
        JSON.stringify(filesToHashAndSaveOnChain.map((file) => file.filePath)),
        JSON.stringify(hashes),
      ],
      MILESTONE_CONTRACT_NAME + ":" + "advanceMilestone",
      req.user?.username
    );
    // to do add transaction
    await projectDb.save();
    console.log("ADVANCE MILESTONE RESPONSE1223: ", bcRes);
    if (bcRes.status !== 200) {
      throw new Error("Advancing milestone on chain failed!");
    }
    const apiRes: ApiMessageResponseType = {
      status: bcRes.status,
      message: "Milestone advanced on ENMS",
    };
    console.log(bcRes);
    res.send(apiRes);
  } catch (e: any) {
    console.log("Error", e);
    res.status(400).send("Error" + e.message);
    return;
  }
}

export { advanceMilestoneHandler, uploadFile, deleteFile };
