import {
  BlobDownloadResponseParsed,
  BlobServiceClient,
  BlockBlobGetBlockListResponse,
} from "@azure/storage-blob";
import { hashFile } from "../hashing-service";
import { listFiles, getFile, initStorageService } from "../storage-service";
import Stream from "node:stream";
async function createNft(userName: string, projectId: string) {
  // validate project in database

  // get project files from cloud storage
  let storageClient: BlobServiceClient = await initStorageService();
  let fileHeaders: BlockBlobGetBlockListResponse = await listFiles(
    storageClient,
    userName,
    projectId
  );
  if (!fileHeaders.committedBlocks || fileHeaders.committedBlocks.length == 0) {
    throw new Error("No files found.");
  }
  let files: Promise<BlobDownloadResponseParsed>[] =
    fileHeaders.committedBlocks.map((file) => {
      return getFile(storageClient, userName, projectId, file.name);
    });
  await Promise.all(files);
  // hash files
  files.map(async (file) => {
    let fileData = await file;
    if (!fileData || !fileData.lastModified) {
      return;
    }
    return hashFile(
      Stream.Readable.from(Buffer.from(fileData.lastModified.toUTCString()))
    );
  });
  // create nft
}

export { createNft };
