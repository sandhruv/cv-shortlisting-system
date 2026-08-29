const EmbeddingService = require("./embeddingService");
const VectorStore = require("./vectorStore");

const RETRIEVAL_QUERIES = {
  personal: "Find the candidate's name, email, phone, location and LinkedIn URL. Look for contact information and personal details.",
  professional: "Find the candidate's headline, about section, current position, total experience and career timeline. Look for professional summary and career overview.",
  experience: "Find every company, position, title, start date, end date, job description and skills used. Look for work experience and employment history.",
  education: "Find every university, school, degree, field of study, start year, end year, CGPA and academic information.",
  skills: "Find technical skills, programming languages, soft skills, tools, frameworks, and technologies.",
  projects: "Find project names, descriptions, tech stacks, links, and project details.",
  certifications: "Find certification names, issuers, dates, and credential URLs.",
  languages: "Find spoken languages and language proficiency levels.",
  volunteer: "Find volunteer experience, community service, and volunteer work.",
  awards: "Find awards, honors, achievements, and recognitions.",
  publications: "Find publications, papers, articles, and written works.",
};

function retrieveForCategory(chunks, embeddings, embeddingService, category, topK = 5) {
  const query = RETRIEVAL_QUERIES[category] || RETRIEVAL_QUERIES.professional;
  const queryVector = embeddingService.transform(query);

  const store = new VectorStore();
  for (let i = 0; i < chunks.length; i++) {
    store.add(embeddings[i], chunks[i]);
  }

  return store.search(queryVector, topK);
}

function retrieveAllCategories(chunks, embeddings, embeddingService) {
  const results = {};
  const categories = [
    "personal", "professional", "experience",
    "education", "skills", "projects",
    "certifications", "languages", "volunteer",
    "awards", "publications",
  ];

  const store = new VectorStore();
  for (let i = 0; i < chunks.length; i++) {
    store.add(embeddings[i], chunks[i]);
  }

  for (const category of categories) {
    const query = RETRIEVAL_QUERIES[category];
    const queryVector = embeddingService.transform(query);
    const retrieved = store.search(queryVector, 5);
    results[category] = retrieved.filter((r) => r.score > 0.05);
  }

  return results;
}

function buildContextFromResults(results) {
  const context = {};

  for (const [category, items] of Object.entries(results)) {
    context[category] = items.map((item) => item.text).join("\n\n");
  }

  return context;
}

module.exports = {
  retrieveForCategory,
  retrieveAllCategories,
  buildContextFromResults,
  RETRIEVAL_QUERIES,
};
