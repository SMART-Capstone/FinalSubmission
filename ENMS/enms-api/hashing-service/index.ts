import crypto from "crypto";

export const HASH_METHOD = "sha3-512";
async function hashFile(fileBase64: NodeJS.ReadableStream): Promise<string> {
  return new Promise((resolve, reject) => {
    let hash = crypto.createHash(HASH_METHOD);
    hash.setEncoding("base64");
    console.log("in here");
    // making digest
    fileBase64.pipe(hash);
    console.log("done piping");
    fileBase64.on("error", function (err) {
      console.log(err);
      reject(err);
    });
    fileBase64.on("data", function (data) {});
    fileBase64.on("end", function () {
      console.log("end");
      hash.end();
      resolve(hash.digest("base64"));
    });
  });
}

export { hashFile };
