import { User, UserSmartContract, USER_DOC_TYPE } from "../src/User";
import { Context } from "fabric-contract-api";
import { suite, test } from "@testdeck/mocha";
import { UserTypes } from "../src/HelperTypes/EnumTypes";
import {
  mock,
  instance,
  verify,
  anyString,
  anyOfClass,
  capture,
} from "ts-mockito";
import { ChaincodeStub } from "fabric-shim";
import stringify from "json-stringify-deterministic";
import sortKeysRecursive from "sort-keys-recursive";
import assert from "node:assert";
import { mockLoggedInUser } from "./Helpers";

@suite
class UserTest {
  user = new User();
  userSmartContract = new UserSmartContract();
  mockContext = mock(Context);
  stub = mock(ChaincodeStub);
  before() {
    this.user.UserId = "1234";
    this.user.DocType = USER_DOC_TYPE;
    this.user.Email = "rand@random.ca";
    this.user.WalletAddress = "0x1234";
    this.user.UserType = UserTypes.CLIENT;
    this.user.NftIds = JSON.stringify([]);
  }

  @test async "Create user"() {
    this.mockContext.stub = instance(this.stub);
    verify(this.stub.putState(anyString(), anyOfClass(Buffer))).times(0);
    mockLoggedInUser(this.mockContext, this.stub, this.user);
    await this.userSmartContract.createUser(
      this.mockContext,
      this.user.UserId,
      this.user.Email,
      this.user.WalletAddress,
      this.user.UserType
    );
    const { ...object } = this.user;
    object.UserId = this.user.UserId;
    const [firstArg, secondArg] = capture(this.stub.putState).last();
    verify(this.stub.putState(this.user.UserId, anyOfClass(Buffer))).times(1);
    assert.strictEqual(firstArg, this.user.UserId);
    assert.deepStrictEqual(
      secondArg.toString(),
      stringify(sortKeysRecursive(object))
    );
  }

  @test async "Create user invalid user type"() {
    this.mockContext.stub = instance(this.stub);
    mockLoggedInUser(this.mockContext, this.stub, this.user);

    verify(this.stub.putState(anyString(), anyOfClass(Buffer))).times(0);

    let res = await this.userSmartContract.createUser(
      this.mockContext,
      this.user.UserId,
      this.user.Email,
      this.user.WalletAddress,
      "invalid usertype"
    );
    assert.notStrictEqual(res.status, 200);
  }
}
