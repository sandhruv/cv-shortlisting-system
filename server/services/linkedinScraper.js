const axios = require("axios");
const cheerio = require("cheerio");
const fs = require("fs");
const path = require("path");

const SESSION_DIR = path.join(__dirname, "..", ".linkedin-sessions");
const SESSION_FILE = path.join(SESSION_DIR, "session.json");
const LINKEDIN_PATTERN = /^https?:\/\/(www\.)?linkedin\.com\/in\/[a-zA-Z0-9._%-]+\/?(\?.*)?$/;

// ── Session Management (Playwright) ─────────────────────────────────────────
function loadSession() {
  try {
    if (fs.existsSync(SESSION_FILE)) {
      return JSON.parse(fs.readFileSync(SESSION_FILE, "utf-8"));
    }
  } catch {}
  return null;
}

function saveSession(cookies) {
  if (!fs.existsSync(SESSION_DIR)) fs.mkdirSync(SESSION_DIR, { recursive: true });
  fs.writeFileSync(SESSION_FILE, JSON.stringify(cookies, null, 2));
}

function clearSession() {
  try { if (fs.existsSync(SESSION_FILE)) fs.unlinkSync(SESSION_FILE); } catch {}
}

function hasActiveSession() {
  const session = loadSession();
  if (!session || !session.cookies || !session.cookies.length) return false;
  // Check if session is older than 7 days
  if (session.savedAt && Date.now() - session.savedAt > 7 * 24 * 60 * 60 * 1000) {
    clearSession();
    return false;
  }
  return true;
}

// Open browser for manual login - returns a promise that resolves when login completes
async function openLoginBrowser() {
  let playwright;
  try {
    playwright = require("playwright");
  } catch {
    throw new Error("Playwright not installed. Run: npm install playwright && npx playwright install chromium");
  }

  const browser = await playwright.chromium.launch({ headless: false });
  const context = await browser.newContext();
  const page = await context.newPage();

  await page.goto("https://www.linkedin.com/login");

  // Wait for user to log in (navigate to feed) or timeout after 5 minutes
  try {
    await page.waitForURL("**/feed/**", { timeout: 300000 });
  } catch {
    // User may have closed browser or timed out
  }

  const cookies = await context.cookies();
  saveSession({ cookies, savedAt: Date.now() });
  await browser.close();
  return { success: true };
}

// Strategy 0: Playwright with saved session cookies (most reliable)
async function fetchLinkedInWithSession(url) {
  if (!hasActiveSession()) {
    return { success: false, reason: "no-session" };
  }

  let playwright;
  try {
    playwright = require("playwright");
  } catch {
    return { success: false, reason: "playwright-not-installed" };
  }

  const session = loadSession();
  try {
    const browser = await playwright.chromium.launch({ headless: true });
    const context = await browser.newContext();

    // Load saved cookies
    await context.addCookies(session.cookies);

    const page = await context.newPage();
    await page.goto(url, { waitUntil: "domcontentloaded", timeout: 20000 });

    // Wait a bit for dynamic content
    await page.waitForTimeout(2000);

    const html = await page.content();
    await browser.close();

    // Check if we got redirected to login
    if (html.includes("sign in") && html.includes("password") && !html.includes("experience")) {
      return { success: false, reason: "session-expired" };
    }

    return { success: true, html };
  } catch (err) {
    return { success: false, reason: err.message };
  }
}

