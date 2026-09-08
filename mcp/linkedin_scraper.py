"""
LinkedIn Scraper MCP Server
Extract profiles, jobs, and companies from LinkedIn.
Session-based auth - log in once, scrape headlessly.
"""

import asyncio
import json
import os
import sys
import time
from pathlib import Path
from urllib.parse import quote_plus

from mcp.server import Server
from mcp.server.stdio import stdio_server
from mcp.types import Tool, TextContent

SESSION_DIR = Path(__file__).parent / ".sessions"
SESSION_FILE = SESSION_DIR / "linkedin.json"
RATE_LIMIT_DELAY = 2  # seconds between requests

server = Server("linkedin-scraper")


def load_session():
    """Load saved session cookies."""
    if SESSION_FILE.exists():
        with open(SESSION_FILE, "r") as f:
            return json.load(f)
    return None


def save_session(cookies):
    """Save session cookies."""
    SESSION_DIR.mkdir(exist_ok=True)
    with open(SESSION_FILE, "w") as f:
        json.dump(cookies, f, indent=2)


def build_browser_headers():
    return {
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/125.0.0.0 Safari/537.36",
        "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,*/*;q=0.8",
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
    }


async def login_tool():
    """Open browser for manual LinkedIn login. Saves session cookies."""
    try:
        from playwright.async_api import async_playwright
        from playwright_stealth import stealth_async
    except ImportError:
        return [TextContent(type="text", text="Error: Install dependencies first:\npip install playwright playwright-stealth\nplaywright install chromium")]

    async with async_playwright() as p:
        browser = await p.chromium.launch(headless=False)
        context = await browser.new_context()
        page = await context.new_page()
        await stealth_async(page)

        await page.goto("https://www.linkedin.com/login")
        print("\n[LinkedIn MCP] Browser opened. Please log in manually.")
        print("[LinkedIn MCP] After logging in, close the browser window or press Enter here...")

        # Wait for navigation to feed or manual close
        try:
            await page.wait_for_url("**/feed/**", timeout=300000)  # 5 min timeout
        except Exception:
            pass

        cookies = await context.cookies()
        save_session(cookies)
        await browser.close()

        return [TextContent(type="text", text="Login successful! Session cookies saved. You can now use get_profile, search_people, etc.")]


async def search_jobs(query: str, location: str = "", remote: str = "", job_type: str = "", experience: str = "", max_results: int = 25):
    """Search LinkedIn job postings. No login required."""
    import httpx

    params = {"keywords": query, "location": location}
    filters = []

    if remote == "remote":
        filters.append("f_WT=2")
    elif remote == "onsite":
        filters.append("f_WT=1")
    elif remote == "hybrid":
        filters.append("f_WT=3")

    job_type_map = {"full-time": "f_JT=F", "part-time": "f_JT=P", "contract": "f_JT=C", "internship": "f_JT=I"}
    if job_type in job_type_map:
        filters.append(job_type_map[job_type])

    experience_map = {"entry": "f_E=2", "mid-senior": "f_E=4", "director": "f_E=5", "executive": "f_E=6"}
    if experience in experience_map:
        filters.append(experience_map[experience])

    search_url = f"https://www.linkedin.com/jobs/search/?{quote_plus(query)}"
    if location:
        search_url += f"&location={quote_plus(location)}"
    for f in filters:
        search_url += f"&{f}"
    search_url += f"&position=1&pageNum=0&start=0"

    headers = build_browser_headers()
    session = load_session()
    if session:
        cookie_str = "; ".join([f"{c['name']}={c['value']}" for c in session if "linkedin.com" in c.get("domain", "")])
        if cookie_str:
            headers["Cookie"] = cookie_str

    async with httpx.AsyncClient(follow_redirects=True, timeout=15) as client:
        try:
            resp = await client.get(search_url, headers=headers)
            if resp.status_code != 200:
                return {"error": f"LinkedIn returned status {resp.status_code}", "query": query}

            from bs4 import BeautifulSoup
            soup = BeautifulSoup(resp.text, "html.parser")

            jobs = []
            job_cards = soup.select("li.job-card-container, li.artdeco-list__item, div.job-search-card")

            for card in job_cards[:max_results]:
                title_el = card.select_one("h3, .job-search-card__title, a[data-tracking-control-name]")
                company_el = card.select_one(".job-search-card__company-name, .artdeco-entity-lockup__subtitle, h4")
                location_el = card.select_one(".job-search-card__location, .artdeco-entity-lockup__caption")
                date_el = card.select_one("time, .job-search-card__listdate")
                link_el = card.select_one("a[href*='jobs/view']")

                title = title_el.get_text(strip=True) if title_el else ""
                company = company_el.get_text(strip=True) if company_el else ""
                loc = location_el.get_text(strip=True) if location_el else ""
                posted = date_el.get_text(strip=True) if date_el else ""
                job_url = link_el["href"] if link_el and link_el.has_attr("href") else ""

                if title:
                    jobs.append({
                        "title": title,
                        "company": company,
                        "location": loc,
                        "posted_date": posted,
                        "job_url": job_url,
                    })

            return {"query": query, "type": "jobs", "count": len(jobs), "results": jobs}

        except Exception as e:
            return {"error": str(e), "query": query}


