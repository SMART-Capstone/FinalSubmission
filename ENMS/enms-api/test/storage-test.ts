import { suite, test } from "@testdeck/mocha";
import {
  mock,
  instance,
  verify,
  anyString,
  anyOfClass,
  capture,
  when,
} from "ts-mockito";
import assert from "node:assert";
import {
  initStorageService,
  uploadProject,
  generateBlobDownloadUrl,
  listFiles,
  getFile,
  FileType,
} from "../storage-service";
import {
  BlobServiceClient,
  BlockBlobClient,
  ContainerClient,
  BlobClient,
} from "@azure/storage-blob";
import dotenv from "dotenv";
import path from "node:path";

@suite
class StorageTest {
  mockClient = mock(BlobServiceClient);
  mockBlockBlobClient = mock(BlockBlobClient);
  mockContainerClient = mock(ContainerClient);
  mockBlobClient = mock(BlobClient);

  config() {
    when(this.mockClient.getContainerClient(anyString())).thenReturn(
      instance(this.mockContainerClient)
    );
    when(this.mockContainerClient.getBlockBlobClient(anyString())).thenReturn(
      instance(this.mockBlockBlobClient)
    );
    when(this.mockContainerClient.getBlobClient(anyString())).thenReturn(
      instance(this.mockBlobClient)
    );
  }
  before() {
    dotenv.config({ path: path.join(__dirname, ".env") });
  }

  @test async "Upload Project"() {
    this.config();
    let client = instance(this.mockClient);
    let username = "user";
    let projectId = "project";
    let filename = "file";
    let content = "Q29udGVudCBpbiBCYXNlNjQ=";
    let contentUint8Array = new Uint8Array(Buffer.from(content, "base64"));
    let fileType = FileType.PDF;
    let uploadOptions = { blobHTTPHeaders: { blobContentType: fileType } };
    // await uploadProject(client, username, projectId, filename, content);
    // verify(this.mockClient.getContainerClient(anyString())).once();
    // verify(
    //   this.mockContainerClient.getBlockBlobClient(
    //     username + "/project" + projectId + "/" + filename
    //   )
    // ).once();
    // let [uint8Buffer, number, options] = capture(
    //   this.mockBlockBlobClient.upload
    // ).byCallIndex(0);
    // assert.deepStrictEqual(uint8Buffer, contentUint8Array);
    // assert.deepStrictEqual(number, 17);
    // assert.deepStrictEqual(options, uploadOptions);
  }

  @test async "Generate Blob Download Url"() {
    this.config();

    when(this.mockBlobClient.generateSasUrl(anyOfClass(Object))).thenResolve(
      "url"
    );
    let client = instance(this.mockClient);
    let username = "user";
    let projectId = "project";
    let filename = "file";
    let durationInMinutes = 1;
    await generateBlobDownloadUrl(
      client,
      username,
      projectId,
      filename,
      durationInMinutes
    );
    verify(this.mockBlobClient.generateSasUrl(anyOfClass(Object))).once();
    verify(this.mockClient.getContainerClient(anyString())).once();
  }

  @test async "List Files"() {
    this.config();

    when(this.mockContainerClient.listBlobsFlat()).thenResolve();
    let client = instance(this.mockClient);
    let username = "user";
    let projectId = "project";
    await listFiles(client, username, projectId);
    verify(this.mockClient.getContainerClient(anyString())).once();
    verify(this.mockBlockBlobClient.getBlockList("committed")).once();
  }

  @test async "Get File"() {
    this.config();

    when(this.mockBlockBlobClient.download(anyString())).thenResolve();
    let client = instance(this.mockClient);
    let username = "user";
    let projectId = "project";
    let filename = "file";
    await getFile(client, username, projectId, filename);
    verify(this.mockClient.getContainerClient(anyString())).once();
    verify(
      this.mockContainerClient.getBlockBlobClient(
        username + "/project" + projectId + "/" + filename
      )
    ).once();
    verify(this.mockBlockBlobClient.getProperties()).once();
  }
}
