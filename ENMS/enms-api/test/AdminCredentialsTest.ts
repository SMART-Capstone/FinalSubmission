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
import dotenv from "dotenv";
import path from "node:path";
import { CredentialsProvider } from "../fabric-helpers/CredentialsProvider";
import { CaClient } from "../fabric-helpers/ca";
import { CustomIdentity } from "../fabric-helpers/types/CustomIdentity";
import { AdminCredentials } from "../mongoose/Credentials";

@suite
class AdminCredentialsTest {
  caClient = mock(CaClient);
  identity: CustomIdentity = {
    credentials: {
      certificate: "cert",
      privateKey: "key",
    },
    mspId: "mspId",
    type: "type",
    isValidated: false,
    isAdmin: false,
    _id: undefined,
  };
  config() {
    process.env = {
      NODE_ENV: "DEV",
    };
  }
  before() {
    dotenv.config({ path: path.join(__dirname, ".env") });
  }

  @test async "Enrolls admin if no admin set"() {
    this.config();
    const orgName = "org1";
    let caClient = instance(this.caClient);
    caClient.orgName = orgName;
    when(this.caClient.enrollApiAdminUser()).thenResolve({
      ...this.identity,
    });
    let creds = await CredentialsProvider.getAdminCredentials(caClient);
    verify(this.caClient.enrollApiAdminUser()).once();
    assert.deepStrictEqual(creds, this.identity);
  }

  @test async "Returns set admin"() {
    let caClient = instance(this.caClient);

    CredentialsProvider.adminCredentials = this.identity;
    let retrivedCreds = await CredentialsProvider.getAdminCredentials(caClient);
    verify(this.caClient.enrollApiAdminUser()).never();
    assert.deepStrictEqual(retrivedCreds, this.identity);
  }
}