async def get_company(company_slug: str):
    """Get company page data. No login required."""
    import httpx

    url = f"https://www.linkedin.com/company/{company_slug}"
    headers = build_browser_headers()
    session = load_session()
    if session:
        cookie_str = "; ".join([f"{c['name']}={c['value']}" for c in session if "linkedin.com" in c.get("domain", "")])
        if cookie_str:
            headers["Cookie"] = cookie_str

    async with httpx.AsyncClient(follow_redirects=True, timeout=15) as client:
        try:
            resp = await client.get(url, headers=headers)
            if resp.status_code != 200:
                return {"error": f"LinkedIn returned status {resp.status_code}", "company": company_slug}

            from bs4 import BeautifulSoup
            soup = BeautifulSoup(resp.text, "html.parser")

            company_data = {"name": company_slug, "tagline": "", "industry": "", "company_size": "", "headquarters": "", "website": "", "founded": "", "specialties": []}

            # Extract from meta tags
            og_title = soup.select_one('meta[property="og:title"]')
            og_desc = soup.select_one('meta[property="og:description"]')
            if og_title:
                company_data["name"] = og_title.get("content", company_slug).replace(" | LinkedIn", "").strip()
            if og_desc:
                company_data["tagline"] = og_desc.get("content", "")

            # Extract from page content
            for el in soup.select("div.org-top-card"):
                desc_el = el.select_one("p, .org-top-card__tagline")
                if desc_el:
                    company_data["tagline"] = desc_el.get_text(strip=True)

            for el in soup.select("dd, span"):
                text = el.get_text(strip=True)
                if "employees" in text.lower() or "employee" in text.lower():
                    company_data["company_size"] = text
                elif text in ["Technology", "Financial Services", "Healthcare", "Manufacturing"]:
                    company_data["industry"] = text

            return company_data

        except Exception as e:
            return {"error": str(e), "company": company_slug}


