/**
 * Profile Analyzer Service
 * Analyzes profile quality and provides actionable suggestions.
 */

const ACTION_VERBS = [
  "led", "managed", "developed", "implemented", "designed", "built", "created",
  "improved", "increased", "reduced", "automated", "optimized", "launched",
  "delivered", "achieved", "resolved", "streamlined", "established", "spearheaded",
  "orchestrated", "conceptualized", "executed", "migrated", "refactored", "deployed",
  "mentored", "collaborated", "coordinated", "facilitated", "negotiated", "presented",
];

const IMPACT_KEYWORDS = [
  "percent", "%", "million", "billion", "k", "increased", "reduced", "improved",
  "saved", "generated", "revenue", "growth", "efficiency", "performance",
  "users", "customers", "clients", "team", "projects", "cost",
];

const TECH_SKILLS = [
  "javascript", "python", "java", "c++", "c#", "go", "rust", "ruby", "php", "swift",
  "react", "angular", "vue", "node.js", "express", "django", "flask", "spring",
  "html", "css", "sass", "tailwind", "bootstrap",
  "mysql", "postgresql", "mongodb", "redis", "elasticsearch", "dynamodb",
  "aws", "azure", "gcp", "docker", "kubernetes", "jenkins", "ci/cd",
  "git", "github", "gitlab", "bitbucket",
  "machine learning", "deep learning", "nlp", "tensorflow", "pytorch", "opencv",
  "rest", "graphql", "grpc", "websocket",
  "typescript", "javascript", "es6", "jsx", "tsx",
  "figma", "sketch", "adobe xd",
  "jira", "confluence", "notion", "slack",
];

function analyzeHeadline(headline, preferredRoles) {
  const score = { max: 15, earned: 0, feedback: [], suggestions: [] };

  if (!headline || headline.trim().length === 0) {
    score.feedback.push("No headline added");
    score.suggestions.push("Add a headline like 'Full-Stack Developer | React & Node.js | Open to Opportunities'");
    return score;
  }

  const h = headline.toLowerCase().trim();

  // Length check
  if (headline.length < 10) {
    score.feedback.push("Headline too short");
    score.suggestions.push("Make your headline more descriptive (aim for 40-60 characters)");
  } else if (headline.length <= 80) {
    score.earned += 3;
  } else {
    score.earned += 2;
    score.feedback.push("Headline is a bit long");
    score.suggestions.push("Keep headline under 80 characters for better readability");
  }

  // Contains role/title
  if (h.includes("developer") || h.includes("engineer") || h.includes("designer") ||
      h.includes("manager") || h.includes("analyst") || h.includes("architect") ||
      h.includes("lead") || h.includes("senior") || h.includes("junior") ||
      h.includes("intern") || h.includes("fresher") || h.includes("student")) {
    score.earned += 4;
  } else {
    score.suggestions.push("Include your job title (e.g., 'Software Engineer', 'Data Analyst')");
  }

  // Contains tech/skills
  const hasTech = TECH_SKILLS.some(skill => h.includes(skill.toLowerCase()));
  if (hasTech) {
    score.earned += 4;
  } else {
    score.suggestions.push("Add key technologies you work with (e.g., 'React, Node.js, MongoDB')");
  }

  // Contains separator (| or -)
  if (h.includes("|") || h.includes("-") || h.includes("•")) {
    score.earned += 2;
  } else {
    score.suggestions.push("Use separators like '|' to organize your headline (e.g., 'Role | Skills | Goal')");
  }

  // Contains goal/opportunity
  if (h.includes("open to") || h.includes("seeking") || h.includes("looking") || h.includes("available")) {
    score.earned += 2;
  }

  return score;
}

