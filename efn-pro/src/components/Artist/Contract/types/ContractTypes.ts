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

interface ContractWithoutMilestones {
  ArtistId: string;
  ClientId: string;
  ContractId: string;
  CurrentMilestone: number;
  DisputeIds: string;
  DocType: string;
  MilestoneIds: string;
  NftId: string | null;
  Status: string;
  ProjectName: string;
}
interface ContractType extends ContractWithoutMilestones {
  Milestones: MilestoneType[];
  ProjectFiles: string[];
}

interface ContractHistoryType {
  txId: string;
  timestamp: number;
  value: ContractWithoutMilestones;
}

export const IN_DISPUTE = "INDISPUTE";
export const IN_PROGRESS = "INPROGRESS";
export const COMPLETED = "COMPLETED";
export const MINTED = "MINTED";

export type { MilestoneType, ContractType, ContractHistoryType };
