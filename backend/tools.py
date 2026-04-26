"""
Tool definitions for the ElectionGuide assistant.
All tools are standard Python functions with type annotations and docstrings.
"""
import subprocess
import shutil
import json
import logging
import httpx
from typing import List
from bs4 import BeautifulSoup

logger = logging.getLogger(__name__)

# Detect if gsearch CLI is available
GSEARCH_AVAILABLE = shutil.which("gsearch") is not None
logger.info(f"gsearch available: {GSEARCH_AVAILABLE}")


def search(query: str) -> str:
    """
    Search the web for information related to the given query.
    Use this tool to find current, accurate information about elections,
    voting schedules, ECI announcements, election laws, and civic processes.
    Always call this before stating any specific date, threshold, rule, or fact.

    Args:
        query: The search query string describing what information is needed.

    Returns:
        Search results as a formatted string with titles and snippets.
    """
    if GSEARCH_AVAILABLE:
        try:
            result = subprocess.run(
                ["gsearch", query],
                capture_output=True,
                text=True,
                timeout=15
            )
            if result.returncode == 0 and result.stdout:
                return result.stdout[:4000]
            return f"Search returned no results for: {query}"
        except Exception as e:
            logger.error(f"gsearch error: {e}")
            return f"Search failed: {str(e)}"

    try:
        headers = {
            "User-Agent": (
                "Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 "
                "(KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36"
            ),
            "Accept-Language": "en-US,en;q=0.9",
        }
        with httpx.Client(timeout=15.0, follow_redirects=True) as client:
            response = client.get(
                "https://html.duckduckgo.com/html/",
                params={"q": query},
                headers=headers,
            )
            response.raise_for_status()

        soup = BeautifulSoup(response.text, "html.parser")
        results = []
        for item in soup.select(".result")[:5]:
            title_el = item.select_one(".result__title a") or item.select_one("a.result__a")
            snippet_el = item.select_one(".result__snippet")
            url_el = item.select_one(".result__url") or title_el
            title = title_el.get_text(" ", strip=True) if title_el else ""
            snippet = snippet_el.get_text(" ", strip=True) if snippet_el else ""
            url = title_el.get("href", "") if title_el else ""
            if not title:
                continue
            results.append({
                "title": title,
                "url": url or (url_el.get_text(" ", strip=True) if url_el else ""),
                "snippet": snippet,
            })

        if not results:
            return f"Search returned no results for: {query}"

        return "\n\n".join(
            f"{idx}. {item['title']}\n{item['url']}\n{item['snippet']}".strip()
            for idx, item in enumerate(results, start=1)
        )
    except Exception as e:
        logger.error(f"fallback search error: {e}")
        return f"Search failed: {str(e)}"


import io
from pypdf import PdfReader

def fetch_url(url: str) -> str:
    """
    Fetch and extract readable text content from a web page URL or PDF file.
    Prioritize official sources: eci.gov.in, indiavotes.gov.in, indiankanoon.org,
    pib.gov.in, and reputable Indian news outlets.
    Use this to get detailed, authoritative information about election rules,
    schedules, candidate eligibility, voter registration processes, etc.

    Args:
        url: The full URL of the web page or PDF to fetch.

    Returns:
        Clean readable text content extracted from the page/document.
    """
    try:
        headers = {
            "User-Agent": (
                "Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 "
                "(KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36"
            ),
            "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,application/pdf,*/*;q=0.8",
            "Accept-Language": "en-IN,en;q=0.9,hi;q=0.8",
        }
        with httpx.Client(timeout=15.0, follow_redirects=True) as client:
            response = client.get(url, headers=headers)
            response.raise_for_status()

        content_type = response.headers.get("Content-Type", "").lower()

        if "application/pdf" in content_type or url.lower().endswith(".pdf"):
            try:
                reader = PdfReader(io.BytesIO(response.content))
                text_parts = []
                # Extract text from up to 20 pages to avoid huge outputs
                for i, page in enumerate(reader.pages[:20]):
                    text = page.extract_text()
                    if text:
                        text_parts.append(text)
                cleaned = "\n".join(text_parts)
                return cleaned[:10000] if len(cleaned) > 10000 else cleaned
            except Exception as pdf_err:
                logger.error(f"PDF parsing error: {pdf_err}")
                return f"Error parsing PDF content from {url}: {str(pdf_err)}"

        soup = BeautifulSoup(response.text, "html.parser")

        # Remove noise
        for tag in soup(["script", "style", "nav", "footer", "header", "aside", "iframe", "noscript"]):
            tag.decompose()

        # Extract meaningful text
        text = soup.get_text(separator="\n", strip=True)

        # Clean up excessive whitespace
        lines = [line.strip() for line in text.splitlines() if line.strip()]
        cleaned = "\n".join(lines)

        return cleaned[:5000] if len(cleaned) > 5000 else cleaned

    except httpx.HTTPStatusError as e:
        return f"HTTP error fetching {url}: {e.response.status_code}"
    except Exception as e:
        logger.error(f"fetch_url error: {e}")
        return f"Could not fetch {url}: {str(e)}"


def render_timeline(steps: List[dict]) -> str:
    """
    Render a visual election process timeline in the UI.
    Call this tool whenever explaining a multi-phase election process,
    voter registration steps, candidature filing procedure, election schedule,
    or any sequential civic process that has 3 or more steps.
    The frontend will display this as a beautiful visual stepper component.

    Args:
        steps: List of step dictionaries, each containing:
               - phase: Phase number or label (e.g., "Phase 1", "Step A")
               - title: Short title for this step
               - description: Detailed explanation of what happens in this step
               - date_or_duration: Specific date, deadline, or time duration

    Returns:
        Confirmation string that the timeline has been rendered.
    """
    try:
        # Validate steps format
        validated = []
        for step in steps:
            validated.append({
                "phase": str(step.get("phase", "")),
                "title": str(step.get("title", "")),
                "description": str(step.get("description", "")),
                "date_or_duration": str(step.get("date_or_duration", ""))
            })
        return json.dumps({"status": "timeline_rendered", "steps": validated})
    except Exception as e:
        return f"Timeline rendering failed: {str(e)}"


def get_election_schedule() -> str:
    """
    Fetch the current and upcoming election schedule from the Election Commission
    of India (ECI) website. Use this to get authoritative, up-to-date information
    about scheduled elections, polling dates, counting dates, and result dates.

    Returns:
        Current election schedule as structured text from the ECI website.
    """
    eci_urls = [
        "https://eci.gov.in/elections/",
        "https://eci.gov.in/upcoming-election/",
        "https://eci.gov.in/",
    ]

    for url in eci_urls:
        result = fetch_url(url)
        if result and len(result) > 200 and "error" not in result.lower()[:50]:
            return f"Election Schedule from ECI ({url}):\n\n{result}"

    # Fallback to indiavotes
    result = fetch_url("https://www.indiavotes.com/")
    if result and len(result) > 200:
        return f"Election data from IndiaVotes:\n\n{result}"

    return "Unable to fetch current election schedule. Please visit https://eci.gov.in for the latest information."


# Export all tools as a list of callable functions
TOOLS = [search, fetch_url, render_timeline, get_election_schedule]
