import { Router } from "express";
import {
  advanceMilestoneHandler,
  uploadFile,
} from "../handlers/MilestoneHandlers";
import bodyParser from "body-parser";

var jsonParser = bodyParser.json();

const milestoneRouter = Router();
milestoneRouter.post("/AdvanceMilestone", jsonParser, advanceMilestoneHandler);
export { milestoneRouter };
