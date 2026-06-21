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
    let organReportStatus = "not_provided";
    let recipientReportStatus = "not_provided";

    if (organListing.reportFileId) {
      try {
        organReportText = await getPDFText(organListing.reportFileId);
        organReportStatus = organReportText.length > 100 ? "readable" : "unreadable";
      } catch (e) {
        organReportStatus = "failed";
        console.warn("[Groq] Organ PDF read failed:", e.message);
      }
    }
    if (recipient.reportFileId) {
      try {
        recipientReportText = await getPDFText(recipient.reportFileId);
        recipientReportStatus = recipientReportText.length > 100 ? "readable" : "unreadable";
      } catch (e) {
        recipientReportStatus = "failed";
        console.warn("[Groq] Recipient PDF read failed:", e.message);
      }
    }

    const prompt = `You are a senior transplant surgeon and medical AI analyzing organ compatibility for a life-critical transplant decision.

AVAILABLE ORGAN DETAILS (from system records):
- Organ Type: ${organListing.organType}
- Blood Group: ${organListing.bloodGroup}
- Donor Age: ${organListing.donorAge}
- Donor Gender: ${organListing.donorGender}
- Medical Condition: ${organListing.medicalCondition}
- Additional Notes: ${organListing.additionalNotes || "None"}
- Donor Report Status: ${organReportStatus === "readable" ? "PDF provided and readable" : organReportStatus === "unreadable" ? "PDF provided but content could not be extracted — may not be a medical report" : "No PDF provided"}

RECIPIENT DETAILS (from system records):
- Name: ${recipient.patientName || recipient.name || "Unknown"}
- Age: ${recipient.patientAge || recipient.age || "Unknown"}
- Gender: ${recipient.patientGender || recipient.gender || "Unknown"}
- Blood Group: ${recipient.bloodGroup}
- Organ Needed: ${recipient.organNeeded}
- Urgency Level: ${recipient.urgencyLevel}
- Diagnosis: ${recipient.diagnosis}
- Hospital: ${recipient.hospitalName || ""}
- Recipient Report Status: ${recipientReportStatus === "readable" ? "PDF provided and readable" : recipientReportStatus === "unreadable" ? "PDF provided but content could not be extracted — may not be a medical report" : "No PDF provided"}

${organReportText ? `DONOR MEDICAL REPORT (extracted text):\n${organReportText}\n` : ""}
${recipientReportText ? `RECIPIENT MEDICAL REPORT (extracted text):\n${recipientReportText}\n` : ""}

IMPORTANT INSTRUCTIONS:
- If a PDF was provided but unreadable or doesn't appear to be a medical report, clearly mention this in your analysis
- If report text looks like a non-medical document (random text, invoices, images etc), flag it as "Invalid document — not a medical report"
- Base your analysis primarily on the system record details provided above
- Be honest about what data you have and what is missing

Analyze thoroughly and respond with ONLY this JSON, no markdown, no extra text:
{
  "matchScore": <number 0-100>,
  "bloodCompatibility": "<detailed blood group compatibility explanation>",
  "organCompatibility": "<detailed organ type and size compatibility>",
  "donorReportStatus": "<Valid Medical Report | Invalid Document | Not Provided | Could Not Read>",
  "recipientReportStatus": "<Valid Medical Report | Invalid Document | Not Provided | Could Not Read>",
  "donorProfile": {
    "age": "<extracted or provided>",
    "gender": "<extracted or provided>",
    "bloodGroup": "<extracted or provided>",
    "organCondition": "<condition of the organ based on report or system data>",
    "medicalHistory": "<key medical history from report or system data>",
    "causeOfDonation": "<if mentioned>",
    "contraindications": "<any risk factors found>"
  },
  "recipientProfile": {
    "age": "<extracted or provided>",
    "gender": "<extracted or provided>",
    "bloodGroup": "<extracted or provided>",
    "diagnosis": "<primary diagnosis>",
    "comorbidities": "<other conditions found>",
    "currentMedications": "<if mentioned>",
    "urgency": "<urgency level and clinical justification>",
    "waitingDuration": "<if mentioned>"
  },
  "compatibilityFactors": {
    "bloodGroupMatch": "<Compatible/Incompatible/Universal - explanation>",
    "organTypeMatch": "<Match/Mismatch - explanation>",
    "ageCompatibility": "<analysis of donor vs recipient age>",
    "crossMatchRisk": "<Low/Medium/High - explanation>",
    "rejectionRisk": "<Low/Medium/High - reason>"
  },
  "keyInsights": ["<insight1>", "<insight2>", "<insight3>", "<insight4>", "<insight5>"],
  "riskFactors": ["<risk1>", "<risk2>", "<risk3>"],
  "preTransplantChecks": ["<check1>", "<check2>", "<check3>"],
  "medicalSummary": "<3-4 sentence comprehensive clinical summary mentioning any document issues>",
  "recommendation": "<RECOMMEND|CAUTION|NOT_RECOMMENDED>",
  "recommendationReason": "<detailed clinical justification>"
}`;

    const groq = getGroq();
    const response = await groq.chat.completions.create({
      model: "llama-3.3-70b-versatile",
      messages: [{ role: "user", content: prompt }],
      temperature: 0.3,
      max_tokens: 2048,
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
