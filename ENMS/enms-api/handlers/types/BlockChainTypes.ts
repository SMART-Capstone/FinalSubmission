interface ContractInfo {
  MiletonesCount: number;
  ActionTypes: string[];
  Amounts: number[];
  Currency: string;
  ClientId: string;
  ProjectName: string;
}

interface DeleteFileRequest {
  FileKey: string;
  ContractId: string;
}

interface Milestone {
  ActionType: string;
  Amount: number;
  Currency: string;
  ContractId: string;
  StartDate: number;
  EndDate: number;
  Status: string;
  MilestoneId: string;
}

interface FileInputObject {
  fileBase64Data: string;
  fileName: string;
  fileType: string;
}
interface ContractActionRequest {
  ContractId: string;
}

interface DisputeRequest {
  ContractId: string;
}

interface MintRequest {
  DisplayAsset: FileInputObject | undefined;
  ContractId: string;
}

interface User {}

interface NftRequest {
  nftId: string;
}

console.log("types");
enum ActionTypes {
  DEPOSIT = "DEPOSIT",
  ROYALTY = "ROYALTY",
}

enum Statuses {
  MILESTONE_NOTSTARTED = "NOTSTARTED",
  CONTRACT_INPROGRESS = "INPROGRESS",
}

interface UserInfo {
  Username: string;
  Email: string;
  WalletAddress: string;
  Password: string;
  UserType: string;
}

interface ValidateClientInfo {
  Email: string;
  Code: string;
}

interface ClientResetKeyInfo {
  Email: string;
  Code: string;
  Password: string;
}

interface MilestoneType {
  ActionType: string;
  Amount: string;
  ContractId: string;
  Currency: string;
  DocType: string;
  FileHashes: string;
  FileKeys: string;
  MilestoneId: string;
  StartDate: number | null;
  Status: string;
  EndDate?: number;
}

interface ContractType {
  ProjectFiles: string[] | undefined;
  ArtistId: string;
  ClientId: string;
  ContractId: string;
  CurrentMilestone: number;
  DisputeIds: string;
  DocType: string;
  MilestoneIds: string;
  NftId: string | null;
  Status: string;
  Milestones: MilestoneType[];
  ProjectName: string;
}

interface NftType {
  DisplayAssetHash: string;
  DisplayAssetKey: string;
  DocType: string;
  FileHashs: string;
  FileKeys: string;
  NftId: string;
  OriginalProjectId: string;
  OwnerId: string;
  TimeStamp: number;
  DisplayAssetUrl: string | undefined;
}

interface NftFileIncludeType extends NftType {
  FileUrls: string[];
}

interface RevokeCredentialTypeInfo {
  Type: string;
  Reason: string;
}

enum CredentialTypes {
  Artist = "ARTIST",
  Client = "CLIENT",
}

export {
  ContractInfo,
  NftRequest,
  Milestone,
  ActionTypes,
  Statuses,
  ContractActionRequest,
  DisputeRequest,
  MintRequest,
  User,
  FileInputObject,
  UserInfo,
  ValidateClientInfo,
  ClientResetKeyInfo,
  MilestoneType,
  NftType,
  ContractType,
  NftFileIncludeType,
  RevokeCredentialTypeInfo,
  CredentialTypes,
  DeleteFileRequest,
};
