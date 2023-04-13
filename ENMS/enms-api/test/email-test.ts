import {
  createTransporter,
  getMailOptions,
  sendEmail,
  send,
} from "../email-service/index";
import { suite, test } from "@testdeck/mocha";
import { mock, when, instance, anyString, verify } from "ts-mockito";
import { Transporter } from "nodemailer";
import assert from "node:assert";
import * as dotenv from "dotenv";
import * as path from "node:path";

@suite
class emailTest {
  mockSendEmail = mock(
    sendEmail(
      anyString(),
      anyString(),
      anyString(),
      anyString(),
      anyString(),
      anyString()
    )
  );
  mockTransporter: Transporter = mock(createTransporter());
  mockMailOptions: Object = mock(
    getMailOptions(
      anyString(),
      anyString(),
      anyString(),
      anyString(),
      anyString(),
      anyString()
    )
  );
  mockSend = mock(send(this.mockTransporter, this.mockMailOptions));

  config() {}
}