async def get_profile(username: str):
    """Get a LinkedIn profile. Full data requires login session."""
    import httpx

    url = f"https://www.linkedin.com/in/{username}"
    headers = build_browser_headers()
    session = load_session()
    has_session = False

    if session:
        cookie_str = "; ".join([f"{c['name']}={c['value']}" for c in session if "linkedin.com" in c.get("domain", "")])
        if cookie_str:
            headers["Cookie"] = cookie_str
            has_session = True

    async with httpx.AsyncClient(follow_redirects=True, timeout=15) as client:
        try:
            resp = await client.get(url, headers=headers)
            if resp.status_code != 200:
                return {"error": f"LinkedIn returned status {resp.status_code}", "username": username}

            from bs4 import BeautifulSoup
            soup = BeautifulSoup(resp.text, "html.parser")

            profile = {
                "name": "",
                "headline": "",
                "location": "",
                "current_title": "",
                "current_company": "",
                "connections": "",
                "skills": [],
                "profile_url": url,
            }

            # Meta tags
            og_title = soup.select_one('meta[property="og:title"]')
            og_desc = soup.select_one('meta[property="og:description"]')
            if og_title:
                raw = og_title.get("content", "")
                profile["name"] = raw.split("|")[0].strip().split(" - ")[0].strip()
            if og_desc:
                desc = og_desc.get("content", "")
                parts = [p.strip() for p in desc.split("|")]
                if len(parts) >= 2:
                    if not profile["name"]:
                        profile["name"] = parts[0]
                    profile["headline"] = parts[1]
                else:
                    profile["headline"] = desc[:200]

            # Try structured data
            for script in soup.select('script[type="application/ld+json"]'):
                try:
                    data = json.loads(script.string)
                    if isinstance(data, dict):
                        if data.get("@type") in ["Person", "ProfilePage"]:
                            profile["name"] = profile["name"] or data.get("name", "")
                            profile["headline"] = profile["headline"] or data.get("jobTitle", "")
                            if data.get("description"):
                                profile["headline"] = profile["headline"] or data["description"][:200]
                            if data.get("address", {}).get("addressLocality"):
                                profile["location"] = data["address"]["addressLocality"]
                except Exception:
                    pass

            # Page elements
            h1 = soup.select_one("h1")
            if h1:
                profile["name"] = profile["name"] or h1.get_text(strip=True)

            headline_el = soup.select_one(".text-body-medium.break-words, .pv-text-details__left-panel h2")
            if headline_el:
                profile["headline"] = profile["headline"] or headline_el.get_text(strip=True)

            location_el = soup.select_one(".text-body-small.inline.t-black--light.break-words, .pv-text-details__left-panel .pb2")
            if location_el:
                profile["location"] = location_el.get_text(strip=True)

            # Experience parsing
            if has_session:
                experience_section = soup.select_one("#experience")
                if experience_section:
                    parent = experience_section.find_parent("section")
                    if parent:
                        for item in parent.select("li.artdeco-list__item"):
                            spans = item.select("span[aria-hidden='true']")
                            if len(spans) >= 2:
                                profile["current_title"] = spans[0].get_text(strip=True)
                                profile["current_company"] = spans[1].get_text(strip=True).split("·")[0].strip()
                                break

                # Skills
                skills_section = soup.select_one("#skills")
                if skills_section:
                    parent = skills_section.find_parent("section")
                    if parent:
                        for span in parent.select("span[aria-hidden='true']"):
                            skill = span.get_text(strip=True)
                            if skill and 1 < len(skill) < 100 and skill not in profile["skills"]:
                                profile["skills"].append(skill)

                # Connections
                conn_el = soup.select_one(".pv-text-details__left-panel .dist-value")
                if conn_el:
                    profile["connections"] = conn_el.get_text(strip=True)

            return profile

        except Exception as e:
            return {"error": str(e), "username": username}


async def search_people(query: str, company: str = "", location: str = "", max_results: int = 20):
    """Search for people on LinkedIn. Login required."""
    session = load_session()
    if not session:
        return {"error": "Login required for people search. Use the login tool first.", "query": query}

    import httpx

    search_params = {"keywords": query}
    if company:
        search_params["keywords"] += f" {company}"
    if location:
        search_params["location"] = location

    search_url = f"https://www.linkedin.com/search/results/people/?keywords={quote_plus(search_params['keywords'])}"
    if location:
        search_url += f"&geoUrn=%5B%22{quote_plus(location)}%22%5D"

    headers = build_browser_headers()
    cookie_str = "; ".join([f"{c['name']}={c['value']}" for c in session if "linkedin.com" in c.get("domain", "")])
    if cookie_str:
        headers["Cookie"] = cookie_str

    async with httpx.AsyncClient(follow_redirects=True, timeout=15) as client:
        try:
            resp = await client.get(search_url, headers=headers)
            if resp.status_code != 200:
                return {"error": f"LinkedIn returned status {resp.status_code}", "query": query}

            from bs4 import BeautifulSoup
            soup = BeautifulSoup(resp.text, "html.parser")

            people = []
            for card in soup.select("li.reusable-search__result-container, div.entity-result")[:max_results]:
                name_el = card.select_one("span.entity-result__title-text a span[aria-hidden='true'], a.app-aware-link span[aria-hidden='true']")
                headline_el = card.select_one("div.entity-result__primary-subtitle, span.entity-result__headline")
                location_el = card.select_one("div.entity-result__secondary-subtitle, span.entity-result__location")
                link_el = card.select_one("a.app-aware-link[href*='/in/']")

                name = name_el.get_text(strip=True) if name_el else ""
                headline = headline_el.get_text(strip=True) if headline_el else ""
                loc = location_el.get_text(strip=True) if location_el else ""
                profile_url = link_el["href"] if link_el and link_el.has_attr("href") else ""

                if name:
                    people.append({"name": name, "headline": headline, "location": loc, "profile_url": profile_url})

            return {"query": query, "type": "people", "count": len(people), "results": people}

        except Exception as e:
            return {"error": str(e), "query": query}


