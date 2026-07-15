import crypto from "crypto";
import Locker from "../models/Locker.js";

const ACCESS_CODE_TTL_HOURS = 48;

function generateAccessCode() {
  // 6-digit numeric code, easy to read off a text message and type at a locker keypad
  return crypto.randomInt(100000, 999999).toString();
}

export async function listAvailableLockers(_req, res) {
  const lockers = await Locker.find({ status: "available" }).select("code hubAddress tempZone");
  res.json({ lockers });
}

// Reserves the first available locker for a recipient's order and generates
// a time-boxed access code. Returns null if no locker is currently free —
// callers should fall back gracefully (e.g. still place the order, notify
// the recipient once a locker opens up) rather than blocking checkout.
export async function reserveLockerForRecipient(recipientId) {
  const locker = await Locker.findOneAndUpdate(
    { status: "available" },
    {
      status: "occupied",
      reservedForRecipient: recipientId,
      accessCode: generateAccessCode(),
      accessCodeExpiresAt: new Date(Date.now() + ACCESS_CODE_TTL_HOURS * 60 * 60 * 1000),
    },
    { new: true }
  );
  return locker;
}

export async function releaseLocker(req, res) {
  try {
    const locker = await Locker.findById(req.params.id);
    if (!locker) return res.status(404).json({ message: "Locker not found" });

    locker.status = "available";
    locker.reservedForRecipient = undefined;
    locker.accessCode = undefined;
    locker.accessCodeExpiresAt = undefined;
    locker.currentDonation = undefined;
    await locker.save();

    res.json({ locker });
  } catch (err) {
    res.status(500).json({ message: "Failed to release locker" });
  }
}