function analyzeAbout(about) {
  const score = { max: 15, earned: 0, feedback: [], suggestions: [] };

  if (!about || about.trim().length === 0) {
    score.feedback.push("No about section added");
    score.suggestions.push("Write a 2-3 line summary about your skills, experience, and career goals");
    return score;
  }

  const words = about.trim().split(/\s+/);
  const wordCount = words.length;

  // Length check
  if (wordCount < 10) {
    score.feedback.push("About section is too short");
    score.suggestions.push("Write at least 30-50 words to make a good impression");
  } else if (wordCount >= 30 && wordCount <= 200) {
    score.earned += 5;
  } else if (wordCount > 200) {
    score.earned += 3;
    score.feedback.push("About section is quite long");
    score.suggestions.push("Keep it concise — 50-150 words is ideal");
  } else {
    score.earned += 2;
  }

  // Professional tone
  const lower = about.toLowerCase();
  if (lower.includes("i am") || lower.includes("i'm") || lower.includes("passionate") ||
      lower.includes("experienced") || lower.includes("skilled") || lower.includes("dedicated")) {
    score.earned += 3;
  } else {
    score.suggestions.push("Start with professional phrasing like 'Experienced developer' or 'Passionate about...'");
  }

  // Contains skills/tech
  const techMentions = TECH_SKILLS.filter(skill => lower.includes(skill.toLowerCase()));
  if (techMentions.length >= 2) {
    score.earned += 4;
  } else if (techMentions.length === 1) {
    score.earned += 2;
    score.suggestions.push("Mention more relevant technologies in your about section");
  } else {
    score.suggestions.push("Include key technologies and skills in your about section");
  }

  // Contains contact/action
  if (lower.includes("contact") || lower.includes("email") || lower.includes("linkedin") ||
      lower.includes("open to") || lower.includes("opportunity")) {
    score.earned += 3;
  }

  return score;
}

function analyzeExperience(experiences) {
  const score = { max: 20, earned: 0, feedback: [], suggestions: [] };

  if (!experiences || experiences.length === 0) {
    score.feedback.push("No experience added");
    score.suggestions.push("Add internships, part-time work, freelancing, or volunteer experience");
    return score;
  }

  // Has experience
  score.earned += 4;

  // Check for achievements vs responsibilities
  let hasAchievements = false;
  let hasMetrics = false;

  for (const exp of experiences) {
    const desc = (exp.description || "").toLowerCase();

    // Check for action verbs
    const hasActionVerbs = ACTION_VERBS.some(v => desc.includes(v));
    if (hasActionVerbs) hasAchievements = true;

    // Check for metrics/impact
    const hasMetricsInDesc = IMPACT_KEYWORDS.some(k => desc.includes(k));
    if (hasMetricsInDesc) hasMetrics = true;
  }

  if (hasAchievements) {
    score.earned += 6;
  } else {
    score.suggestions.push("Start descriptions with action verbs (Led, Built, Improved, Increased)");
  }

  if (hasMetrics) {
    score.earned += 6;
  } else {
    score.suggestions.push("Add quantifiable achievements (e.g., 'Increased performance by 40%', 'Saved 20 hours/week')");
  }

  // Has multiple roles
  if (experiences.length >= 2) {
    score.earned += 2;
  } else if (experiences.length === 1) {
    score.suggestions.push("Consider adding more roles (internships, freelance, volunteer)");
  }

  // Check descriptions are filled
  const hasDescriptions = experiences.some(e => e.description && e.description.trim().length > 20);
  if (hasDescriptions) {
    score.earned += 2;
  } else {
    score.suggestions.push("Add detailed descriptions to your experience (minimum 20 characters each)");
  }

  return score;
}

function analyzeSkills(skills, preferredRoles) {
  const score = { max: 10, earned: 0, feedback: [], suggestions: [] };

  if (!skills || skills.length === 0) {
    score.feedback.push("No skills added");
    score.suggestions.push("Add at least 5-10 relevant skills for your target role");
    return score;
  }

  // Basic count
  if (skills.length >= 5) {
    score.earned += 3;
  } else if (skills.length >= 3) {
    score.earned += 2;
    score.suggestions.push("Add more skills (aim for 5-10)");
  } else {
    score.earned += 1;
    score.suggestions.push("Add at least 5 skills to improve profile visibility");
  }

  // Tech skills count
  const techCount = skills.filter(s => TECH_SKILLS.includes(s.toLowerCase())).length;
  if (techCount >= 3) {
    score.earned += 4;
  } else if (techCount >= 1) {
    score.earned += 2;
    score.suggestions.push("Add more technical skills (programming languages, tools, frameworks)");
  } else {
    score.suggestions.push("Include technical skills like programming languages, frameworks, tools");
  }

  // Skill diversity
  if (skills.length >= 8) {
    score.earned += 3;
  } else if (skills.length >= 5) {
    score.earned += 1;
  }

  return score;
}

