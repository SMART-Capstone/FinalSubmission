import {
  BlobServiceClient,
  BlobSASPermissions,
  BlobDownloadResponseParsed,
  BlockBlobGetBlockListResponse,
  BlobUploadCommonResponse,
} from "@azure/storage-blob";
//uploadStreamToBlockBlob
// import * as dotenv from "dotenv";
// import * as path from "node:path"
import Stream, { Readable } from "node:stream";
import { File } from "../mongoose/File";

export enum FileType {
  JPEG = "image/jpeg",
  PNG = "image/png",
  PDF = "application/pdf",
  DOCX = "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  XLSX = "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  TXT = "text/plain",
}

interface FileResponse {
  status: BlobDownloadResponseParsed;
  key: string;
}

interface FileUploadResponse {
  status: BlobUploadCommonResponse;
  key: string;
}
async function initStorageService(): Promise<BlobServiceClient> {
  // Credentials for Blob Storage Connection:
  if (
    !process.env.FILE_STORAGE_KEY ||
    !process.env.FILE_STORAGE_DEFAULT_ENDPOINTS_PROTOCOL ||
    !process.env.FILE_STORAGE_ACCOUNT_NAME ||
    !process.env.FILE_STORAGE_ENDPOINT_SUFFIX
  ) {
    throw new Error("Incomplete File Storage Environment.");
  }
  const connectionString = `DefaultEndpointsProtocol=${process.env.FILE_STORAGE_DEFAULT_ENDPOINTS_PROTOCOL};AccountName=${process.env.FILE_STORAGE_ACCOUNT_NAME};AccountKey=${process.env.FILE_STORAGE_KEY};EndpointSuffix=${process.env.FILE_STORAGE_ENDPOINT_SUFFIX}`;

  const blobServiceClient =
    BlobServiceClient.fromConnectionString(connectionString);

  return blobServiceClient;
}

async function uploadProject(
  blobServiceClient: BlobServiceClient,
  username: string,
  projectId: string,
  filename: string,
  stream: NodeJS.ReadableStream
): Promise<FileUploadResponse> {
  if (!process.env.FILE_STORAGE_BLOB_CONTAINER_NAME) {
    throw new Error("No Container Name.");
  }
  const name = username + "/project" + projectId + "/" + filename;
  console.log("Finding");

  const containerClient = (await blobServiceClient).getContainerClient(
    process.env.FILE_STORAGE_BLOB_CONTAINER_NAME
  );

  const blobClient = containerClient.getBlockBlobClient(name);

  // const options = { blobHTTPHeaders: { blobContentType: fileType } };
  const myReader = new Readable().wrap(stream);
  const bufferSize = 5 * 1024 * 1024;
  console.log("Uploading");
  const res = await blobClient.uploadStream(myReader, bufferSize, 10, {
    blobHTTPHeaders: { blobContentType: "application/octet-stream" },
  });
  console.log("Done");
  return {
    status: res,
    key: name,
  };
}

async function uploadProjectFromBase64(
  blobServiceClient: BlobServiceClient,
  username: string,
  projectId: string,
  filename: string,
  base64Content: string,
  fileType: string
): Promise<FileResponse> {
  if (!process.env.FILE_STORAGE_BLOB_CONTAINER_NAME) {
    throw new Error("No Container Name.");
  }

  const containerClient = (await blobServiceClient).getContainerClient(
    process.env.FILE_STORAGE_BLOB_CONTAINER_NAME
  );

  const blobClient = containerClient.getBlockBlobClient(
    username + "/project" + projectId + "/" + filename
  );
  console.log(base64Content);
  const prefix = "base64,"; // substring to remove
  const dataAfterPrefix = base64Content.substring(
    base64Content.indexOf(prefix) + prefix.length
  );
  const contentUint8Array = new Uint8Array(
    Buffer.from(dataAfterPrefix, "base64")
  );
  const options = { blobHTTPHeaders: { blobContentType: fileType } };
  const res = await blobClient.upload(
    contentUint8Array,
    contentUint8Array.length,
    options
  );
  return {
    status: res,
    key: username + "/project" + projectId + "/" + filename,
  };
}

async function listFiles(
  blobServiceClient: BlobServiceClient,
  username: string,
  projectId: string
): Promise<BlockBlobGetBlockListResponse> {
  //const blobServiceClient = initStorageService();

  if (!process.env.FILE_STORAGE_BLOB_CONTAINER_NAME) {
    throw new Error("No Container Name.");
  }
  const containerClient = (await blobServiceClient).getContainerClient(
    process.env.FILE_STORAGE_BLOB_CONTAINER_NAME
  );

  const blobClient = containerClient.getBlockBlobClient(
    username + "/project" + projectId + "/"
  );
  return await blobClient.getBlockList("committed");
}
async function getFile(
  blobServiceClient: BlobServiceClient,
  username: string,
  projectId: string,
  filename: string
): Promise<BlobDownloadResponseParsed> {
  //const blobServiceClient = initStorageService();

  if (!process.env.FILE_STORAGE_BLOB_CONTAINER_NAME) {
    throw new Error("No Container Name.");
  }
  const containerClient = blobServiceClient.getContainerClient(
    process.env.FILE_STORAGE_BLOB_CONTAINER_NAME
  );

  const blobClient = containerClient.getBlockBlobClient(
    username + "/project" + projectId + "/" + filename
  );

  return await blobClient.getProperties();
}

