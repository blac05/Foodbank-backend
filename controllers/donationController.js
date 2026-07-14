import Donation from "../models/Donation.js";
import Mission from "../models/Mission.js";

function computeUrgency(items) {
  const now = Date.now();
  let score = 0;
  for (const item of items) {
    const hoursToExpiry = item.expiryEstimate
      ? Math.max((new Date(item.expiryEstimate).getTime() - now) / 36e5, 1)
      : 72;
    score += (item.quantity || 1) * (100 / hoursToExpiry);
  }
  return Math.round(score);
}

export async function createDonation(req, res) {
  try {
    const { items, pickupAddress, pickupWindowStart, pickupWindowEnd, notes } = req.body;
    if (!items?.length || !pickupAddress) {
      return res.status(400).json({ message: "items and pickupAddress are required" });
    }

    const urgencyScore = computeUrgency(items);

    const donation = await Donation.create({
      donor: req.user.id,
      items,
      pickupAddress,
      pickupWindowStart,
      pickupWindowEnd,
      notes,
      urgencyScore,
    });

    const estimatedMeals = items.reduce((sum, i) => sum + (i.quantity || 1), 0);
    await Mission.create({
      donation: donation._id,
      status: "available",
      estimatedImpact: {
        mealsProvided: estimatedMeals,
        co2eSavedKg: Math.round(estimatedMeals * 0.6),
      },
    });

    res.status(201).json({ donation });
  } catch (err) {
    console.error("[createDonation]", err.message);
    res.status(500).json({ message: "Failed to create donation" });
  }
}

export async function listMyDonations(req, res) {
  const donations = await Donation.find({ donor: req.user.id }).sort({ createdAt: -1 });
  res.json({ donations });
}

export async function listAvailableDonations(_req, res) {
  const donations = await Donation.find({ status: "listed" }).sort({ urgencyScore: -1 });
  res.json({ donations });
}

export async function listShopInventory(_req, res) {
  const donations = await Donation.find({ status: "delivered" })
    .sort({ updatedAt: -1 })
    .limit(50);

  const items = donations.flatMap((d) =>
    d.items.map((item) => ({
      ...item.toObject(),
      donationId: d._id,
    }))
  );

  res.json({ items });
}

export async function updateDonationStatus(req, res) {
  try {
    const { status } = req.body;
    const donation = await Donation.findById(req.params.id);
    if (!donation) return res.status(404).json({ message: "Donation not found" });

    donation.status = status;
    if (status === "claimed") donation.claimedBy = req.user.id;
    await donation.save();

    res.json({ donation });
  } catch (err) {
    res.status(500).json({ message: "Failed to update donation" });
  }
}