import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import User from "../models/User.js";

function signToken(user) {
  return jwt.sign(
    { id: user._id, role: user.role, fullName: user.fullName },
    process.env.JWT_SECRET,
    { expiresIn: "7d" }
  );
}

function sanitize(user) {
  const obj = user.toObject();
  delete obj.password;
  return obj;
}

export async function signup(req, res) {
  try {
    const { fullName, email, password, role, ...rest } = req.body;

    if (!fullName || !email || !password || !role) {
      return res.status(400).json({ message: "fullName, email, password, and role are required" });
    }

    const existing = await User.findOne({ email: email.toLowerCase() });
    if (existing) {
      return res.status(409).json({ message: "An account with this email already exists" });
    }

    const hashed = await bcrypt.hash(password, 10);
    const user = await User.create({
      fullName,
      email: email.toLowerCase(),
      password: hashed,
      role,
      ...rest,
    });

    const token = signToken(user);
    res.status(201).json({ token, user: sanitize(user) });
  } catch (err) {
    console.error("[signup]", err.message);
    res.status(500).json({ message: "Signup failed" });
  }
}

export async function login(req, res) {
  try {
    const { email, password } = req.body;
    if (!email || !password) {
      return res.status(400).json({ message: "Email and password are required" });
    }

    const user = await User.findOne({ email: email.toLowerCase() });
    if (!user) {
      return res.status(401).json({ message: "Invalid email or password" });
    }

    const match = await bcrypt.compare(password, user.password);
    if (!match) {
      return res.status(401).json({ message: "Invalid email or password" });
    }

    const token = signToken(user);
    res.json({ token, user: sanitize(user) });
  } catch (err) {
    console.error("[login]", err.message);
    res.status(500).json({ message: "Login failed" });
  }
}

export async function me(req, res) {
  try {
    const user = await User.findById(req.user.id);
    if (!user) return res.status(404).json({ message: "User not found" });
    res.json({ user: sanitize(user) });
  } catch (err) {
    res.status(500).json({ message: "Failed to fetch profile" });
  }
}
