import { Router } from "express";
import {
  mintNFTHandler,
  getAllNftforOwner,
  getNftFileDownloadUrls,
  downloadNftZip,
} from "../handlers/NftHandlers";

const nftRouter = Router();
nftRouter.post("/MintNFT", mintNFTHandler);
nftRouter.get("/GetNFTs", getAllNftforOwner);
nftRouter.post("/GetNFTFileDownloadUrls", getNftFileDownloadUrls);
nftRouter.post("/DownloadZip", downloadNftZip);
export { nftRouter };
