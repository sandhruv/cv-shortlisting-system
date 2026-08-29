const { z } = require("zod");

const linkedinUrlSchema = z.object({
  linkedinUrl: z
    .string()
    .min(1, "LinkedIn URL is required")
    .url("Must be a valid URL")
    .regex(
      /^https?:\/\/(www\.)?linkedin\.com\/in\/[a-zA-Z0-9._%-]+\/?(\?.*)?$/,
      "Must be a LinkedIn profile URL (e.g. https://www.linkedin.com/in/username/)"
    ),
});

const profileExtractionSchema = z.object({
  personal: z.object({
    name: z.string().nullable().default(null),
    email: z.string().nullable().default(null),
    phone: z.string().nullable().default(null),
    location: z.string().nullable().default(null),
    linkedinUrl: z.string().nullable().default(null),
  }),
  professional: z.object({
    headline: z.string().nullable().default(null),
    about: z.string().nullable().default(null),
    currentPosition: z.string().nullable().default(null),
    totalExperience: z.string().nullable().default(null),
    careerTimeline: z.array(z.string()).default([]),
  }),
  experience: z.array(
    z.object({
      company: z.string().nullable().default(null),
      position: z.string().nullable().default(null),
      startDate: z.string().nullable().default(null),
      endDate: z.string().nullable().default(null),
      description: z.string().nullable().default(null),
      skillsUsed: z.array(z.string()).default([]),
    })
  ),
  education: z.array(
    z.object({
      university: z.string().nullable().default(null),
      degree: z.string().nullable().default(null),
      field: z.string().nullable().default(null),
      startYear: z.string().nullable().default(null),
      endYear: z.string().nullable().default(null),
      grade: z.string().nullable().default(null),
    })
  ),
  skills: z.object({
    technical: z.array(z.string()).default([]),
    softSkills: z.array(z.string()).default([]),
    tools: z.array(z.string()).default([]),
  }),
  additional: z.object({
    projects: z.array(z.string()).default([]),
    certifications: z.array(z.string()).default([]),
    publications: z.array(z.string()).default([]),
    languages: z.array(z.string()).default([]),
    volunteerExperience: z.array(z.string()).default([]),
    awards: z.array(z.string()).default([]),
  }),
});

function validateLinkedInUrl(input) {
  return linkedinUrlSchema.safeParse(input);
}

function validateProfileExtraction(data) {
  return profileExtractionSchema.safeParse(data);
}

function repairProfileData(data) {
  const result = validateProfileExtraction(data);
  if (result.success) return result.data;

  // Attempt repair: fill in missing fields with defaults
  const repaired = {
    personal: {
      name: data?.personal?.name || null,
      email: data?.personal?.email || null,
      phone: data?.personal?.phone || null,
      location: data?.personal?.location || null,
      linkedinUrl: data?.personal?.linkedinUrl || null,
    },
    professional: {
      headline: data?.professional?.headline || null,
      about: data?.professional?.about || null,
      currentPosition: data?.professional?.currentPosition || null,
      totalExperience: data?.professional?.totalExperience || null,
      careerTimeline: Array.isArray(data?.professional?.careerTimeline)
        ? data.professional.careerTimeline
        : [],
    },
    experience: Array.isArray(data?.experience)
      ? data.experience.map((exp) => ({
          company: exp?.company || null,
          position: exp?.position || null,
          startDate: exp?.startDate || null,
          endDate: exp?.endDate || null,
          description: exp?.description || null,
          skillsUsed: Array.isArray(exp?.skillsUsed) ? exp.skillsUsed : [],
        }))
      : [],
    education: Array.isArray(data?.education)
      ? data.education.map((edu) => ({
          university: edu?.university || null,
          degree: edu?.degree || null,
          field: edu?.field || null,
          startYear: edu?.startYear || null,
          endYear: edu?.endYear || null,
          grade: edu?.grade || null,
        }))
      : [],
    skills: {
      technical: Array.isArray(data?.skills?.technical) ? data.skills.technical : [],
      softSkills: Array.isArray(data?.skills?.softSkills) ? data.skills.softSkills : [],
      tools: Array.isArray(data?.skills?.tools) ? data.skills.tools : [],
    },
    additional: {
      projects: Array.isArray(data?.additional?.projects) ? data.additional.projects : [],
      certifications: Array.isArray(data?.additional?.certifications)
        ? data.additional.certifications
        : [],
      publications: Array.isArray(data?.additional?.publications)
        ? data.additional.publications
        : [],
      languages: Array.isArray(data?.additional?.languages) ? data.additional.languages : [],
      volunteerExperience: Array.isArray(data?.additional?.volunteerExperience)
        ? data.additional.volunteerExperience
        : [],
      awards: Array.isArray(data?.additional?.awards) ? data.additional.awards : [],
    },
  };

  return repaired;
}

module.exports = {
  validateLinkedInUrl,
  validateProfileExtraction,
  repairProfileData,
  linkedinUrlSchema,
  profileExtractionSchema,
};
