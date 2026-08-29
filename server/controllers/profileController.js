const Profile = require("../models/Profile");
const User = require("../models/User");
const fs = require("fs");
const path = require("path");
const { scrapeLinkedInProfile, openLoginBrowser, hasActiveSession, clearSession } = require("../services/linkedinScraper");
const { cleanLinkedInText, extractSections } = require("../services/textCleaner");
const { createChunks } = require("../services/chunker");
const EmbeddingService = require("../services/embeddingService");
const { retrieveAllCategories, buildContextFromResults } = require("../services/retriever");
const { extractProfile } = require("../services/groqProfileExtractor");
const { validateLinkedInUrl, validateProfileExtraction, repairProfileData } = require("../validators/profileSchema");
const { analyzeProfile } = require("../services/profileAnalyzer");
const { extractTextFromPDF, parseLinkedInPDF } = require("../services/pdfExtractor");

exports.getMyProfile = async (req, res) => {
  try {
    let profile = await Profile.findOne({ user: req.user.id }).populate("user", "name email uid role");
    if (!profile) {
      profile = await Profile.create({ user: req.user.id });
    }
    res.json(profile);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

exports.getProfileById = async (req, res) => {
  try {
    const profile = await Profile.findOne({ user: req.params.userId }).populate("user", "name email uid role");
    if (!profile) return res.status(404).json({ message: "Profile not found" });
    res.json(profile);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

exports.updateProfile = async (req, res) => {
  try {
    const allowed = ["headline", "about", "location", "phone", "website", "experiences", "education", "skills", "certifications", "projects", "isOpenToWork", "preferredRoles", "preferredLocations"];
    const updates = {};
    for (const key of allowed) {
      if (req.body[key] !== undefined) updates[key] = req.body[key];
    }
    // Deduplicate skills (case-insensitive)
    if (updates.skills && Array.isArray(updates.skills)) {
      const seen = new Set();
      updates.skills = updates.skills.filter(s => {
        const lower = (s || "").toLowerCase().trim();
        if (!lower || seen.has(lower)) return false;
        seen.add(lower);
        return true;
      });
    }
    const profile = await Profile.findOneAndUpdate({ user: req.user.id }, updates, { new: true, upsert: true, runValidators: true }).populate("user", "name email uid role");
    res.json(profile);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

exports.uploadPhoto = async (req, res) => {
  try {
    if (!req.file) return res.status(400).json({ message: "No file uploaded" });
    const photoUrl = `/uploads/profiles/${req.file.filename}`;
    const profile = await Profile.findOneAndUpdate({ user: req.user.id }, { photo: photoUrl }, { new: true, upsert: true }).populate("user", "name email uid role");
    res.json(profile);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

exports.uploadCoverPhoto = async (req, res) => {
  try {
    if (!req.file) return res.status(400).json({ message: "No file uploaded" });
    const coverUrl = `/uploads/profiles/${req.file.filename}`;
    const profile = await Profile.findOneAndUpdate({ user: req.user.id }, { coverPhoto: coverUrl }, { new: true, upsert: true }).populate("user", "name email uid role");
    res.json(profile);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

exports.trackProfileView = async (req, res) => {
  try {
    const { userId } = req.params;
    if (userId === req.user.id) return res.json({ ok: true });
    const profile = await Profile.findOne({ user: userId });
    if (profile) {
      const alreadyViewed = profile.profileViews.some((v) => v.viewer.toString() === req.user.id);
      if (!alreadyViewed) {
        profile.profileViews.push({ viewer: req.user.id });
        await profile.save();
      }
    }
    res.json({ ok: true });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

exports.getProfileCompletion = async (req, res) => {
  try {
    const profile = await Profile.findOne({ user: req.user.id });
    if (!profile) return res.json({ score: 0, sections: {} });
    const sections = {
      photo: Boolean(profile.photo),
      headline: Boolean(profile.headline),
      about: Boolean(profile.about),
      location: Boolean(profile.location),
      phone: Boolean(profile.phone),
      experiences: (profile.experiences || []).length > 0,
      education: (profile.education || []).length > 0,
      skills: (profile.skills || []).length >= 3,
      certifications: (profile.certifications || []).length > 0,
      projects: (profile.projects || []).length > 0,
    };
    const total = Object.keys(sections).length;
    const done = Object.values(sections).filter(Boolean).length;
    const score = Math.round((done / total) * 100);
    res.json({ score, sections });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// ── LinkedIn Profile Import via Public URL ───────────────────────────────────
exports.importLinkedIn = async (req, res) => {
  try {
    const { linkedinUrl } = req.body;

    // Validate URL
    const validation = validateLinkedInUrl({ linkedinUrl });
    if (!validation.success) {
      return res.status(400).json({
        success: false,
        message: validation.error.issues?.[0]?.message || "Invalid LinkedIn URL",
      });
    }

    // Step 1: Fetch and parse public profile
    const scrapeResult = await scrapeLinkedInProfile(linkedinUrl);
    if (!scrapeResult.success) {
      return res.status(422).json({
        success: false,
        message: scrapeResult.error,
        fallback: "pdf_upload",
      });
    }

    // Step 2: Clean extracted text
    const cleanedText = cleanLinkedInText(scrapeResult.profile.rawText);

    // Step 3: Extract sections
    const sections = extractSections(cleanedText);

    // Step 4: Create chunks
    const chunks = createChunks(cleanedText, sections);
    if (chunks.length === 0) {
      return res.status(422).json({
        success: false,
        message: "Could not extract meaningful content from the profile.",
        fallback: "pdf_upload",
      });
    }

    // Step 5: Generate embeddings
    const embeddingService = new EmbeddingService();
    const chunkTexts = chunks.map((c) => c.text);
    const embeddings = embeddingService.fitTransform(chunkTexts);

    // Step 6: Semantic retrieval per category
    const retrievalResults = retrieveAllCategories(chunks, embeddings, embeddingService);

    // Step 7: Build context for Groq
    const context = buildContextFromResults(retrievalResults);
    const fullContext = Object.values(context).join("\n\n---\n\n");

    // Step 8: Extract structured profile with Groq
    let extractedProfile;
    try {
      extractedProfile = await extractProfile(fullContext);
    } catch (err) {
      console.error("Groq extraction failed:", err.message);
      return res.status(500).json({
        success: false,
        message: "AI extraction failed. Please try again or use PDF upload.",
        fallback: "pdf_upload",
      });
    }

    // Step 9: Validate extracted data
    let validatedProfile;
    const validationResult = validateProfileExtraction(extractedProfile);
    if (validationResult.success) {
      validatedProfile = validationResult.data;
    } else {
      // Attempt repair
      validatedProfile = repairProfileData(extractedProfile);
    }

    // Ensure LinkedIn URL is set
    if (!validatedProfile.personal.linkedinUrl) {
      validatedProfile.personal.linkedinUrl = linkedinUrl;
    }

    // Step 10: Map to existing Profile schema format
    const profileData = mapToProfileSchema(validatedProfile);

    // Step 11: Save to MongoDB
    const profile = await Profile.findOneAndUpdate(
      { user: req.user.id },
      { ...profileData, profileSource: "linkedin-public", importedAt: new Date() },
      { new: true, upsert: true, runValidators: true }
    ).populate("user", "name email uid role");

    res.json({
      success: true,
      profile: validatedProfile,
      mongoProfile: profile,
    });
  } catch (err) {
    console.error("LinkedIn import error:", err.message);
    res.status(500).json({
      success: false,
      message: "An unexpected error occurred during import.",
      fallback: "pdf_upload",
    });
  }
};

// ── LinkedIn Profile Import via PDF Upload ───────────────────────────────────
exports.importLinkedInPDF = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: "No PDF file uploaded",
      });
    }

    const filePath = req.file.path;

    // Step 1: Extract text from PDF
    let rawText;
    try {
      rawText = await extractTextFromPDF(filePath);
    } catch (err) {
      fs.unlinkSync(filePath);
      return res.status(400).json({
        success: false,
        message: "Could not extract text from PDF: " + err.message,
      });
    }

    // Step 2: Parse LinkedIn PDF format
    const profile = parseLinkedInPDF(rawText);

    // Step 3: Clean text
    const cleanedText = cleanLinkedInText(profile.rawText);

    // Step 4: Extract sections and chunk
    const sections = extractSections(cleanedText);
    const chunks = createChunks(cleanedText, sections);

    // Step 5: Generate embeddings
    const embeddingService = new EmbeddingService();
    const chunkTexts = chunks.map((c) => c.text);
    const embeddings = embeddingService.fitTransform(chunkTexts);

    // Step 6: Semantic retrieval
    const retrievalResults = retrieveAllCategories(chunks, embeddings, embeddingService);
    const context = buildContextFromResults(retrievalResults);
    const fullContext = Object.values(context).join("\n\n---\n\n");

    // Step 7: Extract with Groq
    let extractedProfile;
    try {
      extractedProfile = await extractProfile(fullContext);
    } catch (err) {
      fs.unlinkSync(filePath);
      return res.status(500).json({
        success: false,
        message: "AI extraction failed: " + err.message,
      });
    }

    // Step 8: Validate
    let validatedProfile;
    const validationResult = validateProfileExtraction(extractedProfile);
    if (validationResult.success) {
      validatedProfile = validationResult.data;
    } else {
      validatedProfile = repairProfileData(extractedProfile);
    }

    // Step 9: Map and save
    const profileData = mapToProfileSchema(validatedProfile);
    const savedProfile = await Profile.findOneAndUpdate(
      { user: req.user.id },
      { ...profileData, profileSource: "linkedin-pdf", importedAt: new Date() },
      { new: true, upsert: true, runValidators: true }
    ).populate("user", "name email uid role");

    // Cleanup uploaded file
    fs.unlinkSync(filePath);

    res.json({
      success: true,
      profile: validatedProfile,
      mongoProfile: savedProfile,
    });
  } catch (err) {
    console.error("LinkedIn PDF import error:", err.message);
    if (req.file && fs.existsSync(req.file.path)) {
      fs.unlinkSync(req.file.path);
    }
    res.status(500).json({
      success: false,
      message: "An unexpected error occurred during PDF import.",
    });
  }
};

// ── LinkedIn Profile Import via Pasted Text ──────────────────────────────────
exports.importLinkedInText = async (req, res) => {
  try {
    const { profileText } = req.body;

    if (!profileText || typeof profileText !== "string" || profileText.trim().length < 20) {
      return res.status(400).json({
        success: false,
        message: "Please paste your LinkedIn profile text (at least 20 characters).",
      });
    }

    if (profileText.length > 20000) {
      return res.status(400).json({
        success: false,
        message: "Profile text is too long. Maximum 20,000 characters allowed.",
      });
    }

    const cleanedText = cleanLinkedInText(profileText);
    const sections = extractSections(cleanedText);
    const chunks = createChunks(cleanedText, sections);

    if (chunks.length === 0) {
      return res.status(422).json({
        success: false,
        message: "Could not extract meaningful sections from the pasted text.",
      });
    }

    const embeddingService = new EmbeddingService();
    const chunkTexts = chunks.map((c) => c.text);
    const embeddings = embeddingService.fitTransform(chunkTexts);

    const retrievalResults = retrieveAllCategories(chunks, embeddings, embeddingService);
    const context = buildContextFromResults(retrievalResults);
    const fullContext = Object.values(context).join("\n\n---\n\n");

    let extractedProfile;
    try {
      extractedProfile = await extractProfile(fullContext);
    } catch (err) {
      console.error("Groq extraction failed:", err.message);
      return res.status(500).json({
        success: false,
        message: "AI extraction failed. Please try again.",
      });
    }

    let validatedProfile;
    const validationResult = validateProfileExtraction(extractedProfile);
    if (validationResult.success) {
      validatedProfile = validationResult.data;
    } else {
      validatedProfile = repairProfileData(extractedProfile);
    }

    const profileData = mapToProfileSchema(validatedProfile);
    const savedProfile = await Profile.findOneAndUpdate(
      { user: req.user.id },
      { ...profileData, profileSource: "linkedin-text", importedAt: new Date() },
      { new: true, upsert: true, runValidators: true }
    ).populate("user", "name email uid role");

    res.json({
      success: true,
      profile: validatedProfile,
      mongoProfile: savedProfile,
    });
  } catch (err) {
    console.error("LinkedIn text import error:", err.message);
    res.status(500).json({
      success: false,
      message: "An unexpected error occurred during import.",
    });
  }
};

// ── Profile Analysis (detailed quality check) ────────────────────────────────
exports.analyzeMyProfile = async (req, res) => {
  try {
    const profile = await Profile.findOne({ user: req.user.id }).populate("user", "name email uid role");
    if (!profile) {
      return res.json({
        score: 0,
        grade: "Incomplete",
        gradeColor: "#ef4444",
        sections: {},
        suggestions: [{ category: "completeness", text: "Create your profile first" }],
      });
    }

    const analysis = analyzeProfile(profile);
    res.json(analysis);
  } catch (err) {
    console.error("Profile analysis error:", err.message);
    res.status(500).json({ message: "Failed to analyze profile" });
  }
};

// ── LinkedIn Session Login (opens browser for manual login) ──────────────────
exports.linkedinLogin = async (req, res) => {
  try {
    if (hasActiveSession()) {
      return res.json({ success: true, message: "Already logged in to LinkedIn", hasSession: true });
    }

    // Open browser for login (this blocks until user logs in or closes browser)
    const result = await openLoginBrowser();

    if (result.success) {
      res.json({ success: true, message: "LinkedIn login successful! Session saved.", hasSession: true });
    } else {
      res.status(400).json({ success: false, message: "LinkedIn login failed or was cancelled." });
    }
  } catch (err) {
    console.error("LinkedIn login error:", err.message);
    res.status(500).json({
      success: false,
      message: err.message.includes("not installed")
        ? "Playwright not installed. Run: npm install playwright && npx playwright install chromium"
        : "Failed to open LinkedIn login. Please try again.",
    });
  }
};

// ── Check LinkedIn session status ────────────────────────────────────────────
exports.linkedinSessionStatus = async (req, res) => {
  try {
    const hasSession = hasActiveSession();
    res.json({ hasSession, message: hasSession ? "LinkedIn session active" : "No active LinkedIn session" });
  } catch (err) {
    res.json({ hasSession: false, message: "Could not check session" });
  }
};

// ── Clear LinkedIn session ───────────────────────────────────────────────────
exports.linkedinLogout = async (req, res) => {
  try {
    clearSession();
    res.json({ success: true, message: "LinkedIn session cleared" });
  } catch (err) {
    res.status(500).json({ success: false, message: "Failed to clear session" });
  }
};

// ── Map extracted data to existing Profile model schema ──────────────────────
function mapToProfileSchema(extracted) {
  const allSkills = [
    ...(extracted.skills?.technical || []),
    ...(extracted.skills?.softSkills || []),
    ...(extracted.skills?.tools || []),
  ];
  // Deduplicate skills (case-insensitive)
  const seenSkills = new Set();
  const uniqueSkills = allSkills.filter(s => {
    const lower = (s || "").toLowerCase().trim();
    if (!lower || seenSkills.has(lower)) return false;
    seenSkills.add(lower);
    return true;
  });

  const experiences = (extracted.experience || []).map((exp) => ({
    title: exp.position || "",
    company: exp.company || "",
    location: "",
    startDate: exp.startDate || "",
    endDate: exp.endDate || "",
    description: exp.description || "",
  }));

  const education = (extracted.education || []).map((edu) => ({
    school: edu.university || "",
    degree: edu.degree || "",
    fieldOfStudy: edu.field || "",
    startYear: edu.startYear || "",
    endYear: edu.endYear || "",
    cgpa: edu.grade || "",
  }));

  const certifications = (extracted.additional?.certifications || []).map((cert) => {
    if (typeof cert === "string") {
      return { name: cert, issuer: "", date: "", url: "" };
    }
    return { name: cert.name || cert, issuer: cert.issuer || "", date: cert.date || "", url: cert.url || "" };
  });

  const projects = (extracted.additional?.projects || []).map((proj) => {
    if (typeof proj === "string") {
      return { name: proj, description: "", techStack: "", link: "" };
    }
    return { name: proj.name || proj, description: proj.description || "", techStack: proj.techStack || "", link: proj.link || "" };
  });

  return {
    headline: extracted.professional?.headline || "",
    about: extracted.professional?.about || "",
    location: extracted.personal?.location || "",
    phone: extracted.personal?.phone || "",
    website: extracted.personal?.linkedinUrl || "",
    experiences,
    education,
    skills: uniqueSkills,
    certifications,
    projects,
  };
}
