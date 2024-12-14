import { Request, Response } from "express";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import pool from "../config/db";
import { sendOTP } from "../services/otpServices";

export const register = async (req: Request, res: Response): Promise<void> => {
  const { email, password } = req.body;

  try {
    // Validating input
    if (!email || !password) {
      res.status(400).json({ message: "Email and password are required" });
      return;
    }

    // Check if user already exists
    const userExists = await pool.query(
      "SELECT * FROM users WHERE email = $1",
      [email]
    );
    if (userExists.rows.length > 0) {
      res.status(400).json({ message: "User already exists" });
      return;
    }

    // Hashing
    const hashedPassword = await bcrypt.hash(password, 10);

    // Generate OTP expiring in 10 min
    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    const otpExpiry = new Date(Date.now() + 10 * 60 * 1000);

    // Save userinfo with OTP
    await pool.query(
      "INSERT INTO users (email, password, otp, otpExpiry) VALUES ($1, $2, $3, $4)",
      [email, hashedPassword, otp, otpExpiry]
    );

    // Send OTP to user email
    await sendOTP(email, otp);

    res.status(201).json({
      message: "OTP sent to your email. Verify to complete registration.",
    });
    return;
  } catch (error) {
    const typedError = error as Error;
    console.error(typedError.message);
    res.status(500).json({ message: "Server error" });
  }
};

// OTP Verification Endpoint
export const verifyOTP = async (req: Request, res: Response): Promise<void> => {
  const { email, otp } = req.body;

  try {
    // Retrieve user data
    const user = await pool.query("SELECT * FROM users WHERE email = $1", [
      email,
    ]);

    if (user.rows.length === 0) {
      res.status(400).json({ message: "User not found" });
      return;
    }

    const storedOtp = user.rows[0].otp;
    const otpExpiry = user.rows[0].otpExpiry;

    // Check if OTP matches and is not expired
    if (otp !== storedOtp) {
      res.status(400).json({ message: "Invalid OTP" });
      return;
    }

    const currentTime = new Date();
    const expiryTime = new Date(otpExpiry);

    if (currentTime > expiryTime) {
      res
        .status(400)
        .json({ message: "OTP has expired. Please request a new one." });
      return;
    }

    // If OTP is valid and not expired, proceed with registration
    await pool.query(
      "UPDATE users SET otp = NULL, otpExpiry = NULL WHERE email = $1",
      [email]
    );

    res
      .status(200)
      .json({ message: "OTP verified successfully. Registration complete." });
  } catch (error) {
    const typedError = error as Error;
    console.error(typedError.message);
    res.status(500).json({ message: "Server error" });
  }
};

export const login = async (req: Request, res: Response): Promise<void> => {
  const { email, password } = req.body;

  try {
    if (!email || !password) {
      res.status(400).json({ message: "Email and password are required" });
      return;
    }

    const user = await pool.query("SELECT * FROM users WHERE email = $1", [
      email,
    ]);
    if (user.rows.length === 0) {
      res.status(400).json({ message: "Invalid credentials" });
      return;
    }

    // Comparing passwords
    const validPassword = await bcrypt.compare(password, user.rows[0].password);
    if (!validPassword) {
      res.status(400).json({ message: "Invalid credentials" });
      return;
    }

    // Once Validated Generate JWT token
    const token = jwt.sign(
      { id: user.rows[0].id, email: user.rows[0].email },
      process.env.JWT_SECRET as string,
      { expiresIn: "24h" }
    );

    // Return token as response
    res.status(200).json({
      message: "Login successful",
      token,
    });
    return;
  } catch (error) {
    const typedError = error as Error;
    console.error(typedError.message);
    res.status(500).json({ message: "Server error" });
  }
};
