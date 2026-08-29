const axios = require("axios");

const GROQ_API_URL = "https://api.groq.com/openai/v1/chat/completions";
const MODEL = "openai/gpt-oss-20b";
const REQUEST_TIMEOUT = 60000;

const EXTRACTION_PROMPT = `You are an expert profile data extractor. Extract structured profile information from the provided text chunks. 

STRICT RULES:
1. Extract ONLY information explicitly stated in the provided text.
2. NEVER invent, infer, or guess any information.
3. NEVER fabricate email addresses, phone numbers, or contact details.
4. If a field cannot be found in the text, use null for strings or [] for arrays.
5. Preserve exact dates when available.
6. Do not hallucinate companies, degrees, skills, or certifications.
7. Deduplicate repeated information.
8. Return valid JSON only. No markdown, no explanations, no extra text.
9. For skills, categorize them into technical skills, soft skills, and tools/frameworks.
10. For experience, map "title" from the position/role name.
11. For education, map "school" from university/college name.

TEXT TO EXTRACT FROM:
{context}

Return ONLY valid JSON in this exact schema:
{
  "personal": {
    "name": "string or null",
    "email": "string or null",
    "phone": "string or null",
    "location": "string or null",
    "linkedinUrl": "string or null"
  },
  "professional": {
    "headline": "string or null",
    "about": "string or null",
    "currentPosition": "string or null",
    "totalExperience": "string or null",
    "careerTimeline": []
  },
  "experience": [
    {
      "company": "string or null",
      "position": "string or null",
      "startDate": "string or null",
      "endDate": "string or null",
      "description": "string or null",
      "skillsUsed": []
    }
  ],
  "education": [
    {
      "university": "string or null",
      "degree": "string or null",
      "field": "string or null",
      "startYear": "string or null",
      "endYear": "string or null",
      "grade": "string or null"
    }
  ],
  "skills": {
    "technical": [],
    "softSkills": [],
    "tools": []
  },
  "additional": {
    "projects": [],
    "certifications": [],
    "publications": [],
    "languages": [],
    "volunteerExperience": [],
    "awards": []
  }
}`;

async function extractProfile(context) {
  const GROQ_API_KEY = process.env.GROQ_API_KEY;
  if (!GROQ_API_KEY) {
    throw new Error("GROQ_API_KEY not configured on server");
  }

  // Truncate context to fit within model limits
  const maxContextLen = 6000;
  let truncatedContext = context;
  if (context.length > maxContextLen) {
    truncatedContext = context.substring(0, maxContextLen) + "\n\n[Content truncated due to length]";
  }

  const prompt = EXTRACTION_PROMPT.replace("{context}", truncatedContext);

  const response = await axios.post(
    GROQ_API_URL,
    {
      model: MODEL,
      messages: [
        {
          role: "system",
          content: "You are an expert profile data extractor. Return ONLY valid JSON. No markdown, no code fences, no explanations.",
        },
        { role: "user", content: prompt },
      ],
      temperature: 0.1,
      max_tokens: 4000,
      response_format: { type: "json_object" },
    },
    {
      headers: {
        Authorization: `Bearer ${GROQ_API_KEY}`,
        "Content-Type": "application/json",
      },
      timeout: REQUEST_TIMEOUT,
    }
  );

  const content = response.data.choices[0].message.content;
  return parseGroqResponse(content);
}

function parseGroqResponse(content) {
  // Strip markdown code fences if present
  let cleaned = content.replace(/```json\n?/g, "").replace(/```\n?/g, "").trim();

  try {
    return JSON.parse(cleaned);
  } catch {
    // Try to find JSON object in the response
    const jsonMatch = cleaned.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      try {
        return JSON.parse(jsonMatch[0]);
      } catch {
        throw new Error("Failed to parse Groq response as JSON");
      }
    }
    throw new Error("No valid JSON found in Groq response");
  }
}

function normalizeProfileData(raw) {
  return {
    personal: {
      name: raw.personal?.name || null,
      email: raw.personal?.email || null,
      phone: raw.personal?.phone || null,
      location: raw.personal?.location || null,
      linkedinUrl: raw.personal?.linkedinUrl || null,
    },
    professional: {
      headline: raw.professional?.headline || null,
      about: raw.professional?.about || null,
      currentPosition: raw.professional?.currentPosition || null,
      totalExperience: raw.professional?.totalExperience || null,
      careerTimeline: Array.isArray(raw.professional?.careerTimeline)
        ? raw.professional.careerTimeline
        : [],
    },
    experience: Array.isArray(raw.experience)
      ? raw.experience.map((exp) => ({
          company: exp.company || null,
          position: exp.position || null,
          startDate: exp.startDate || null,
          endDate: exp.endDate || null,
          description: exp.description || null,
          skillsUsed: Array.isArray(exp.skillsUsed) ? exp.skillsUsed : [],
        }))
      : [],
    education: Array.isArray(raw.education)
      ? raw.education.map((edu) => ({
          university: edu.university || null,
          degree: edu.degree || null,
          field: edu.field || null,
          startYear: edu.startYear || null,
          endYear: edu.endYear || null,
          grade: edu.grade || null,
        }))
      : [],
    skills: {
      technical: Array.isArray(raw.skills?.technical) ? raw.skills.technical : [],
      softSkills: Array.isArray(raw.skills?.softSkills) ? raw.skills.softSkills : [],
      tools: Array.isArray(raw.skills?.tools) ? raw.skills.tools : [],
    },
    additional: {
      projects: Array.isArray(raw.additional?.projects) ? raw.additional.projects : [],
      certifications: Array.isArray(raw.additional?.certifications)
        ? raw.additional.certifications
        : [],
      publications: Array.isArray(raw.additional?.publications)
        ? raw.additional.publications
        : [],
      languages: Array.isArray(raw.additional?.languages)
        ? raw.additional.languages
        : [],
      volunteerExperience: Array.isArray(raw.additional?.volunteerExperience)
        ? raw.additional.volunteerExperience
        : [],
      awards: Array.isArray(raw.additional?.awards) ? raw.additional.awards : [],
    },
  };
}

async function extractProfileWithRetry(context, maxRetries = 2) {
  let lastError;
  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      const raw = await extractProfile(context);
      return normalizeProfileData(raw);
    } catch (err) {
      lastError = err;
      if (attempt < maxRetries) {
        // Wait before retrying
        await new Promise((resolve) => setTimeout(resolve, 1000 * (attempt + 1)));
      }
    }
  }
  throw lastError;
}

module.exports = {
  extractProfile: extractProfileWithRetry,
  normalizeProfileData,
  parseGroqResponse,
};
