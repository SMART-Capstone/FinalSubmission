import { Request, Response, NextFunction } from "express";
import { ChainWriter } from "../fabric-helpers/ChainWriter";
import {
  ApiMessageResponseType,
  ApiMessagePayloadResponseType,
} from "./types/ResponseTypes";
import {
  ContractInfo,
  Milestone,
  ActionTypes,
  Statuses,
  User,
  ContractType,
} from "./types/BlockChainTypes";
import { Project } from "../mongoose/Project";
import { DisputeRequest } from "./types/BlockChainTypes";
import { File, FileType } from "../mongoose/File";
const ARTIST_CONTRACT_CONTRACT_NAME = "ArtistContractSmartContract";

async function createArtistContractHandler(req: Request, res: Response) {
  try {
    console.log(req.body, req.params);
    const contractInfo: ContractInfo = req.body;

    let chainWriter = new ChainWriter();
    await chainWriter.connectToChain();

    // Store the Contract in the mongo db database:
    const projectDb = new Project({
      owner: req.user?._id,
      ProjectName: contractInfo.ProjectName,
    });
    let milestones: Milestone[] = [];
    for (let i = 0; i < contractInfo.MiletonesCount; i++) {
      let milestoneId =
        projectDb._id + Date.now().toString() + Math.random() + i.toString();
      let startDate = Date.now();
      let milestone: Milestone = {
        ActionType: contractInfo.ActionTypes[i] || ActionTypes.ROYALTY,
        Amount: contractInfo.Amounts[i] || 0, // get current context and txID.
        ContractId: projectDb._id.toString(),
        MilestoneId: milestoneId,
        StartDate: startDate,
        EndDate: Number.NEGATIVE_INFINITY,
        Currency: contractInfo.Currency,
        Status: Statuses.MILESTONE_NOTSTARTED,
      };
      milestones.push(milestone);
    }
    console.log("CLient: ", contractInfo.ClientId);
    console.log(JSON.stringify(milestones), "HERE!!");
    if (!req.user || !req.user.username) {
      res.status(400).send("no user id");
      return;
    }
    let bcRes = await chainWriter.invokeChain(
      process.env.CHAINCODE_NAME,
      [
        JSON.stringify(milestones),
        req.user?.username.toString(),
        contractInfo.ClientId,
        projectDb._id,
        Date.now(),
      ],
      ARTIST_CONTRACT_CONTRACT_NAME + ":" + "createArtistContract",
      req.user?.username
    );
    if (bcRes.status !== 200) {
      const apiRes: ApiMessageResponseType = {
        status: bcRes.status,
        message: bcRes.stringMessage,
      };
      res.status(bcRes.status).send(apiRes);
      return;
    }
    await projectDb.save();
    const apiRes: ApiMessageResponseType = {
      status: bcRes.status,
      message: "Artist Contract created on ENMS.",
    };
    console.log(bcRes);
    res.send(apiRes);
  } catch (e) {
    res.status(400).send("Server error");
  }
}

async function getArtistContractsHandler(req: Request, res: Response) {
  try {
    console.log(req.body, req.params);
    const user = req.user?.username;
    if (!user) {
      res.status(400).send("no user id");
      return;
    }
    let chainWriter = new ChainWriter();
    await chainWriter.connectToChain();

    let bcRes = await chainWriter.queryChain(
      process.env.CHAINCODE_NAME,
      user,
      [],
      ARTIST_CONTRACT_CONTRACT_NAME + ":" + "getArtistContracts"
    );

    if (bcRes.status !== 200) {
      const apiRes: ApiMessageResponseType = {
        status: bcRes.status,
        message: bcRes.stringMessage,
      };
      res.status(bcRes.status).send(apiRes);
      return;
    }

    const contracts = JSON.parse(Buffer.from(bcRes.payload.data).toString());
    const contractsWithProjName = await Promise.all(
      contracts.map(async (contract: ContractType, index: any) => {
        const project = await Project.findById(contract.ContractId);
        if (!project) {
          res.status(404).send("Project not found on db");
          return null;
        }
        const currentMilestoneFiles: FileType[] = await File.find({
          _id: { $in: project.files },
          currentMilestone: contract.CurrentMilestone,
        });
        console.log(contract.Milestones, contract.CurrentMilestone);
        if (contract.Milestones[contract.CurrentMilestone]) {
          contract.Milestones[contract.CurrentMilestone].FileKeys =
            JSON.stringify(currentMilestoneFiles.map((file) => file.filePath));
        } else if (contract.Status === "COMPLETED") {
          contract.ProjectFiles = currentMilestoneFiles.map(
            (file) => file.filePath
          );
        }
        console.log("Project: ", project.ProjectName, project);
        contract.ProjectName =
          (project.ProjectName as string) || "Project " + index;
        return contract;
      })
    );

    const apiRes: ApiMessagePayloadResponseType = {
      status: bcRes.status,
      message: bcRes.stringMessage,
      payloadString: JSON.parse(JSON.stringify(contractsWithProjName)),
    };
    console.log(bcRes);
    console.log(JSON.parse(Buffer.from(bcRes.payload.data).toString()));
    res.send(apiRes);
  } catch (e) {
    console.log(e);
    res.status(500).send("Internal server error");
  }
}

async function getArtistContractHistoryHandler(req: Request, res: Response) {
  try {
    const contractId: DisputeRequest = req.body;
    let chainWriter = new ChainWriter();
    await chainWriter.connectToChain();
    if (!req.user || !req.user.username) {
      res.status(400).send("no user id");
      return;
    }
    let bcRes = await chainWriter.queryChain(
      process.env.CHAINCODE_NAME,
      req.user?.username.toString(),
      [contractId.ContractId],
      ARTIST_CONTRACT_CONTRACT_NAME + ":" + "getArtistContractHistory"
    );

    if (bcRes.status !== 200) {
      const apiRes: ApiMessageResponseType = {
        status: bcRes.status,
        message: bcRes.stringMessage,
      };
      res.status(bcRes.status).send(apiRes);
      return;
    }
    const apiRes: ApiMessagePayloadResponseType = {
      status: bcRes.status,
      message: bcRes.stringMessage,
      payloadString: JSON.parse(
        JSON.stringify(Buffer.from(bcRes.payload.data).toString())
      ),
    };
    console.log(bcRes);
    console.log(JSON.parse(Buffer.from(bcRes.payload.data).toString()));
    res.send(apiRes);
  } catch (e) {
    console.log(e);
    res.status(500).send("Internal server error");
  }
}
export {
  createArtistContractHandler,
  getArtistContractsHandler,
  getArtistContractHistoryHandler,
};
