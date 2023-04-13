import mongoose from "mongoose";
import baseModelDef from "./BaseModel";
const Schema = mongoose.Schema;
interface FileType {
  owner: mongoose.Schema.Types.ObjectId;
  project: mongoose.Schema.Types.ObjectId;
  lastFetched: Date;
  fileExtension: string;
  filePath: string;
  signedUrl: string;
  currentMilestone: number;
}
const fileSchema = new Schema<FileType>({
  ...baseModelDef,
  owner: {
    type: mongoose.Schema.Types.ObjectId,
  },
  project: {
    type: mongoose.Schema.Types.ObjectId,
  },
  lastFetched: {
    type: Date,
  },
  fileExtension: {
    type: String,
  },
  filePath: {
    type: String,
    unique: true,
  },
  signedUrl: {
    type: String,
  },
  currentMilestone: {
    type: Number,
  },
});

const File = mongoose.model("File", fileSchema);

export { File, FileType };
