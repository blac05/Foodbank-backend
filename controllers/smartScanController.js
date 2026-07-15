import { logger } from "../utils/logger.js";

const ANTHROPIC_API_URL = "https://api.anthropic.com/v1/messages";
const MODEL = "claude-sonnet-5";

const SYSTEM_PROMPT = `You are the AI Smart-Scan system inside a food rescue app. A donor has photographed \
a crate, shelf, or box of surplus food they're about to donate. Identify each distinct food item you can see.

Respond with ONLY a JSON object (no markdown, no commentary, no code fences) matching exactly this shape:
{
  "items": [
    { "name": string, "quantity": number, "unit": string, "category": string, "expiryEstimateDays": number }
  ]
}

Rules:
- "name" should be a short, human-readable item name (e.g. "Sourdough loaves", "Roma tomatoes").
- "quantity" is your best count of units visible.
- "unit" is one of: "unit", "kg", "lb", "loaf", "box", "bag", "crate", "liter".
- "category" is one of: "produce", "bakery", "dairy", "protein", "pantry", "prepared", "general".
- "expiryEstimateDays" is your best estimate of days until spoilage from today, based on typical shelf life for that food type (use your general knowledge — do not guess wildly; e.g. fresh bread ~3, leafy greens ~4, canned goods ~365).
- If you cannot identify any food items in the image, return { "items": [] }.
- Never include any text outside the JSON object.`;

function extractJson(text) {
  // Claude is instructed to return raw JSON, but strip code fences defensively
  // in case a model response wraps it anyway.
  const cleaned = text.replace(/```json|```/g, "").trim();
  return JSON.parse(cleaned);
}

export async function smartScan(req, res) {
  try {
    if (!process.env.ANTHROPIC_API_KEY) {
      return res.status(503).json({
        message: "AI Smart-Scan isn't configured on this server yet — add ANTHROPIC_API_KEY to enable it.",
      });
    }

    const { imageBase64, mediaType } = req.body;
    if (!imageBase64) {
      return res.status(400).json({ message: "imageBase64 is required" });
    }

    const allowedMediaTypes = ["image/jpeg", "image/png", "image/webp"];
    const resolvedMediaType = allowedMediaTypes.includes(mediaType) ? mediaType : "image/jpeg";

    const response = await fetch(ANTHROPIC_API_URL, {
      method: "POST",
      headers: {
        "content-type": "application/json",
        "x-api-key": process.env.ANTHROPIC_API_KEY,
        "anthropic-version": "2023-06-01",
      },
      body: JSON.stringify({
        model: MODEL,
        max_tokens: 1024,
        system: SYSTEM_PROMPT,
        messages: [
          {
            role: "user",
            content: [
              {
                type: "image",
                source: { type: "base64", media_type: resolvedMediaType, data: imageBase64 },
              },
              { type: "text", text: "Identify the food items in this photo and return the JSON described in your instructions." },
            ],
          },
        ],
      }),
    });

    if (!response.ok) {
      const errBody = await response.text();
      logger.error({ status: response.status, errBody }, "Anthropic API request failed");
      return res.status(502).json({ message: "AI Smart-Scan failed to analyze the image — please add items manually." });
    }

    const data = await response.json();
    const textBlock = data.content?.find((block) => block.type === "text");
    if (!textBlock) {
      return res.status(502).json({ message: "AI Smart-Scan returned an unexpected response — please add items manually." });
    }

    let parsed;
    try {
      parsed = extractJson(textBlock.text);
    } catch (parseErr) {
      logger.error({ parseErr, raw: textBlock.text }, "Failed to parse Smart-Scan JSON");
      return res.status(502).json({ message: "AI Smart-Scan couldn't read the image clearly — please add items manually." });
    }

    const items = (parsed.items || []).map((item) => ({
      name: item.name,
      quantity: item.quantity || 1,
      unit: item.unit || "unit",
      category: item.category || "general",
      expiryEstimate: item.expiryEstimateDays
        ? new Date(Date.now() + item.expiryEstimateDays * 24 * 60 * 60 * 1000)
        : undefined,
    }));

    res.json({ items });
  } catch (err) {
    logger.error({ err }, "smartScan failed");
    res.status(500).json({ message: "AI Smart-Scan is temporarily unavailable — please add items manually." });
  }
}