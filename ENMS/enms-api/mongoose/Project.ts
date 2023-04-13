import mongoose, { ObjectId } from "mongoose";
import baseModelDef from "./BaseModel";
// the non blockchain data i.e not legally needing to be tracked
// on blockchain is stored in database
const Schema = mongoose.Schema;
interface ProjectType {
  owner: mongoose.Schema.Types.ObjectId;
  serviceAgreement: mongoose.Schema.Types.ObjectId;
  files: mongoose.Types.ObjectId[];
  ProjectName: String;
  _id: ObjectId | undefined;
}
const projectSchema = new Schema<ProjectType>({
  ...baseModelDef,
  owner: {
    type: mongoose.Schema.Types.ObjectId,
  },
  serviceAgreement: {
    type: mongoose.Schema.Types.ObjectId,
  },
  files: {
    type: [mongoose.Types.ObjectId],
  },
  ProjectName: {
    type: String,
  },
});

const Project = mongoose.model("Project", projectSchema);

export { Project, ProjectType };