function validateLinkedInUrl(url) {
  if (!url || typeof url !== "string") {
    return { valid: false, error: "URL is required" };
  }
  const trimmed = url.trim();
  try {
    const parsed = new URL(trimmed);
    if (parsed.protocol !== "http:" && parsed.protocol !== "https:") {
      return { valid: false, error: "Only HTTP/HTTPS URLs are allowed" };
    }
    if (parsed.hostname !== "www.linkedin.com" && parsed.hostname !== "linkedin.com") {
      return { valid: false, error: "Only linkedin.com profile URLs are accepted" };
    }
    if (!LINKEDIN_PATTERN.test(trimmed)) {
      return { valid: false, error: "URL must be a LinkedIn profile URL (e.g. https://www.linkedin.com/in/username/)" };
    }
    const hostname = parsed.hostname;
    if (hostname === "localhost" || hostname === "127.0.0.1" || hostname === "0.0.0.0" ||
        hostname.startsWith("192.168.") || hostname.startsWith("10.") || hostname.startsWith("172.")) {
      return { valid: false, error: "Internal URLs are not allowed" };
    }
    return { valid: true, url: trimmed };
  } catch {
    return { valid: false, error: "Invalid URL format" };
  }
}

function extractProfileSlug(url) {
  const match = url.match(/\/in\/([a-zA-Z0-9._%-]+)/);
  return match ? match[1] : null;
}

const BROWSER_HEADERS = {
  "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/125.0.0.0 Safari/537.36",
  Accept: "text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,*/*;q=0.8",
  "Accept-Language": "en-US,en;q=0.9",
  "Accept-Encoding": "gzip, deflate, br",
  "Sec-Ch-Ua": '"Chromium";v="125", "Not.A/Brand";v="24", "Google Chrome";v="125"',
  "Sec-Ch-Ua-Mobile": "?0",
  "Sec-Ch-Ua-Platform": '"Windows"',
  "Sec-Fetch-Dest": "document",
  "Sec-Fetch-Mode": "navigate",
  "Sec-Fetch-Site": "none",
  "Sec-Fetch-User": "?1",
  "Upgrade-Insecure-Requests": "1",
};

// Strategy 1: Fetch LinkedIn directly with full browser headers
async function fetchLinkedInDirect(url) {
  try {
    const response = await axios.get(url, {
      headers: BROWSER_HEADERS,
      timeout: 12000,
      maxRedirects: 5,
    });

    const html = response.data;
    if (html.includes("sign in") && html.includes("password") && !html.includes("experience")) {
      return { success: false, reason: "login-wall" };
    }

    return { success: true, html };
  } catch (err) {
    return { success: false, reason: err.response?.status || err.message };
  }
}

// Strategy 2: Fetch from Google search snippets
async function fetchFromGoogleSearch(slug) {
  try {
    const searchUrl = `https://www.google.com/search?q=site:linkedin.com/in/${slug}&num=5`;
    const response = await axios.get(searchUrl, {
      headers: {
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/125.0.0.0 Safari/537.36",
        Accept: "text/html",
        "Accept-Language": "en-US,en;q=0.9",
      },
      timeout: 10000,
    });

    const $ = cheerio.load(response.data);
    const profile = {
      name: "",
      headline: "",
      location: "",
      about: "",
      experience: [],
      education: [],
      skills: [],
      certifications: [],
      projects: [],
      rawText: "",
    };

    // Extract from Google search result snippets
    const searchResults = [];
    $("div.g, div[data-hveid]").each((_, el) => {
      const title = $(el).find("h3").first().text().trim();
      const snippet = $(el).find("div[data-sncf], div.VwiC3b, span.aCOpRe").text().trim();
      if (title || snippet) searchResults.push({ title, snippet });
    });

    // Parse search results for profile data
    let nameFound = false;
    for (const result of searchResults) {
      const fullText = `${result.title} ${result.snippet}`;

      // Name: usually "Name - Title at Company | LinkedIn" or "Name | LinkedIn"
      if (!nameFound && result.title) {
        const nameMatch = result.title.match(/^(.+?)\s*[-–|]\s*(?:LinkedIn|View)/i);
        if (nameMatch) {
          profile.name = nameMatch[1].trim();
          nameFound = true;
        } else if (result.title.includes("LinkedIn")) {
          profile.name = result.title.replace(/\s*[-–|]\s*LinkedIn.*$/i, "").trim();
          nameFound = true;
        }
      }

      // Headline: "Title at Company" pattern
      if (!profile.headline && result.title) {
        const headlineMatch = result.title.match(/[-–]\s*(.+?)(?:\s*\|\s*LinkedIn|$)/i);
        if (headlineMatch) profile.headline = headlineMatch[1].trim();
      }

      // Location from snippet
      if (!profile.location && result.snippet) {
        const locMatch = result.snippet.match(/(?:Location|Based in|located in|from)\s+([^·,\n]+)/i);
        if (locMatch) profile.location = locMatch[1].trim();
      }

      // About from snippet
      if (!profile.about && result.snippet && result.snippet.length > 50) {
        profile.about = result.snippet;
      }
    }

    if (profile.name) {
      profile.rawText = buildProfileText(profile);
      return { success: true, profile };
    }

    return { success: false, reason: "no-data-in-search" };
  } catch (err) {
    return { success: false, reason: err.message };
  }
}

