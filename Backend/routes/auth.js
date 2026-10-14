import express from "express";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import pool from "../config/db.js";
import dotenv from "dotenv";
import { protect } from "../middleware/auth.js";

dotenv.config();
const router = express.Router();

const cookieOptions = {
  httpOnly: true,
  sameSite: "Strict",
  maxAge: 30 * 24 * 60 * 60 * 1000,
};

const generateToken = (id) => {
  return jwt.sign({ id }, process.env.JWT_SECRET, { expiresIn: "30d" });
};

//register

router.post("/register", async (req, res) => {
  const { firstname, lastname, email, password } = req.body;

  if (!firstname || !lastname || !email || !password) {
    return res
      .status(400)
      .json({ message: "please provide all the required field" });
  }

  try {
    const userExist = await pool.query("SELECT * FROM users WHERE email=$1", [
      email,
    ]);
    if (userExist.rows.length > 0) {
      return res.status(400).json({ message: "User already exists." });
    }

    const hashPassword = await bcrypt.hash(password, 10);

    // SECURED: Hardcoded 'contributor' as the default role for all new signups
    const newUser = await pool.query(
      "INSERT INTO users (first_name, last_name, email, password_hash) VALUES ($1, $2, $3, $4) RETURNING id, first_name, last_name, email",
      [firstname, lastname, email, hashPassword],
    );

    const token = generateToken(newUser.rows[0].id);

    res.cookie("token", token, cookieOptions);

    return res.status(201).json({ user: newUser.rows[0] });
  } catch (err) {
    console.error("Registration Error:", err);
    return res.status(500).json({ message: err.message });
  }
});

//login
router.post("/login", async (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return res
      .status(400)
      .json({ message: "provide details for all the required field" });
  }

  const user = await pool.query("SELECT * FROM users WHERE email=$1", [email]);
  if (user.rows.length === 0) {
    return res.status(400).json({ message: "invalide login details" });
  }

  const userData = user.rows[0];
  const isMatch = await bcrypt.compare(password, userData.password_hash);
  if (!isMatch) {
    return res.status(400).json({ message: "invalide login details" });
  }
  const token = generateToken(userData.id);
  res.cookie("token", token, cookieOptions);

  res.json({
    user: {
      id: userData.id,
      first_name: userData.first_name,
      last_name: userData.last_name,
      email: userData.email,
      role: userData.role,
    },
  });
});

//getting user data
router.get("/me", protect, async (req, res) => {
  res.json(req.user);
});

router.post("/logout", (req, res) => {
    // NOTE: Change 'token' to whatever you named your cookie when they logged in!
    // (Common names are 'token', 'jwt', or 'session')
    res.clearCookie("token", {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production", // true if on a live server
        sameSite: "strict"
    });
    
    return res.json({ message: "Successfully logged out" });
});

export default router;
