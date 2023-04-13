import * as nodemailer from "nodemailer";
import { Transporter } from "nodemailer";
// import * as dotenv from "dotenv";
// import * as path from "node:path"

async function createTransporter(): Promise<Transporter> {
  const transporter: Transporter = nodemailer.createTransport({
    service: process.env.SMTP_SERVICE,
    host: process.env.SMTP_HOST,
    port: Number(process.env.SMTP_PORT),
    secure: Boolean(process.env.SMTP_SECURE),
    requireTLS: Boolean(process.env.SMTP_REQUIRE_TLS),
    auth: {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASS, // App Password
    },
  });

  return transporter;
}

async function getMailOptions(
  recipientEmail: string,
  username: string,
  projectId: string,
  sender: string,
  link: string,
  code: string
) {
  const mailOptions = {
    from: process.env.SMTP_USER,
    to: recipientEmail,
    subject: "EFNPro Authentication & Download Link",
    text: `Project #${projectId} for ${username}: ${link}`,
    html:
      '<div id="email-format">' +
      "<h1>EFNPro Project Secure Download Link</h1><hr/>" +
      `<h2>Project: ${projectId}</h2>` +
      `<h3>Your Artist ${sender} has minted you an NFT for your project</h3>` +
      (code ? `<h3>Reset Key Code: ${code}</h3>` : "") +
      `for ${username}` +
      `<a href=\"${link}\"> Click here to Authenticate </a></div>`,
  };
  return mailOptions;
}

async function send(
  transporter: Transporter,
  mailOptions: Object
): Promise<Error> {
  var error: Error;
  transporter.sendMail(mailOptions, (error, info) => {
    if (error) {
      return error;
    } else {
      console.log(`Email sent` + info.response);
      return error!;
    }
  });
  return error!;
}

async function sendEmail(
  recipientEmail: string,
  username: string,
  projectId: string,
  sender: string,
  link: string,
  code: string
): Promise<boolean> {
  if (
    !process.env.SMTP_HOST ||
    !process.env.SMTP_PORT ||
    !process.env.SMTP_USER ||
    !process.env.SMTP_PASS ||
    !process.env.SMTP_SECURE ||
    !process.env.SMTP_SERVICE ||
    !process.env.SMTP_REQUIRE_TLS
  ) {
    throw new Error("Incomplete Email Service Environment.");
  }

  const transporter = await createTransporter();
  const mailOptions = await getMailOptions(
    recipientEmail,
    username,
    projectId,
    sender,
    link,
    code
  );

  let res = await send(transporter, mailOptions);
  if (res) {
    return false;
  }

  return true;
}

export { createTransporter, getMailOptions, sendEmail, send };

// (async () => {
//     let res = dotenv.config({ path: path.join(__dirname, "..", "dist", ".env")})
//     console.log("res", res)
//     sendEmail("jxie1@ualberta.ca", "testName", "1234");
// })()