// Strategy 3: Fetch LinkedIn public profile with enhanced extraction
async function fetchLinkedInViaRedirect(slug) {
  try {
    const url = `https://www.linkedin.com/in/${slug}`;
    const response = await axios.get(url, {
      headers: {
        ...BROWSER_HEADERS,
        Referer: "https://www.google.com/",
      },
      timeout: 15000,
      maxRedirects: 5,
    });

    const html = response.data;
    const $ = cheerio.load(html);
    const profile = {
      name: "",
      headline: "",
      location: "",
      about: "",
      experience: [],
      education: [],
      skills: [],
      certifications: [],
      projects: [],
      rawText: "",
    };

    // ── Extract from JSON-LD structured data ──────────────────────────────
    $('script[type="application/ld+json"]').each((_, el) => {
      try {
        const json = JSON.parse($(el).html());
        if (json["@type"] === "Person" || json["@type"] === "ProfilePage" || json.mainEntity) {
          const person = json.mainEntity || json;
          if (person.name) profile.name = person.name;
          if (person.jobTitle) profile.headline = person.jobTitle;
          if (person.description) profile.about = person.description;
          if (person.address?.addressLocality) profile.location = person.address.addressLocality;
          if (person.worksFor?.name) {
            profile.headline = profile.headline || `Working at ${person.worksFor.name}`;
          }
          // Extract experience from JSON-LD
          if (person.hasOccupation && Array.isArray(person.hasOccupation)) {
            person.hasOccupation.forEach(occ => {
              profile.experience.push({
                title: occ.name || "",
                company: occ.occupationCategory || "",
                location: "",
                startDate: occ.validFrom || "",
                endDate: occ.validThrough || "",
                description: occ.description || "",
              });
            });
          }
          // Extract education
          if (person.alumniOf && Array.isArray(person.alumniOf)) {
            person.alumniOf.forEach(edu => {
              profile.education.push({
                school: edu.name || "",
                degree: edu.educationalLevel || "",
                fieldOfStudy: "",
                startYear: "",
                endYear: "",
                cgpa: "",
              });
            });
          }
        }
      } catch {}
    });

    // ── Extract from meta tags ────────────────────────────────────────────
    const ogTitle = $('meta[property="og:title"]').attr("content") || "";
    const ogDesc = $('meta[property="og:description"]').attr("content") || "";
    const metaDesc = $('meta[name="description"]').attr("content") || "";
    const ogImage = $('meta[property="og:image"]').attr("content") || "";

    if (ogTitle) {
      const cleanTitle = ogTitle.replace(/\s*[-–|]\s*LinkedIn.*$/i, "").trim();
      if (!profile.name) profile.name = cleanTitle;
    }

    const desc = ogDesc || metaDesc;
    if (desc) {
      const parts = desc.split("|").map(s => s.trim());
      if (parts.length >= 2) {
        if (!profile.name) profile.name = parts[0];
        if (!profile.headline) profile.headline = parts[1];
      } else if (!profile.headline) {
        profile.headline = desc.substring(0, 150);
      }
      // Extract location from description
      if (!profile.location) {
        const locMatch = desc.match(/(?:in|at|from|based in)\s+([A-Z][a-zA-Z\s,]+(?:India|USA|UK|UAE|Canada|Australia|Germany|Singapore))/i);
        if (locMatch) profile.location = locMatch[1].trim();
      }
    }

    // ── Extract from visible page elements ────────────────────────────────
    const h1 = $("h1").first().text().trim();
    if (h1 && h1.length > 1 && !profile.name) profile.name = h1;

    // Headline variants
    const headlineSelectors = [
      ".text-body-medium.break-words",
      ".pv-text-details__left-panel h2",
      ".share-activity-headline",
      "div.text-body-medium",
    ];
    for (const sel of headlineSelectors) {
      const el = $(sel).first();
      if (el.length) {
        const text = el.text().trim();
        if (text && text.length > 3 && !profile.headline) {
          profile.headline = text;
          break;
        }
      }
    }

    // Location variants
    const locationSelectors = [
      ".text-body-small.inline.t-black--light.break-words",
      ".pv-text-details__left-panel .pb2",
      ".pv-text-details__left-panel span",
    ];
    for (const sel of locationSelectors) {
      const el = $(sel).first();
      if (el.length) {
        const text = el.text().trim();
        if (text && text.length > 2 && text.length < 100 && !profile.location) {
          profile.location = text;
          break;
        }
      }
    }

    // ── Extract from embedded data/state ──────────────────────────────────
    // LinkedIn embeds profile data in script tags as JSON
    $('script').each((_, el) => {
      const content = $(el).html() || "";
      
      // Look for profile data in embedded JSON
      if (content.includes('"headline"') || content.includes('"summary"')) {
        try {
          // Extract headline
          const headlineMatch = content.match(/"headline"\s*:\s*"([^"]+)"/);
          if (headlineMatch && !profile.headline) profile.headline = headlineMatch[1];

          // Extract summary/about
          const summaryMatch = content.match(/"(?:summary|about)"\s*:\s*"([^"]{20,})"/);
          if (summaryMatch && !profile.about) profile.about = summaryMatch[1];
        } catch {}
      }

      // Look for experience data
      if (content.includes('"position"') || content.includes('"experience"')) {
        try {
          const expMatch = content.match(/"positions"\s*:\s*(\[[\s\S]*?\])/);
          if (expMatch) {
            const positions = JSON.parse(expMatch[1]);
            positions.forEach(pos => {
              profile.experience.push({
                title: pos.title || pos.name || "",
                company: pos.company?.name || pos.companyName || "",
                location: pos.location || "",
                startDate: pos.startDate ? `${pos.startDate.month || ""}/${pos.startDate.year || ""}` : "",
                endDate: pos.endDate ? `${pos.endDate.month || ""}/${pos.endDate.year || ""}` : "Present",
                description: pos.description || "",
              });
            });
          }
        } catch {}
      }
    });

    // ── Extract skills from visible sections ──────────────────────────────
    const skillsSection = $("#skills").closest("section");
    if (skillsSection.length) {
      skillsSection.find("span[aria-hidden='true']").each((_, el) => {
        const skill = $(el).text().trim();
        if (skill && skill.length > 1 && skill.length < 100 && !profile.skills.includes(skill)) {
          profile.skills.push(skill);
        }
      });
    }

    // ── Extract experience from visible sections ──────────────────────────
    const experienceSection = $("#experience").closest("section");
    if (experienceSection.length && profile.experience.length === 0) {
      experienceSection.find("li.artdeco-list__item, li").each((_, el) => {
        const $el = $(el);
        const spans = $el.find("span[aria-hidden='true']");
        const title = spans.eq(0).text().trim();
        const company = spans.eq(1).text().trim().replace(/\s*[·-]\s*.*/, "");
        const dateRange = $el.find("span.pvs-entity__caption-wrapper").first().text().trim();
        const description = $el.find(".pvs-list__outer--margin-top span[aria-hidden='true']").last().text().trim();
        if (title || company) {
          const dates = parseDateRange(dateRange);
          profile.experience.push({ title, company: company.replace(/\s*·\s*.*/, ""), location: "", startDate: dates.start, endDate: dates.end, description });
        }
      });
    }

    // ── Extract education from visible sections ───────────────────────────
    const educationSection = $("#education").closest("section");
    if (educationSection.length && profile.education.length === 0) {
      educationSection.find("li.artdeco-list__item, li").each((_, el) => {
        const $el = $(el);
        const spans = $el.find("span[aria-hidden='true']");
        const school = spans.eq(0).text().trim();
        const degree = spans.eq(1).text().trim();
        if (school) profile.education.push({ school, degree, fieldOfStudy: "", startYear: "", endYear: "", cgpa: "" });
      });
    }

    // ── Extract about from visible sections ───────────────────────────────
    const aboutSection = $("#about").closest("section");
    if (aboutSection.length && !profile.about) {
      profile.about = aboutSection.find(".inline-show-more-text, .pv-shared-text-with-see-more").text().trim();
    }

    // ── Extract certifications ────────────────────────────────────────────
    const certSection = $("#licenses_and_certifications").closest("section");
    if (certSection.length) {
      certSection.find("li.artdeco-list__item").each((_, el) => {
        const name = $(el).find("span[aria-hidden='true']").first().text().trim();
        if (name) {
          profile.certifications.push({ name, issuer: "", date: "", url: "" });
        }
      });
    }

    // ── Extract projects ──────────────────────────────────────────────────
    const projectsSection = $("#projects").closest("section");
    if (projectsSection.length) {
      projectsSection.find("li.artdeco-list__item").each((_, el) => {
        const name = $(el).find("span[aria-hidden='true']").first().text().trim();
        const desc = $(el).find("span[aria-hidden='true']").eq(1).text().trim();
        if (name) {
          profile.projects.push({ name, description: desc || "", techStack: "", link: "" });
        }
      });
    }

    profile.rawText = buildProfileText(profile);

    if (profile.name || profile.headline || profile.experience.length > 0) {
      return { success: true, profile };
    }

    return { success: false, reason: "no-meaningful-data" };
  } catch (err) {
    return { success: false, reason: err.message };
  }
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
      if (exp.company) lines.push(`at ${exp.company}`);
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
  if (profile.certifications.length > 0) {
    lines.push("CERTIFICATIONS");
    for (const cert of profile.certifications) {
      if (cert.name) lines.push(cert.name);
      if (cert.issuer) lines.push(cert.issuer);
      lines.push("");
    }
  }
  if (profile.projects.length > 0) {
    lines.push("PROJECTS");
    for (const proj of profile.projects) {
      if (proj.name) lines.push(proj.name);
      if (proj.description) lines.push(proj.description);
      if (proj.techStack) lines.push(`Tech: ${proj.techStack}`);
      lines.push("");
    }
  }
  return lines.join("\n").trim();
}

