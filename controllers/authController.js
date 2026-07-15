import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import User from "../models/User.js";
import { logger } from "../utils/logger.js";

const ACCESS_TOKEN_EXPIRY = "15m";
const REFRESH_TOKEN_EXPIRY = "30d";

function signAccessToken(user) {
  return jwt.sign(
    { id: user._id, role: user.role, fullName: user.fullName },
    process.env.JWT_SECRET,
    { expiresIn: ACCESS_TOKEN_EXPIRY }
  );
}

function signRefreshToken(user) {
  return jwt.sign({ id: user._id }, process.env.REFRESH_TOKEN_SECRET, {
    expiresIn: REFRESH_TOKEN_EXPIRY,
  });
}

async function issueTokenPair(user) {
  const accessToken = signAccessToken(user);
  const refreshToken = signRefreshToken(user);
  user.refreshTokenHash = await bcrypt.hash(refreshToken, 10);
  await user.save();
  return { accessToken, refreshToken };
}

function sanitize(user) {
  const obj = user.toObject();
  delete obj.password;
  delete obj.refreshTokenHash;
  return obj;
}

export async function signup(req, res) {
  try {
    const { fullName, email, password, role, ...rest } = req.body;

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

    const { accessToken, refreshToken } = await issueTokenPair(user);
    res.status(201).json({ accessToken, refreshToken, user: sanitize(user) });
  } catch (err) {
    logger.error({ err }, "signup failed");
    res.status(500).json({ message: "Signup failed" });
  }
}

export async function login(req, res) {
  try {
    const { email, password } = req.body;

    const user = await User.findOne({ email: email.toLowerCase() });
    if (!user) {
      return res.status(401).json({ message: "Invalid email or password" });
    }

    const match = await bcrypt.compare(password, user.password);
    if (!match) {
      return res.status(401).json({ message: "Invalid email or password" });
    }

    const { accessToken, refreshToken } = await issueTokenPair(user);
    res.json({ accessToken, refreshToken, user: sanitize(user) });
  } catch (err) {
    logger.error({ err }, "login failed");
    res.status(500).json({ message: "Login failed" });
  }
}

// Exchanges a valid, unexpired refresh token for a new access token, and
// rotates the refresh token itself so a leaked one can't be replayed forever.
export async function refresh(req, res) {
  try {
    const { refreshToken } = req.body;

    let payload;
    try {
      payload = jwt.verify(refreshToken, process.env.REFRESH_TOKEN_SECRET);
    } catch {
      return res.status(401).json({ message: "Refresh token is invalid or expired" });
    }

    const user = await User.findById(payload.id).select("+refreshTokenHash");
    if (!user || !user.refreshTokenHash) {
      return res.status(401).json({ message: "Session no longer valid — please log in again" });
    }

    const matches = await bcrypt.compare(refreshToken, user.refreshTokenHash);
    if (!matches) {
      return res.status(401).json({ message: "Session no longer valid — please log in again" });
    }

    const tokens = await issueTokenPair(user);
    res.json({ ...tokens, user: sanitize(user) });
  } catch (err) {
    logger.error({ err }, "refresh failed");
    res.status(500).json({ message: "Failed to refresh session" });
  }
}

export async function logout(req, res) {
  try {
    await User.findByIdAndUpdate(req.user.id, { $unset: { refreshTokenHash: 1 } });
    res.json({ message: "Logged out" });
  } catch (err) {
    logger.error({ err }, "logout failed");
    res.status(500).json({ message: "Failed to log out" });
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