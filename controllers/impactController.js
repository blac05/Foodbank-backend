import User from "../models/User.js";
import Donation from "../models/Donation.js";

export async function getGlobalImpact(_req, res) {
  try {
    const [aggregate] = await User.aggregate([
      {
        $group: {
          _id: null,
          mealsProvided: { $sum: "$impactStats.mealsProvided" },
          co2eSavedKg: { $sum: "$impactStats.co2eSavedKg" },
          waterSavedLiters: { $sum: "$impactStats.waterSavedLiters" },
        },
      },
    ]);

    const activeDonationHubs = await Donation.distinct("pickupAddress");

    res.json({
      mealsProvided: aggregate?.mealsProvided || 0,
      co2eSavedTonnes: Math.round(((aggregate?.co2eSavedKg || 0) / 1000) * 10) / 10,
      waterSavedLiters: aggregate?.waterSavedLiters || 0,
      activeHubs: activeDonationHubs.length,
    });
  } catch (err) {
    console.error("[getGlobalImpact]", err.message);
    res.status(500).json({ message: "Failed to load impact stats" });
  }
}
