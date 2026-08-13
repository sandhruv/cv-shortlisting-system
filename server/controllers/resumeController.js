const Resume = require("../models/Resume");
const User = require("../models/User");
const fs = require("fs");
const path = require("path");
const axios = require("axios");

// ✅ CORRECT import for pdf-parse
let pdfParse;
try {
  pdfParse = require("pdf-parse");
} catch (err) {
  console.error("❌ pdf-parse not installed. Run: npm install pdf-parse@1.1.1");
  process.exit(1);
}

const extractTextFromFile = async (filePath, fileName) => {
  const ext = fileName.toLowerCase().slice(fileName.lastIndexOf("."));
  let text = "";

  if (ext === ".pdf") {
    const dataBuffer = fs.readFileSync(filePath);
    try {
      // ✅ Use .default if it's an ES module
      const parser = pdfParse.default || pdfParse;
      const pdfData = await parser(dataBuffer);
      text = pdfData.text;
    } catch (err) {
      throw new Error("PDF parsing failed: " + err.message);
    }
  } else if (ext === ".doc" || ext === ".docx") {
    text = fs.readFileSync(filePath, "utf8");
  } else {
    throw new Error("Unsupported file type. Only PDF, DOC, DOCX allowed.");
  }

  if (!text || text.trim().length < 10) {
    throw new Error("File appears empty or contains no extractable text (scanned PDF?).");
  }

  return text.substring(0, 5000);
};

const analyzeWithGroq = async (text) => {
  const GROQ_API_KEY = process.env.GROQ_API_KEY;
  if (!GROQ_API_KEY) throw new Error("GROQ_API_KEY not set in .env");

  const prompt = `You are a resume parser. Extract the following information from this CV/Resume text:

1. Email address (look for pattern like name@domain.com)
2. Phone/Mobile number (10-15 digits with optional country code)
3. Technical skills (programming languages, frameworks, tools, technologies)
4. Project details (project names and brief descriptions)
5. Certifications (certificates, courses, licenses)
6. Other information (education, achievements, languages, etc.)

Return ONLY valid JSON. No explanations, no markdown, no extra text.

Format:
{
  "email": "found email or 'Not found'",
  "contact_no": "found phone number or 'Not found'",
  "technical_skills": "comma separated skills or 'Not found'",
  "project_details": "project descriptions or 'Not found'",
  "certifications": "certifications list or 'Not found'",
  "other_info": "other relevant information or 'Not found'"
}

Resume text:
${text}`;

  const response = await axios.post(
    "https://api.groq.com/openai/v1/chat/completions",
    {
      model: "llama-3.1-8b-instant",
      messages: [
        { role: "system", content: "You extract structured data from resumes. Return ONLY valid JSON. No markdown, no explanations." },
        { role: "user", content: prompt }
      ],
      temperature: 0.1,
      response_format: { type: "json_object" }
    },
    {
      headers: {
        "Authorization": `Bearer ${GROQ_API_KEY}`,
        "Content-Type": "application/json"
      }
    }
  );

  const content = response.data.choices[0].message.content;
  const jsonStr = content.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
  return JSON.parse(jsonStr);
};

exports.uploadCV = async (req, res) => {
  try {
    if (!["Student", "LPU Student"].includes(req.user.role)) {
      return res.status(403).json({ message: "Only students can upload CV" });
    }

    if (!req.file) {
      return res.status(400).json({ message: "No file uploaded" });
    }

    const studentId = req.user.id;
    const filePath = req.file.path;
    const fileName = path.basename(req.file.originalname).replace(/[^a-zA-Z0-9._-]/g, "_");

    let extractedText;
    try {
      extractedText = await extractTextFromFile(filePath, fileName);
    } catch (err) {
      fs.unlinkSync(filePath);
      return res.status(400).json({ message: "Could not extract text: " + err.message });
    }

    let parsedData;
    try {
      parsedData = await analyzeWithGroq(extractedText);
    } catch (err) {
      fs.unlinkSync(filePath);
      return res.status(500).json({ message: "AI analysis failed: " + err.message });
    }

    const resume = await Resume.create({
      student: studentId,
      fileName: fileName,
      fileSize: req.file.size,
      extractedData: parsedData,
      status: "processed",
    });

    fs.unlinkSync(filePath);
    await User.findByIdAndUpdate(studentId, { $set: { resume: resume._id } });

    res.status(201).json({
      message: "CV processed successfully",
      resume: resume,
    });

  } catch (err) {
    if (req.file && fs.existsSync(req.file.path)) {
      fs.unlinkSync(req.file.path);
    }
    res.status(500).json({ message: err.message });
  }
};

