import { Request, Response } from "express";
import { ChainWriter } from "../fabric-helpers/ChainWriter";
import { DisputeRequest } from "./types/BlockChainTypes";
import { ApiMessageResponseType } from "./types/ResponseTypes";

const ARTIST_CONTRACT_CONTRACT_NAME = "ArtistContractSmartContract";
const DISPUTE_CONTRACT_NAME = "DisputeSmartContract";

async function putContractInDisputeHandler(req: Request, res: Response) {
  console.log(req.body, req.params);
  const disputeRequest: DisputeRequest = req.body;

  let chainWriter = new ChainWriter();
  await chainWriter.connectToChain();
  if (!req.user || !req.user.username) {
    res.status(400).send("User not logged in");
    return;
  }
  let bcRes = await chainWriter.invokeChain(
    process.env.CHAINCODE_NAME,
    [disputeRequest.ContractId, Date.now()],
    ARTIST_CONTRACT_CONTRACT_NAME + ":" + "putContractInDispute",
    req.user.username
  );

  if (bcRes.status !== 200) {
    const apiRes: ApiMessageResponseType = {
      status: bcRes.status,
      message: bcRes.stringMessage,
    };
    res.status(bcRes.status).send(apiRes);
  }

  const apiRes: ApiMessageResponseType = {
    status: bcRes.status,
    message: "Dispute created on an existing Artist Contract",
  };
  console.log(bcRes);
  res.send(apiRes);
}

async function resolveDisputeHandler(req: Request, res: Response) {
  console.log(req.body, req.params);
  const disputeRequest: DisputeRequest = req.body;
  if (!req.user || !req.user.username) {
    res.status(400).send("User not logged in");
    return;
  }
  let chainWriter = new ChainWriter();
  await chainWriter.connectToChain();

  let bcRes = await chainWriter.invokeChain(
    process.env.CHAINCODE_NAME,
    [disputeRequest.ContractId],
    DISPUTE_CONTRACT_NAME + ":" + "resolveDispute",
    req.user.username
  );

  if (bcRes.status !== 200) {
    const apiRes: ApiMessageResponseType = {
      status: bcRes.status,
      message: bcRes.stringMessage,
    };
    res.status(bcRes.status).send(apiRes);
  }

  const apiRes: ApiMessageResponseType = {
    status: bcRes.status,
    message: "Dispute resolved on an Artist Contract",
  };
  console.log(bcRes);
  res.send(apiRes);
}

export { putContractInDisputeHandler, resolveDisputeHandler };
