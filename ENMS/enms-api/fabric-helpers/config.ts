import path from "path";
import fs from "fs";
function getConnectionConfig(orgName: string) {
  console.log("get connection config");
  const configPath = path.join(
    __dirname,
    "..",
    "..",
    "admin",
    `connection-${orgName}.json`
  );
  const profile = fs.readFileSync(configPath, "utf8");
  return JSON.parse(profile);
}

export { getConnectionConfig };