async function scrapeLinkedInProfile(url) {
  const validation = validateLinkedInUrl(url);
  if (!validation.valid) {
    return { success: false, error: validation.error };
  }

  const slug = extractProfileSlug(validation.url);

  // Strategy 0: Playwright with session (most reliable, requires login)
  if (hasActiveSession()) {
    console.log("[LinkedIn] Strategy 0: Playwright session...");
    const session = await fetchLinkedInWithSession(validation.url);
    if (session.success) {
      const profile = extractContentFromHtml(session.html);
      if (profile.name || profile.headline || profile.experience.length > 0 || profile.about) {
        console.log("[LinkedIn] Strategy 0: Success");
        if (!profile.rawText) profile.rawText = buildProfileText(profile);
        return { success: true, profile };
      }
    } else if (session.reason === "session-expired") {
      console.log("[LinkedIn] Strategy 0: Session expired, clearing...");
      clearSession();
    }
  }

  // Strategy 1: Direct LinkedIn fetch
  console.log("[LinkedIn] Strategy 1: Direct fetch...");
  const direct = await fetchLinkedInDirect(validation.url);
  if (direct.success) {
    const profile = extractContentFromHtml(direct.html);
    if (profile.name || profile.headline || profile.experience.length > 0 || profile.about) {
      console.log("[LinkedIn] Strategy 1: Success");
      if (!profile.rawText) profile.rawText = buildProfileText(profile);
      return { success: true, profile };
    }
  }

  // Strategy 2: LinkedIn meta tags / JSON-LD
  console.log("[LinkedIn] Strategy 2: Meta tags fetch...");
  const meta = await fetchLinkedInViaRedirect(slug);
  if (meta.success) {
    console.log("[LinkedIn] Strategy 2: Success");
    return { success: true, profile: meta.profile };
  }

  // Strategy 3: Google search snippets
  console.log("[LinkedIn] Strategy 3: Google search...");
  const google = await fetchFromGoogleSearch(slug);
  if (google.success) {
    console.log("[LinkedIn] Strategy 3: Success");
    return { success: true, profile: google.profile };
  }

  return {
    success: false,
    error: "Unable to extract profile data through any method. LinkedIn is restricting access. Try logging in via the Import button, or upload your LinkedIn PDF instead.",
  };
}

