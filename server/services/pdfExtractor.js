const fs = require("fs");
const pdfParse = require("pdf-parse");
const { cleanLinkedInText, extractSections } = require("./textCleaner");

async function extractTextFromPDF(filePath) {
  if (!fs.existsSync(filePath)) {
    throw new Error("PDF file not found");
  }

  const dataBuffer = fs.readFileSync(filePath);
  const parser = pdfParse.default || pdfParse;
  const pdfData = await parser(dataBuffer);

  if (!pdfData.text || pdfData.text.trim().length < 10) {
    throw new Error("PDF appears empty or contains no extractable text");
  }

  return pdfData.text;
}

function parseLinkedInPDF(rawText) {
  const cleaned = cleanLinkedInText(rawText);
  const sections = extractSections(cleaned);

  const profile = {
    name: "",
    headline: "",
    location: "",
    about: "",
    experience: [],
    education: [],
    skills: [],
  };

  // Extract name (usually the first line or under NAME section)
  if (sections.NAME) {
    profile.name = sections.NAME.split("\n")[0].trim();
  }

  // Extract headline
  if (sections.HEADLINE) {
    profile.headline = sections.HEADLINE.split("\n")[0].trim();
  }

  // Extract location
  if (sections.LOCATION) {
    profile.location = sections.LOCATION.split("\n")[0].trim();
  }

  // Extract about
  if (sections.ABOUT || sections.SUMMARY) {
    profile.about = (sections.ABOUT || sections.SUMMARY).trim();
  }

  // Extract experience
  if (sections.EXPERIENCE) {
    profile.experience = parseExperienceSection(sections.EXPERIENCE);
  }

  // Extract education
  if (sections.EDUCATION) {
    profile.education = parseEducationSection(sections.EDUCATION);
  }

  // Extract skills
  if (sections.SKILLS) {
    profile.skills = sections.SKILLS.split("\n")
      .map((s) => s.trim())
      .filter((s) => s.length > 0 && s.length < 100);
  }

  // Build raw text for RAG pipeline
  profile.rawText = buildProfileText(profile);

  return profile;
}

function parseExperienceSection(text) {
  const experiences = [];
  const blocks = text.split(/\n(?=[A-Z])/);

  for (const block of blocks) {
    const lines = block.split("\n").map((l) => l.trim()).filter(Boolean);
    if (lines.length === 0) continue;

    const exp = {
      title: "",
      company: "",
      location: "",
      startDate: "",
      endDate: "",
      description: "",
    };

    // First line is usually the title
    if (lines.length > 0) exp.title = lines[0];
    // Second line is usually the company
    if (lines.length > 1) exp.company = lines[1].replace(/\s*·\s*.*/, "");
    // Look for date patterns
    for (const line of lines) {
      const dateMatch = line.match(
        /([A-Za-z]+\s+\d{4}|\d{4})\s*[-–]\s*([A-Za-z]+\s+\d{4}|\d{4}|Present|Current)/i
      );
      if (dateMatch) {
        exp.startDate = dateMatch[1];
        exp.endDate = dateMatch[2];
        break;
      }
    }
    // Remaining lines are description
    const descLines = lines.filter(
      (l) =>
        l !== exp.title &&
        l !== exp.company &&
        !l.match(/\d{4}\s*[-–]\s*(Present|Current|\d{4})/i)
    );
    if (descLines.length > 0) exp.description = descLines.join(" ");

    if (exp.title || exp.company) experiences.push(exp);
  }

  return experiences;
}

function parseEducationSection(text) {
  const educations = [];
  const blocks = text.split(/\n(?=[A-Z])/);

  for (const block of blocks) {
    const lines = block.split("\n").map((l) => l.trim()).filter(Boolean);
    if (lines.length === 0) continue;

    const edu = {
      school: "",
      degree: "",
      fieldOfStudy: "",
      startYear: "",
      endYear: "",
      cgpa: "",
    };

    if (lines.length > 0) edu.school = lines[0];
    if (lines.length > 1) edu.degree = lines[1];

    // Look for year patterns
    for (const line of lines) {
      const yearMatch = line.match(/(20\d{2})\s*[-–]\s*(20\d{2}|Present)/i);
      if (yearMatch) {
        edu.startYear = yearMatch[1];
        edu.endYear = yearMatch[2];
        break;
      }
    }

    // Look for CGPA
    for (const line of lines) {
      const cgpaMatch = line.match(/(?:CGPA|GPA|Grade|Score)[:\s]*(\d+\.?\d*)/i);
      if (cgpaMatch) {
        edu.cgpa = cgpaMatch[1];
        break;
      }
    }

    if (edu.school) educations.push(edu);
  }

  return educations;
}

function buildProfileText(profile) {
  const lines = [];
  if (profile.name) lines.push("NAME", profile.name, "");
  if (profile.headline) lines.push("HEADLINE", profile.headline, "");
  if (profile.location) lines.push("LOCATION", profile.location, "");
  if (profile.about) lines.push("ABOUT", profile.about, "");

  if (profile.experience.length > 0) {
    lines.push("EXPERIENCE");
    for (const exp of profile.experience) {
      if (exp.title) lines.push(exp.title);
      if (exp.company) lines.push(exp.company);
      if (exp.startDate || exp.endDate) lines.push(`${exp.startDate} - ${exp.endDate}`);
      if (exp.description) lines.push(exp.description);
      lines.push("");
    }
  }

  if (profile.education.length > 0) {
    lines.push("EDUCATION");
    for (const edu of profile.education) {
      if (edu.school) lines.push(edu.school);
      if (edu.degree) lines.push(edu.degree);
      if (edu.fieldOfStudy) lines.push(edu.fieldOfStudy);
      if (edu.startYear || edu.endYear) lines.push(`${edu.startYear} - ${edu.endYear}`);
      lines.push("");
    }
  }

  if (profile.skills.length > 0) {
    lines.push("SKILLS");
    for (const skill of profile.skills) lines.push(skill);
    lines.push("");
  }

  return lines.join("\n").trim();
}

module.exports = {
  extractTextFromPDF,
  parseLinkedInPDF,
  parseExperienceSection,
  parseEducationSection,
};
