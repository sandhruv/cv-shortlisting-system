function cleanLinkedInText(rawText) {
  if (!rawText || typeof rawText !== "string") return "";

  let text = rawText;

  text = removeBoilerplate(text);
  text = removeNavigation(text);
  text = normalizeWhitespace(text);
  text = removeDuplicateText(text);
  text = removeIrrelevantPatterns(text);

  return text.trim();
}

function removeBoilerplate(text) {
  const boilerplatePatterns = [
    /linkedin\.com/gi,
    /connect with/gi,
    /people also viewed/gi,
    /people you may know/gi,
    /sign\s*in/gi,
    /join now/gi,
    /learn more/gi,
    /cookie.*policy/gi,
    /privacy.*policy/gi,
    /terms.*(?:of|and).*(?:use|service|condition)/gi,
    /©\s*\d{4}/g,
    /all rights reserved/gi,
    / advertisement /gi,
    /promoted/gi,
    /sponsored/gi,
  ];

  for (const pattern of boilerplatePatterns) {
    text = text.replace(pattern, "");
  }

  return text;
}

function removeNavigation(text) {
  const navPatterns = [
    /^.*(?:Home|My Network|Jobs|Messaging|Notifications|Me)\s*$/gm,
    /^.*(?:Search|Discover|Post|Articles)\s*$/gm,
    /^.*(?:Settings|Privacy|Help Center|Language)\s*$/gm,
  ];

  for (const pattern of navPatterns) {
    text = text.replace(pattern, "");
  }

  return text;
}

function normalizeWhitespace(text) {
  text = text.replace(/\t+/g, " ");
  text = text.replace(/ {3,}/g, "  ");
  text = text.replace(/\n{3,}/g, "\n\n");
  text = text.replace(/^\s+|\s+$/gm, "");
  return text;
}

function removeDuplicateText(text) {
  const lines = text.split("\n");
  const seen = new Set();
  const unique = [];

  for (const line of lines) {
    const normalized = line.trim().toLowerCase();
    if (normalized.length === 0) {
      unique.push(line);
      continue;
    }
    if (!seen.has(normalized)) {
      seen.add(normalized);
      unique.push(line);
    }
  }

  return unique.join("\n");
}

function removeIrrelevantPatterns(text) {
  const irrelevantPatterns = [
    /\b\d{5,}\b/g, // Long numbers (IDs, etc.)
    /\b(?:https?|ftp):\/\/\S+/g, // URLs
    /\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b/g, // Emails (handled separately if needed)
    /[{}<>[\]]/g, // Brackets
    /\b(?:div|span|class|id|href|src|alt|img|button|input|form)\b/gi, // HTML tags remnants
  ];

  for (const pattern of irrelevantPatterns) {
    text = text.replace(pattern, "");
  }

  return text;
}

function extractSections(text) {
  const sectionHeaders = [
    "NAME", "HEADLINE", "LOCATION", "ABOUT", "SUMMARY",
    "EXPERIENCE", "EDUCATION", "SKILLS", "CERTIFICATIONS",
    "PROJECTS", "PUBLICATIONS", "LANGUAGES", "VOLUNTEER",
    "AWARDS", "HONORS", "INTERESTS", "ACTIVITIES",
  ];

  const sections = {};
  const lines = text.split("\n");
  let currentSection = "GENERAL";
  let currentContent = [];

  for (const line of lines) {
    const trimmed = line.trim();
    const upperLine = trimmed.toUpperCase();

    if (sectionHeaders.includes(upperLine) && trimmed.length < 30) {
      if (currentContent.length > 0) {
        sections[currentSection] = currentContent.join("\n").trim();
      }
      currentSection = upperLine;
      currentContent = [];
    } else {
      currentContent.push(line);
    }
  }

  if (currentContent.length > 0) {
    sections[currentSection] = currentContent.join("\n").trim();
  }

  return sections;
}

module.exports = {
  cleanLinkedInText,
  normalizeWhitespace,
  removeDuplicateText,
  removeNavigation,
  removeBoilerplate,
  extractSections,
};