exports.getMyResume = async (req, res) => {
  try {
    const resume = await Resume.findOne({ student: req.user.id }).sort({ createdAt: -1 });
    if (!resume) return res.status(404).json({ message: "No resume found" });
    res.json(resume);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

exports.getResumeByStudent = async (req, res) => {
  try {
    const { studentId } = req.params;
    if (!["Admin", "LPU Admin", "HR", "LPU Faculty"].includes(req.user.role) && req.user.id !== studentId) {
      return res.status(403).json({ message: "Not authorized to view this resume" });
    }
    const resume = await Resume.findOne({ student: studentId }).sort({ createdAt: -1 });
    if (!resume) return res.status(404).json({ message: "No resume found for this student" });
    res.json(resume);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// ── Generate ATS-Friendly Resume ─────────────────────────────────────────────
exports.generateATSResume = async (req, res) => {
  try {
    const resume = await Resume.findOne({ student: req.user.id }).sort({ createdAt: -1 });
    if (!resume) return res.status(404).json({ message: "No resume found. Upload one first." });

    const GROQ_API_KEY = process.env.GROQ_API_KEY;
    if (!GROQ_API_KEY) return res.status(500).json({ message: "GROQ_API_KEY not configured" });

    const d = resume.extractedData || {};
    const context = [
      d.email && `Email: ${d.email}`,
      d.contact_no && `Phone: ${d.contact_no}`,
      d.technical_skills && `Technical Skills: ${d.technical_skills}`,
      d.project_details && `Projects: ${d.project_details}`,
      d.certifications && `Certifications: ${d.certifications}`,
      d.other_info && `Other: ${d.other_info}`,
    ].filter(Boolean).join("\n");

    const prompt = `You are an expert ATS (Applicant Tracking System) resume writer.

Given the following extracted resume data, generate a professional, ATS-optimized resume in clean HTML format.

RULES:
1. Use clean, simple HTML (no <style> tags, no JavaScript, no external CSS)
2. Use only inline styles for basic formatting (font-family, margin, padding, color, border-bottom)
3. Structure: Header (name + contact) → Summary → Skills → Projects → Certifications → Education/Other
4. Use action verbs, quantify achievements where possible
5. Optimize for ATS parsing: use standard section headings, no tables, no columns, no graphics
6. Keep it professional and concise (1 page equivalent)
7. If data says "Not found" for a section, skip that section entirely
8. Use the candidate's actual data - do NOT fabricate information
9. Add a professional summary paragraph based on the skills and projects
10. Format skills as a clean comma-separated list
11. Wrap everything in a single <div> with basic inline styling
12. Use <h2> for section headers with border-bottom styling

Here is the extracted resume data:
${context}

Return ONLY the HTML content (starting with <div>), no markdown, no code fences, no explanations.`;

    const response = await axios.post(
      "https://api.groq.com/openai/v1/chat/completions",
      {
        model: "llama-3.1-8b-instant",
        messages: [
          {
            role: "system",
            content: "You are an expert ATS resume writer. Return ONLY clean HTML content. No markdown, no code fences, no explanations.",
          },
          { role: "user", content: prompt },
        ],
        temperature: 0.4,
        max_tokens: 3000,
      },
      {
        headers: {
          Authorization: `Bearer ${GROQ_API_KEY}`,
          "Content-Type": "application/json",
        },
        timeout: 30000,
      }
    );

    let html = response.data.choices[0].message.content;
    html = html.replace(/```html\n?/g, "").replace(/```\n?/g, "").trim();

    // Wrap in full document if not already wrapped
    if (!html.startsWith("<div")) {
      html = `<div>${html}</div>`;
    }

    resume.atsResume = { html, generatedAt: new Date() };
    await resume.save();

    res.json({ message: "ATS resume generated", atsResume: resume.atsResume });
  } catch (err) {
    console.error("❌ ATS generation error:", err?.response?.data || err.message);
    res.status(500).json({ message: "ATS generation failed: " + (err?.response?.data?.error?.message || err.message) });
  }
};

// ── Download ATS Resume as HTML File ────────────────────────────────────────
exports.downloadATSResume = async (req, res) => {
  try {
    const resume = await Resume.findOne({ student: req.user.id }).sort({ createdAt: -1 });
    if (!resume || !resume.atsResume?.html) {
      return res.status(404).json({ message: "No ATS resume found. Generate one first." });
    }

    const fullName = resume.extractedData?.email?.split("@")[0] || "candidate";
    const safeName = fullName.replace(/[^a-zA-Z0-9]/g, "_");

    const fullHTML = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>ATS Resume - ${safeName}</title>
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body {
      font-family: 'Segoe UI', Arial, Helvetica, sans-serif;
      color: #1a1a1a;
      background: #fff;
      padding: 40px;
      line-height: 1.5;
    }
    @media print {
      body { padding: 20px; }
    }
  </style>
</head>
<body>
  ${resume.atsResume.html}
</body>
</html>`;

    res.setHeader("Content-Type", "text/html");
    res.setHeader("Content-Disposition", `attachment; filename="ATS_Resume_${safeName}.html"`);
    res.send(fullHTML);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// ── Generate AI Interview Questions from Resume + Job Profile ───────────────
exports.generateInterviewQuestions = async (req, res) => {
  try {
    const { resumeData, jobTitle, jobDescription } = req.body;

    if (!resumeData) {
      return res.status(400).json({ message: "resumeData is required" });
    }

    const GROQ_API_KEY = process.env.GROQ_API_KEY;
    if (!GROQ_API_KEY) {
      return res.status(500).json({ message: "GROQ_API_KEY not configured on server" });
    }

    // Build rich context from extracted resume fields
    const cvContext = [
      resumeData.technical_skills && `Technical Skills: ${resumeData.technical_skills}`,
      resumeData.project_details  && `Projects: ${resumeData.project_details}`,
      resumeData.certifications   && `Certifications: ${resumeData.certifications}`,
      resumeData.other_info       && `Other Info: ${resumeData.other_info}`,
    ].filter(Boolean).join("\n");

    const jobContext = [
      jobTitle       && `Job Title: ${jobTitle}`,
      jobDescription && `Job Description: ${jobDescription}`,
    ].filter(Boolean).join("\n");

    const prompt = `You are an expert technical interviewer at a top tech company.

Based on the candidate's CV and the job profile below, generate exactly 10 insightful interview questions with model answers.

Mix behavioral (2-3), technical skill-based (4-5), and project-based (2-3) questions. Make questions specific to the candidate's actual skills and the job requirements.

CV Summary:
${cvContext || "General software engineering background"}

Job Profile:
${jobContext || "Software Engineering role"}

Return ONLY valid JSON in this exact format (no markdown, no extra text):
{
  "questions": [
    {
      "no": 1,
      "type": "Technical",
      "question": "...",
      "answer": "..."
    }
  ]
}`;

    const response = await axios.post(
      "https://api.groq.com/openai/v1/chat/completions",
      {
        model: "llama-3.1-8b-instant",
        messages: [
          {
            role: "system",
            content: "You are an expert interviewer. Return ONLY valid JSON arrays of interview questions and answers. No markdown, no extra text.",
          },
          { role: "user", content: prompt },
        ],
        temperature: 0.6,
        max_tokens: 3000,
        response_format: { type: "json_object" },
      },
      {
        headers: {
          Authorization: `Bearer ${GROQ_API_KEY}`,
          "Content-Type": "application/json",
        },
        timeout: 30000,
      }
    );

    const content = response.data.choices[0].message.content;
    const jsonStr = content.replace(/```json\n?/g, "").replace(/```\n?/g, "").trim();
    const parsed = JSON.parse(jsonStr);

    res.json({ questions: parsed.questions || [] });
  } catch (err) {
    console.error("❌ Interview Q generation error:", err?.response?.data || err.message);
    res.status(500).json({ message: "AI generation failed: " + (err?.response?.data?.error?.message || err.message) });
  }
};
