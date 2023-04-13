import { Router } from "express";
import {
  putContractInDisputeHandler,
  resolveDisputeHandler,
} from "../handlers/DisputeHandlers";

const disputeRouter = Router();
disputeRouter.post("/CreateDispute", putContractInDisputeHandler);
disputeRouter.post("/ResolveDispute", resolveDisputeHandler);
export { disputeRouter };