@server.list_tools()
async def list_tools():
    return [
        Tool(
            name="login",
            description="Open a browser window for manual LinkedIn login. You only need to do this once. Session cookies are saved locally.",
            inputSchema={"type": "object", "properties": {}, "required": []},
        ),
        Tool(
            name="search_jobs",
            description="Search LinkedIn job postings with filters. No login required.",
            inputSchema={
                "type": "object",
                "properties": {
                    "query": {"type": "string", "description": "Job search query (e.g. 'python developer')"},
                    "location": {"type": "string", "description": "Job location (e.g. 'Dubai', 'San Francisco')"},
                    "remote": {"type": "string", "enum": ["remote", "onsite", "hybrid"], "description": "Work type filter"},
                    "job_type": {"type": "string", "enum": ["full-time", "part-time", "contract", "internship"], "description": "Job type filter"},
                    "experience": {"type": "string", "enum": ["entry", "mid-senior", "director", "executive"], "description": "Experience level filter"},
                    "max_results": {"type": "integer", "description": "Maximum results to return (default 25)"},
                },
                "required": ["query"],
            },
        ),
        Tool(
            name="get_company",
            description="Get LinkedIn company page data. No login required.",
            inputSchema={
                "type": "object",
                "properties": {
                    "company_slug": {"type": "string", "description": "LinkedIn company slug (e.g. 'google', 'microsoft')"},
                },
                "required": ["company_slug"],
            },
        ),
        Tool(
            name="get_profile",
            description="Get a LinkedIn profile. Full data (experience, skills) requires login session.",
            inputSchema={
                "type": "object",
                "properties": {
                    "username": {"type": "string", "description": "LinkedIn profile username/slug (e.g. 'johndoe')"},
                },
                "required": ["username"],
            },
        ),
        Tool(
            name="search_people",
            description="Search for people by keywords, company, title, or location. Login required.",
            inputSchema={
                "type": "object",
                "properties": {
                    "query": {"type": "string", "description": "Search query (e.g. 'CTO', 'python developer')"},
                    "company": {"type": "string", "description": "Filter by company name"},
                    "location": {"type": "string", "description": "Filter by location"},
                    "max_results": {"type": "integer", "description": "Maximum results (default 20)"},
                },
                "required": ["query"],
            },
        ),
    ]


@server.call_tool()
async def call_tool(name: str, arguments: dict):
    if name == "login":
        return await login_tool()
    elif name == "search_jobs":
        result = await search_jobs(
            query=arguments["query"],
            location=arguments.get("location", ""),
            remote=arguments.get("remote", ""),
            job_type=arguments.get("job_type", ""),
            experience=arguments.get("experience", ""),
            max_results=arguments.get("max_results", 25),
        )
        return [TextContent(type="text", text=json.dumps(result, indent=2))]
    elif name == "get_company":
        result = await get_company(arguments["company_slug"])
        return [TextContent(type="text", text=json.dumps(result, indent=2))]
    elif name == "get_profile":
        result = await get_profile(arguments["username"])
        return [TextContent(type="text", text=json.dumps(result, indent=2))]
    elif name == "search_people":
        result = await search_people(
            query=arguments["query"],
            company=arguments.get("company", ""),
            location=arguments.get("location", ""),
            max_results=arguments.get("max_results", 20),
        )
        return [TextContent(type="text", text=json.dumps(result, indent=2))]
    else:
        return [TextContent(type="text", text=f"Unknown tool: {name}")]


async def main():
    async with stdio_server() as (read_stream, write_stream):
        await server.run(read_stream, write_stream, server.create_initialization_options())


if __name__ == "__main__":
    asyncio.run(main())
