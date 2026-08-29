const SECTION_KEYWORDS = {
  personal: ["name", "headline", "location", "email", "phone", "contact"],
  professional: ["about", "summary", "objective", "overview", "career"],
  experience: ["experience", "work", "employment", "position", "role", "intern"],
  education: ["education", "university", "college", "degree", "school", "academic"],
  skills: ["skills", "technologies", "tools", "proficiencies", "competencies"],
  projects: ["projects", "portfolio", "github", "work samples"],
  certifications: ["certifications", "certificates", "licenses", "courses"],
  languages: ["languages", "language proficiency"],
  volunteer: ["volunteer", "community", "service"],
  awards: ["awards", "honors", "achievements", "recognition"],
  publications: ["publications", "papers", "articles", "writing"],
};

function createChunks(profileText, sections = {}) {
  const chunks = [];

  if (sections && Object.keys(sections).length > 0) {
    for (const [sectionName, content] of Object.entries(sections)) {
      if (!content || content.trim().length === 0) continue;

      const category = categorizeSection(sectionName);
      const subChunks = splitLongText(content, 600, 100);

      for (const subChunk of subChunks) {
        chunks.push({
          text: subChunk,
          section: category,
          source: "linkedin-public-profile",
        });
      }
    }
  }

  if (chunks.length === 0 && profileText) {
    const categoryChunks = splitByCategory(profileText);
    for (const { category, text } of categoryChunks) {
      const subChunks = splitLongText(text, 600, 100);
      for (const subChunk of subChunks) {
        chunks.push({
          text: subChunk,
          section: category,
          source: "linkedin-public-profile",
        });
      }
    }
  }

  if (chunks.length === 0 && profileText) {
    const subChunks = splitLongText(profileText, 600, 100);
    for (const subChunk of subChunks) {
      chunks.push({
        text: subChunk,
        section: "general",
        source: "linkedin-public-profile",
      });
    }
  }

  return chunks;
}

function categorizeSection(sectionName) {
  const normalized = sectionName.toLowerCase().replace(/[^a-z]/g, "");
  for (const [category, keywords] of Object.entries(SECTION_KEYWORDS)) {
    if (keywords.some((kw) => normalized.includes(kw))) {
      return category;
    }
  }
  return "general";
}

function splitByCategory(text) {
  const results = [];
  const lines = text.split("\n");
  let currentCategory = "general";
  let currentLines = [];

  const knownSections = [
    "NAME", "HEADLINE", "LOCATION", "ABOUT", "SUMMARY",
    "EXPERIENCE", "EDUCATION", "SKILLS", "CERTIFICATIONS",
    "PROJECTS", "PUBLICATIONS", "LANGUAGES", "VOLUNTEER",
    "AWARDS", "INTERESTS",
  ];

  for (const line of lines) {
    const trimmed = line.trim();
    const upper = trimmed.toUpperCase();

    if (knownSections.includes(upper) && trimmed.length < 30) {
      if (currentLines.length > 0) {
        results.push({
          category: currentCategory,
          text: currentLines.join("\n").trim(),
        });
      }
      currentCategory = categorizeSection(upper);
      currentLines = [];
    } else {
      currentLines.push(line);
    }
  }

  if (currentLines.length > 0) {
    results.push({
      category: currentCategory,
      text: currentLines.join("\n").trim(),
    });
  }

  return results.filter((r) => r.text.length > 0);
}

function splitLongText(text, maxChars = 600, overlap = 100) {
  if (text.length <= maxChars) {
    return [text];
  }

  const chunks = [];
  const sentences = text.split(/(?<=[.!?])\s+/);
  let currentChunk = "";

  for (const sentence of sentences) {
    if (currentChunk.length + sentence.length > maxChars && currentChunk.length > 0) {
      chunks.push(currentChunk.trim());
      // Keep overlap from the end of the current chunk
      const overlapText = currentChunk.slice(-overlap).trim();
      currentChunk = overlapText + " " + sentence;
    } else {
      currentChunk += (currentChunk ? " " : "") + sentence;
    }
  }

  if (currentChunk.trim().length > 0) {
    chunks.push(currentChunk.trim());
  }

  return chunks;
}

module.exports = {
  createChunks,
  splitLongText,
  categorizeSection,
  splitByCategory,
  SECTION_KEYWORDS,
};