function analyzeEducation(education) {
  const score = { max: 10, earned: 0, feedback: [], suggestions: [] };

  if (!education || education.length === 0) {
    score.feedback.push("No education added");
    score.suggestions.push("Add your educational background");
    return score;
  }

  score.earned += 4;

  // Has degree
  const hasDegree = education.some(e => e.degree && e.degree.trim().length > 0);
  if (hasDegree) {
    score.earned += 2;
  } else {
    score.suggestions.push("Add your degree (e.g., B.Tech, BCA, M.Sc)");
  }

  // Has field of study
  const hasField = education.some(e => e.fieldOfStudy && e.fieldOfStudy.trim().length > 0);
  if (hasField) {
    score.earned += 2;
  } else {
    score.suggestions.push("Add your field of study (e.g., Computer Science)");
  }

  // Has CGPA/grade
  const hasCgpa = education.some(e => e.cgpa && e.cgpa.trim().length > 0);
  if (hasCgpa) {
    score.earned += 2;
  } else {
    score.suggestions.push("Add your CGPA/percentage if above 7.0 or 70%");
  }

  return score;
}

function analyzeProjects(projects) {
  const score = { max: 10, earned: 0, feedback: [], suggestions: [] };

  if (!projects || projects.length === 0) {
    score.feedback.push("No projects added");
    score.suggestions.push("Add 2-3 key projects with descriptions and tech stack");
    return score;
  }

  // Has projects
  if (projects.length >= 2) {
    score.earned += 3;
  } else {
    score.earned += 1;
    score.suggestions.push("Add at least 2-3 projects to showcase your work");
  }

  // Has descriptions
  const hasDescriptions = projects.filter(p => p.description && p.description.trim().length > 20).length;
  if (hasDescriptions >= 2) {
    score.earned += 3;
  } else if (hasDescriptions >= 1) {
    score.earned += 1;
    score.suggestions.push("Add detailed descriptions to your projects");
  } else {
    score.suggestions.push("Write descriptions for your projects explaining what they do");
  }

  // Has tech stack
  const hasTechStack = projects.filter(p => p.techStack && p.techStack.trim().length > 0).length;
  if (hasTechStack >= 2) {
    score.earned += 2;
  } else if (hasTechStack >= 1) {
    score.earned += 1;
    score.suggestions.push("Add tech stack to your projects");
  } else {
    score.suggestions.push("Mention technologies used in each project");
  }

  // Has links
  const hasLinks = projects.filter(p => p.link && p.link.trim().length > 0).length;
  if (hasLinks >= 1) {
    score.earned += 2;
  } else {
    score.suggestions.push("Add GitHub/live demo links to your projects");
  }

  return score;
}

function analyzeCertifications(certifications) {
  const score = { max: 5, earned: 0, feedback: [], suggestions: [] };

  if (!certifications || certifications.length === 0) {
    score.feedback.push("No certifications added");
    score.suggestions.push("Add relevant certifications to boost credibility");
    return score;
  }

  if (certifications.length >= 2) {
    score.earned += 3;
  } else {
    score.earned += 1;
  }

  // Has issuer
  const hasIssuer = certifications.some(c => c.issuer && c.issuer.trim().length > 0);
  if (hasIssuer) {
    score.earned += 1;
  }

  // Has URL
  const hasUrl = certifications.some(c => c.url && c.url.trim().length > 0);
  if (hasUrl) {
    score.earned += 1;
  } else {
    score.suggestions.push("Add certificate verification URLs");
  }

  return score;
}

function analyzeConsistency(profile) {
  const score = { max: 15, earned: 0, feedback: [], suggestions: [] };

  const hasHeadline = profile.headline && profile.headline.trim().length > 0;
  const hasAbout = profile.about && profile.about.trim().length > 0;
  const hasExperience = profile.experiences && profile.experiences.length > 0;
  const hasEducation = profile.education && profile.education.length > 0;
  const hasSkills = profile.skills && profile.skills.length > 0;

  // All sections present
  const filledCount = [hasHeadline, hasAbout, hasExperience, hasEducation, hasSkills].filter(Boolean).length;
  score.earned += Math.floor((filledCount / 5) * 6);

  // Skills match headline
  if (hasHeadline && hasSkills) {
    const headlineLower = profile.headline.toLowerCase();
    const skillMatch = profile.skills.some(s => headlineLower.includes(s.toLowerCase()));
    if (skillMatch) {
      score.earned += 3;
    } else {
      score.suggestions.push("Ensure your skills match what's mentioned in your headline");
    }
  }

  // Experience matches education field
  if (hasExperience && hasEducation) {
    score.earned += 3;
  } else if (!hasExperience) {
    score.suggestions.push("Add experience to show career progression");
  }

  // Overall professional presence
  if (hasHeadline && hasAbout && hasExperience && hasEducation && hasSkills) {
    score.earned += 3;
  } else {
    const missing = [];
    if (!hasHeadline) missing.push("headline");
    if (!hasAbout) missing.push("about");
    if (!hasExperience) missing.push("experience");
    if (!hasEducation) missing.push("education");
    if (!hasSkills) missing.push("skills");
    score.suggestions.push(`Complete missing sections: ${missing.join(", ")}`);
  }

  return score;
}

