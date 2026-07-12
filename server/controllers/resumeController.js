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
    if (req.user.role !== "Student") {
      return res.status(403).json({ message: "Only students can upload CV" });
    }

    if (!req.file) {
      return res.status(400).json({ message: "No file uploaded" });
    }

    const studentId = req.user.id;
    const filePath = req.file.path;
    const fileName = req.file.originalname;

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
    const resume = await Resume.findOne({ student: studentId }).sort({ createdAt: -1 });
    if (!resume) return res.status(404).json({ message: "No resume found for this student" });
    res.json(resume);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};
