import Mission from "../models/Mission.js";
import Donation from "../models/Donation.js";
import User from "../models/User.js";

export async function listAvailableMissions(_req, res) {
  const missions = await Mission.find({ status: "available" })
    .populate("donation")
    .sort({ createdAt: -1 });
  res.json({ missions });
}

export async function listMyMissions(req, res) {
  const missions = await Mission.find({ volunteer: req.user.id })
    .populate("donation")
    .sort({ createdAt: -1 });
  res.json({ missions });
}

export async function acceptMission(req, res) {
  const mission = await Mission.findById(req.params.id);
  if (!mission || mission.status !== "available") {
    return res.status(400).json({ message: "Mission is no longer available" });
  }

  mission.volunteer = req.user.id;
  mission.status = "accepted";
  await mission.save();

  await Donation.findByIdAndUpdate(mission.donation, {
    status: "claimed",
    claimedBy: req.user.id,
  });

  res.json({ mission });
}

export async function updateMissionStatus(req, res) {
  const { status } = req.body;
  const mission = await Mission.findById(req.params.id);
  if (!mission) return res.status(404).json({ message: "Mission not found" });

  mission.status = status;
  await mission.save();

  if (status === "picked_up") {
    await Donation.findByIdAndUpdate(mission.donation, { status: "in_transit" });
  }
  if (status === "delivered") {
    await Donation.findByIdAndUpdate(mission.donation, { status: "delivered" });
    await User.findByIdAndUpdate(mission.volunteer, {
      $inc: {
        "impactStats.missionsCompleted": 1,
        "impactStats.mealsProvided": mission.estimatedImpact.mealsProvided,
        "impactStats.co2eSavedKg": mission.estimatedImpact.co2eSavedKg,
      },
    });
  }

  res.json({ mission });
}