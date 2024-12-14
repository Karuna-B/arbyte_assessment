import nodemailer, { Transporter } from "nodemailer";
import dotenv from "dotenv";

dotenv.config();

const transporter: Transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS,
  },
});

// Verify transporter
transporter.verify((error: Error | null, success: boolean) => {
  if (error) {
    console.error("Transporter setup failed:", error);
  } else {
    console.log("Transporter is ready to send emails!");
  }
});

export default transporter;
