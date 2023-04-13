import { UserSmartContract } from "./User";
import { ArtistContractSmartContract } from "./ArtistContract";
import { DisputeSmartContract } from "./Dispute";
import { MilestoneSmartContract } from "./Milestone";
import { NftSmartContract } from "./Nft";

export { ArtistContractSmartContract } from "./ArtistContract";
export { DisputeSmartContract } from "./Dispute";
export { MilestoneSmartContract } from "./Milestone";
export { NftSmartContract } from "./Nft";
export { UserSmartContract } from "./User";

export const contracts: any[] = [
  UserSmartContract,
  ArtistContractSmartContract,
  DisputeSmartContract,
  MilestoneSmartContract,
  NftSmartContract,
];