function analyzeProfile(profile) {
  const sections = {
    completeness: analyzeCompleteness(profile),
    headline: analyzeHeadline(profile.headline, profile.preferredRoles),
    about: analyzeAbout(profile.about),
    experience: analyzeExperience(profile.experiences),
    skills: analyzeSkills(profile.skills, profile.preferredRoles),
    education: analyzeEducation(profile.education),
    projects: analyzeProjects(profile.projects),
    certifications: analyzeCertifications(profile.certifications),
    consistency: analyzeConsistency(profile),
  };

  // Calculate total score
  const totalMax = Object.values(sections).reduce((sum, s) => sum + s.max, 0);
  const totalEarned = Object.values(sections).reduce((sum, s) => sum + s.earned, 0);
  const overallScore = Math.round((totalEarned / totalMax) * 100);

  // Collect all suggestions
  const allSuggestions = [];
  for (const [key, section] of Object.entries(sections)) {
    for (const suggestion of section.suggestions) {
      allSuggestions.push({ category: key, text: suggestion });
    }
  }

  // Determine grade
  let grade, gradeColor;
  if (overallScore >= 90) { grade = "Excellent"; gradeColor = "#4ade80"; }
  else if (overallScore >= 75) { grade = "Strong"; gradeColor = "#22c55e"; }
  else if (overallScore >= 60) { grade = "Good"; gradeColor = "#fbbf24"; }
  else if (overallScore >= 40) { grade = "Needs Work"; gradeColor = "#f97316"; }
  else { grade = "Incomplete"; gradeColor = "#ef4444"; }

  return {
    score: overallScore,
    grade,
    gradeColor,
    sections: {
      completeness: { ...sections.completeness, label: "Profile Completeness" },
      headline: { ...sections.headline, label: "Headline Quality" },
      about: { ...sections.about, label: "About Section" },
      experience: { ...sections.experience, label: "Experience" },
      skills: { ...sections.skills, label: "Skills" },
      education: { ...sections.education, label: "Education" },
      projects: { ...sections.projects, label: "Projects" },
      certifications: { ...sections.certifications, label: "Certifications" },
      consistency: { ...sections.consistency, label: "Career Consistency" },
    },
    suggestions: allSuggestions.slice(0, 8), // Top 8 suggestions
  };
}

function analyzeCompleteness(profile) {
  const score = { max: 10, earned: 0, feedback: [], suggestions: [] };

  const checks = [
    { key: "photo", label: "Profile Photo", done: !!profile.photo },
    { key: "headline", label: "Headline", done: !!profile.headline },
    { key: "about", label: "About Section", done: !!profile.about },
    { key: "location", label: "Location", done: !!profile.location },
    { key: "phone", label: "Phone", done: !!profile.phone },
    { key: "experiences", label: "Experience", done: profile.experiences?.length > 0 },
    { key: "education", label: "Education", done: profile.education?.length > 0 },
    { key: "skills", label: "Skills (3+)", done: profile.skills?.length >= 3 },
    { key: "certifications", label: "Certifications", done: profile.certifications?.length > 0 },
    { key: "projects", label: "Projects", done: profile.projects?.length > 0 },
  ];

  const doneCount = checks.filter(c => c.done).length;
  score.earned = Math.round((doneCount / checks.length) * 10);

  for (const check of checks) {
    if (!check.done) {
      score.suggestions.push(`Add ${check.label}`);
    }
  }

  return score;
}

module.exports = { analyzeProfile };
