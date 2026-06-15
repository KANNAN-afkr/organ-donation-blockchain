const Groq = require("groq-sdk");
const mongoose = require("mongoose");
const { GridFSBucket } = require("mongodb");

// Lazily get Groq client so dotenv is always loaded first
function getGroq() {
  return new Groq({ apiKey: process.env.GROQ_API_KEY });
}

async function getPDFText(fileId) {
  const bucket = new GridFSBucket(mongoose.connection.db, { bucketName: "medicalReports" });
  return new Promise((resolve) => {
    const chunks = [];
    const stream = bucket.openDownloadStream(new mongoose.Types.ObjectId(fileId));
    stream.on("data", (chunk) => chunks.push(chunk));
    stream.on("end", () => {
      const buf = Buffer.concat(chunks);
      // Extract readable ASCII text from PDF binary
      const text = buf.toString("latin1")
        .replace(/[^\x20-\x7E\n\r\t]/g, " ")
        .replace(/\s+/g, " ")
        .trim()
        .slice(0, 6000);
      resolve(text);
    });
    stream.on("error", () => resolve(""));
  });
}

async function analyzeMedicalReports(organListing, recipient) {
  try {
    let organReportText = "";
    let recipientReportText = "";

    if (organListing.reportFileId) {
      try { organReportText = await getPDFText(organListing.reportFileId); } catch (e) { console.warn("[Groq] Organ PDF read failed:", e.message); }
    }
    if (recipient.reportFileId) {
      try { recipientReportText = await getPDFText(recipient.reportFileId); } catch (e) { console.warn("[Groq] Recipient PDF read failed:", e.message); }
    }

    const prompt = `You are a senior medical AI assistant helping doctors make organ transplant decisions.

AVAILABLE ORGAN DETAILS:
- Organ Type: ${organListing.organType}
- Blood Group: ${organListing.bloodGroup}
- Donor Age: ${organListing.donorAge}
- Donor Gender: ${organListing.donorGender}
- Medical Condition: ${organListing.medicalCondition}
- Additional Notes: ${organListing.additionalNotes || "None"}

RECIPIENT DETAILS:
- Name: ${recipient.patientName || recipient.name || "Unknown"}
- Age: ${recipient.patientAge || recipient.age || "Unknown"}
- Gender: ${recipient.patientGender || recipient.gender || "Unknown"}
- Blood Group: ${recipient.bloodGroup}
- Organ Needed: ${recipient.organNeeded}
- Urgency Level: ${recipient.urgencyLevel}
- Diagnosis: ${recipient.diagnosis}
- Hospital: ${recipient.hospitalName || ""}

${organReportText ? `DONOR MEDICAL REPORT:\n${organReportText}\n` : ""}
${recipientReportText ? `RECIPIENT MEDICAL REPORT:\n${recipientReportText}\n` : ""}

Respond with ONLY this JSON, no markdown, no extra text:
{
  "matchScore": <number 0-100>,
  "bloodCompatibility": "<explanation>",
  "organCompatibility": "<explanation>",
  "keyInsights": ["<insight1>", "<insight2>", "<insight3>", "<insight4>", "<insight5>"],
  "medicalSummary": "<2-3 sentence clinical summary>",
  "recommendation": "<RECOMMEND|CAUTION|NOT_RECOMMENDED> - <reason>"
}`;

    const groq = getGroq();
    const response = await groq.chat.completions.create({
      model: "llama-3.3-70b-versatile",
      messages: [{ role: "user", content: prompt }],
      temperature: 0.3,
      max_tokens: 1024,
    });

    const text = response.choices[0]?.message?.content?.trim();
    console.log("[Groq] Raw response:", text?.slice(0, 200));

    const jsonMatch = text.match(/\{[\s\S]*\}/);
    if (!jsonMatch) throw new Error("No JSON in response");

    const analysis = JSON.parse(jsonMatch[0]);
    console.log(`[Groq] Analysis complete. Match score: ${analysis.matchScore}`);
    return { ...analysis, rawAnalysis: text };

  } catch (err) {
    console.error("[Groq] Analysis failed:", err.message);

    const bloodMatch = organListing.bloodGroup === recipient.bloodGroup ||
      organListing.bloodGroup === "O-" || recipient.bloodGroup === "AB+";
    const organMatch = organListing.organType === recipient.organNeeded;

    return {
      matchScore: bloodMatch && organMatch ? 72 : organMatch ? 40 : 10,
      bloodCompatibility: bloodMatch
        ? `${organListing.bloodGroup} is compatible with ${recipient.bloodGroup}`
        : `${organListing.bloodGroup} may not be compatible with ${recipient.bloodGroup}`,
      organCompatibility: organMatch
        ? `${organListing.organType} matches recipient's required organ`
        : `Organ type mismatch: ${organListing.organType} vs ${recipient.organNeeded}`,
      keyInsights: [
        `Organ type: ${organListing.organType} — Recipient needs: ${recipient.organNeeded} — ${organMatch ? "Match" : "Mismatch"}`,
        `Blood group: Donor ${organListing.bloodGroup} → Recipient ${recipient.bloodGroup} — ${bloodMatch ? "Compatible" : "Incompatible"}`,
        `Recipient urgency: ${(recipient.urgencyLevel || "").toUpperCase()}`,
        `Donor age ${organListing.donorAge} — Recipient age ${recipient.patientAge || recipient.age || "N/A"}`,
        "Manual review of attached medical reports recommended",
      ],
      medicalSummary: `${organMatch ? "Organ type matches." : "Organ type does not match."} ${bloodMatch ? "Blood groups are compatible." : "Blood groups may be incompatible."} Urgency: ${recipient.urgencyLevel}.`,
      recommendation: bloodMatch && organMatch ? "RECOMMEND - Basic compatibility confirmed" : organMatch ? "CAUTION - Blood group needs verification" : "NOT_RECOMMENDED - Organ or blood type mismatch",
      rawAnalysis: `Fallback analysis — Groq error: ${err.message}`,
    };
  }
}

module.exports = { analyzeMedicalReports };