async function getFileByKey(
  blobServiceClient: BlobServiceClient,
  key: string
): Promise<FileResponse> {
  //const blobServiceClient = initStorageService();

  if (!process.env.FILE_STORAGE_BLOB_CONTAINER_NAME) {
    throw new Error("No Container Name.");
  }
  const containerClient = blobServiceClient.getContainerClient(
    process.env.FILE_STORAGE_BLOB_CONTAINER_NAME
  );

  const blobClient = containerClient.getBlockBlobClient(key);
  const res = await blobClient.getProperties();
  return { status: res, key: key };
}

async function downloadFileByKey(
  blobServiceClient: BlobServiceClient,
  key: string
): Promise<FileResponse> {
  //const blobServiceClient = initStorageService();

  if (!process.env.FILE_STORAGE_BLOB_CONTAINER_NAME) {
    throw new Error("No Container Name.");
  }
  const containerClient = blobServiceClient.getContainerClient(
    process.env.FILE_STORAGE_BLOB_CONTAINER_NAME
  );

  const blobClient = containerClient.getBlockBlobClient(key);
  const res = await blobClient.download(0);
  return { status: res, key: key };
}

async function deleteFileByKey(
  blobServiceClient: BlobServiceClient,
  key: string
): Promise<FileResponse> {
  //const blobServiceClient = initStorageService();

  if (!process.env.FILE_STORAGE_BLOB_CONTAINER_NAME) {
    throw new Error("No Container Name.");
  }
  const containerClient = blobServiceClient.getContainerClient(
    process.env.FILE_STORAGE_BLOB_CONTAINER_NAME
  );

  const blobClient = containerClient.getBlockBlobClient(key);
  const res = await blobClient.delete();
  return { status: res, key: key };
}

async function updateFileByKey(
  blobServiceClient: BlobServiceClient,
  oldKey: string,
  newKey: string
): Promise<BlobDownloadResponseParsed> {
  //const blobServiceClient = initStorageService();

  if (!process.env.FILE_STORAGE_BLOB_CONTAINER_NAME) {
    throw new Error("No Container Name.");
  }
  const containerClient = blobServiceClient.getContainerClient(
    process.env.FILE_STORAGE_BLOB_CONTAINER_NAME
  );

  const blobClient = containerClient.getBlockBlobClient(oldKey);

  return blobClient.setMetadata({ key: newKey });
}

// Now, This generate the functioning URL correctly.
// Todo: Authentication before access allowed.
async function generateBlobDownloadUrl(
  blobServiceClient: BlobServiceClient,
  username: string,
  projectId: string,
  filename: string,
  durationInMinutes: number
): Promise<string> {
  //const blobServiceClient = initStorageService();
  if (!process.env.FILE_STORAGE_BLOB_CONTAINER_NAME) {
    throw new Error("No Container Name.");
  }
  const containerClient = (await blobServiceClient).getContainerClient(
    process.env.FILE_STORAGE_BLOB_CONTAINER_NAME
  );

  // Get a reference to the blob
  const blobName = username + "/project" + projectId + "/" + filename;
  const blobClient = containerClient.getBlobClient(blobName);

  const sasPermissions = new BlobSASPermissions();
  sasPermissions.read = true; // READ ONLY Permission

  // Generate a pre-signed URL for the blob
  const url = await blobClient.generateSasUrl({
    expiresOn: new Date(Date.now() + durationInMinutes * 60000),
    permissions: sasPermissions,
  });
  console.log(url);

  return url;
}

async function generateBlobDownloadUrlByKey(
  blobServiceClient: BlobServiceClient,
  key: string
): Promise<string> {
  //const blobServiceClient = initStorageService();
  if (!process.env.FILE_STORAGE_BLOB_CONTAINER_NAME) {
    throw new Error("No Container Name.");
  }
  const containerClient = (await blobServiceClient).getContainerClient(
    process.env.FILE_STORAGE_BLOB_CONTAINER_NAME
  );

  // Get a reference to the blob
  const blobName = key;
  const blobClient = containerClient.getBlobClient(blobName);

  const sasPermissions = new BlobSASPermissions();
  sasPermissions.read = true; // READ ONLY Permission
  if (!process.env.URL_EXPIRY_IN_MINUTES)
    throw new Error("No Expiry Time Set.");
  // Generate a pre-signed URL for the blob
  const url = await blobClient.generateSasUrl({
    expiresOn: new Date(
      Date.now() + Number(process.env.URL_EXPIRY_IN_MINUTES) * 60000
    ),
    permissions: sasPermissions,
  });
  console.log(url);

  return url;
}

export {
  initStorageService,
  uploadProject,
  generateBlobDownloadUrl,
  listFiles,
  getFile,
  getFileByKey,
  updateFileByKey,
  generateBlobDownloadUrlByKey,
  uploadProjectFromBase64,
  FileResponse,
  deleteFileByKey,
  downloadFileByKey,
};
// For Tests: Unit Testing In Dev:
// (async () => {
//   let res = dotenv.config({ path: path.join(__dirname, "dist", ".env")})
//   console.log("res", res)
//   var client = await initStorageService()
//   uploadProject(client, "Louie", "Test", "test.txt", "Q29udGVudCBpbiBCYXNlNjQ=", FileType.TXT)
//   //console.log("Uploaded")
//   //var url = generateBlobDownloadUrl(client, "Louie", "Test", "test.png", 5)
//   //console.log("Url", url)
// })()