function extractContentFromHtml(html) {
  const $ = cheerio.load(html);

  const profile = {
    name: "",
    headline: "",
    location: "",
    about: "",
    experience: [],
    education: [],
    skills: [],
    certifications: [],
    projects: [],
    rawText: "",
  };

  // ── Extract from JSON-LD BEFORE removing scripts ──────────────────────
  $('script[type="application/ld+json"]').each((_, el) => {
    try {
      const json = JSON.parse($(el).html());
      const person = json.mainEntity || json;
      if (person.name) profile.name = person.name;
      if (person.jobTitle) profile.headline = person.jobTitle;
      if (person.description) profile.about = person.description;
      if (person.address?.addressLocality) profile.location = person.address.addressLocality;
    } catch {}
  });

  // ── Extract from embedded script data BEFORE removing ─────────────────
  $('script').each((_, el) => {
    const content = $(el).html() || "";
    if (content.includes('"headline"') || content.includes('"summary"')) {
      try {
        const headlineMatch = content.match(/"headline"\s*:\s*"([^"]+)"/);
        if (headlineMatch && !profile.headline) profile.headline = headlineMatch[1];
        const summaryMatch = content.match(/"(?:summary|about)"\s*:\s*"([^"]{20,})"/);
        if (summaryMatch && !profile.about) profile.about = summaryMatch[1];
      } catch {}
    }
  });

  // ── Extract from meta tags ────────────────────────────────────────────
  const ogTitle = $('meta[property="og:title"]').attr("content") || "";
  const ogDesc = $('meta[property="og:description"]').attr("content") || "";
  const metaDesc = $('meta[name="description"]').attr("content") || "";

  if (ogTitle && !profile.name) {
    profile.name = ogTitle.replace(/\s*[-–|]\s*LinkedIn.*$/i, "").trim();
  }

  const desc = ogDesc || metaDesc;
  if (desc) {
    const parts = desc.split("|").map((s) => s.trim());
    if (parts.length >= 2) {
      if (!profile.name) profile.name = parts[0];
      if (!profile.headline) profile.headline = parts[1];
    } else if (!profile.headline) {
      profile.headline = desc.length > 200 ? desc.substring(0, 200) : desc;
    }
  }

  // ── Now remove scripts and parse visible content ──────────────────────
  $("script, style, noscript, iframe, svg").remove();
  $("nav, header, footer").remove();
  $("[role='navigation'], [role='banner'], [role='contentinfo']").remove();

  // Name from h1
  const h1 = $("h1").first().text().trim();
  if (h1 && h1.length > 1 && !profile.name) profile.name = h1;

  // Headline from visible elements
  if (!profile.headline) {
    const headlineEl = $(".text-body-medium.break-words").first();
    if (headlineEl.length) profile.headline = headlineEl.text().trim();
  }

  // Location from visible elements
  if (!profile.location) {
    const locationEl = $(".text-body-small.inline.t-black--light.break-words").first();
    if (locationEl.length) profile.location = locationEl.text().trim();
  }

  // About section
  const aboutSection = $("#about").closest("section");
  if (aboutSection.length && !profile.about) {
    profile.about = aboutSection.find(".inline-show-more-text, .pv-shared-text-with-see-more").text().trim();
  }

  // Experience section
  const experienceSection = $("#experience").closest("section");
  if (experienceSection.length && profile.experience.length === 0) {
    experienceSection.find("li.artdeco-list__item, li").each((_, el) => {
      const $el = $(el);
      const spans = $el.find("span[aria-hidden='true']");
      const title = spans.eq(0).text().trim();
      const company = spans.eq(1).text().trim().replace(/\s*[·-]\s*.*/, "");
      const dateRange = $el.find("span.pvs-entity__caption-wrapper").first().text().trim();
      const description = $el.find(".pvs-list__outer--margin-top span[aria-hidden='true']").last().text().trim();
      if (title || company) {
        const dates = parseDateRange(dateRange);
        profile.experience.push({ title, company: company.replace(/\s*·\s*.*/, ""), location: "", startDate: dates.start, endDate: dates.end, description });
      }
    });
  }

  // Education section
  const educationSection = $("#education").closest("section");
  if (educationSection.length && profile.education.length === 0) {
    educationSection.find("li.artdeco-list__item, li").each((_, el) => {
      const $el = $(el);
      const spans = $el.find("span[aria-hidden='true']");
      const school = spans.eq(0).text().trim();
      const degree = spans.eq(1).text().trim();
      if (school) profile.education.push({ school, degree, fieldOfStudy: "", startYear: "", endYear: "", cgpa: "" });
    });
  }

  // Skills section
  const skillsSection = $("#skills").closest("section");
  if (skillsSection.length && profile.skills.length === 0) {
    skillsSection.find("span[aria-hidden='true']").each((_, el) => {
      const skill = $(el).text().trim();
      if (skill && skill.length > 1 && skill.length < 100 && !profile.skills.includes(skill)) {
        profile.skills.push(skill);
      }
    });
  }

  // Certifications section
  const certSection = $("#licenses_and_certifications").closest("section");
  if (certSection.length) {
    certSection.find("li.artdeco-list__item").each((_, el) => {
      const name = $(el).find("span[aria-hidden='true']").first().text().trim();
      if (name) profile.certifications.push({ name, issuer: "", date: "", url: "" });
    });
  }

  // Projects section
  const projectsSection = $("#projects").closest("section");
  if (projectsSection.length) {
    projectsSection.find("li.artdeco-list__item").each((_, el) => {
      const name = $(el).find("span[aria-hidden='true']").first().text().trim();
      const desc = $(el).find("span[aria-hidden='true']").eq(1).text().trim();
      if (name) profile.projects.push({ name, description: desc || "", techStack: "", link: "" });
    });
  }

  if (!profile.rawText) profile.rawText = buildProfileText(profile);
  return profile;
}

function parseDateRange(dateStr) {
  if (!dateStr) return { start: "", end: "" };
  const cleaned = dateStr.replace(/\s+/g, " ").trim();
  const match = cleaned.match(/([A-Za-z]+\s+\d{4}|\d{4})\s*[-–]\s*([A-Za-z]+\s+\d{4}|\d{4}|Present|Current)/i);
  if (match) return { start: match[1].trim(), end: match[2].trim() };
  return { start: cleaned, end: "" };
}

function cleanupBrowser() {}

module.exports = {
  validateLinkedInUrl,
  scrapeLinkedInProfile,
  extractProfileSlug,
  cleanupBrowser,
  openLoginBrowser,
  hasActiveSession,
  clearSession,
};
