import { Request, Response } from "express";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import pool from "../config/db";

export const register = async (req: Request, res: Response): Promise<void> => {
  const { email, password } = req.body;

  try {
    // Validating input
    if (!email || !password) {
      res.status(400).json({ message: "Email and password are required" });
    }

    // Check if user already exists
    const userExists = await pool.query(
      "SELECT * FROM users WHERE email = $1",
      [email]
    );
    if (userExists.rows.length > 0) {
      res.status(400).json({ message: "User already exists" });
    }

    // Hashing
    const hashedPassword = await bcrypt.hash(password, 10);

    // Save user to database
    const newUser = await pool.query(
      "INSERT INTO users (email, password) VALUES ($1, $2) RETURNING id, email",
      [email, hashedPassword]
    );

    res.status(201).json({
      message: "User registered successfully",
      user: newUser.rows[0],
    });
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
    }

    const user = await pool.query("SELECT * FROM users WHERE email = $1", [
      email,
    ]);
    if (user.rows.length === 0) {
      res.status(400).json({ message: "Invalid credentials" });
    }

    // Comparing passwords
    const validPassword = await bcrypt.compare(password, user.rows[0].password);
    if (!validPassword) {
      res.status(400).json({ message: "Invalid credentials" });
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
  } catch (error) {
    const typedError = error as Error;
    console.error(typedError.message);
    res.status(500).json({ message: "Server error" });
  }
};
