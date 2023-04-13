import { hashFile, HASH_METHOD } from "../hashing-service/index";
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
import crypto from "crypto";
import assert from "node:assert";
import Stream from "node:stream";
@suite
class HashTest {
  @test
  async "hashing service should return a hashed string, and the hashes of identical content should be equal"() {
    let text = "password";
    const buf = Buffer.from(text);
    const bufferStream = Stream.Readable.from(buf);
    const hashedPassword = await hashFile(bufferStream);
    console.log("HASHED", hashedPassword);
    assert.notStrictEqual(hashedPassword, text);
    let secondHash = crypto.createHash(HASH_METHOD);
    secondHash.update(text);
    let hashedText = secondHash.digest("base64");
    console.log("HASHED", hashedText);
    assert.deepStrictEqual(hashedPassword, hashedText);
  }

  @test async "hashing service test big content"() {
    let text = "password";
    for (let i = 0; i < 100000; i++) {
      text = text + "password";
    }
    const buf = Buffer.from(text);
    const bufferStream = Stream.Readable.from(buf);
    const hashedPassword = await hashFile(bufferStream);
    console.log("HASHED", hashedPassword);
    assert.notStrictEqual(hashedPassword, text);
  }
}
