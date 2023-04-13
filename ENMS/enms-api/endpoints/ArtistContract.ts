import { Router } from "express";
import {
  createArtistContractHandler,
  getArtistContractsHandler,
  getArtistContractHistoryHandler,
} from "../handlers/ContractHandlers";

const artistContractRouter = Router();
artistContractRouter.post("/CreateContract", createArtistContractHandler);
artistContractRouter.get("/GetContracts", getArtistContractsHandler);
artistContractRouter.post(
  "/GetContractHistory",
  getArtistContractHistoryHandler
);

export { artistContractRouter };
