#!/usr/bin/env python3
"""
Verify Stanford Encyclopedia of Philosophy and other academic sources.
"""

import requests
import time

def verify_url(url: str, timeout: int = 10) -> tuple[bool, int]:
    """Verify if a URL is accessible."""
    headers = {
        'User-Agent': 'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36'
    }
    try:
        response = requests.head(url, headers=headers, timeout=timeout, allow_redirects=True)
        return response.status_code == 200, response.status_code
    except Exception:
        try:
            response = requests.get(url, headers=headers, timeout=timeout)
            return response.status_code == 200, response.status_code
        except Exception as e:
            return False, 0

# Stanford Encyclopedia of Philosophy - Topics relevant to Indian philosophy/literature
STANFORD_URLS = {
    'vedas': 'https://plato.stanford.edu/entries/vedas/',
    'yoga': 'https://plato.stanford.edu/entries/yoga/',
    'indian_philosophy': 'https://plato.stanford.edu/entries/hindu-phil/',
    'buddhism': 'https://plato.stanford.edu/entries/buddha/',
    'jainism': 'https://plato.stanford.edu/entries/jainism/',
    'logic_india': 'https://plato.stanford.edu/entries/logic-india/',
    'epistemology_india': 'https://plato.stanford.edu/entries/epistemology-india/',
    'metaphysics_india': 'https://plato.stanford.edu/entries/metaphysics-india/',
    'ethics_india': 'https://plato.stanford.edu/entries/ethics-india/',
    'tagore': 'https://plato.stanford.edu/entries/tagore/',
    'gandhi': 'https://plato.stanford.edu/entries/gandhi/',
    'aurobindo': 'https://plato.stanford.edu/entries/aurobindo/',
}

# Sahitya Akademi - Check various URL patterns
AKADEMI_PATTERNS = [
    'https://sahitya-akademi.gov.in/',
    'https://sahitya-akademi.gov.in/awards',
    'https://sahitya-akademi.gov.in/library',
]

print("=" * 70)
print("VERIFYING STANFORD ENCYCLOPEDIA OF PHILOSOPHY")
print("=" * 70)

stanford_working = []
stanford_broken = []

for topic, url in STANFORD_URLS.items():
    print(f"\nChecking: {topic}")
    print(f"URL: {url}")

    works, status_code = verify_url(url)

    if works:
        print(f"✓ WORKING (HTTP {status_code})")
        stanford_working.append((topic, url))
    else:
        print(f"✗ BROKEN (HTTP {status_code})")
        stanford_broken.append((topic, url))

    time.sleep(0.5)

print("\n" + "=" * 70)
print("STANFORD SUMMARY")
print("=" * 70)
print(f"Working: {len(stanford_working)}")
print(f"Broken: {len(stanford_broken)}")

if stanford_working:
    print("\n✓ VERIFIED STANFORD URLS:")
    for topic, url in stanford_working:
        print(f"  - {topic}: {url}")

print("\n" + "=" * 70)
print("CHECKING SAHITYA AKADEMI")
print("=" * 70)

for url in AKADEMI_PATTERNS:
    print(f"\nChecking: {url}")
    works, status_code = verify_url(url)

    if works:
        print(f"✓ WORKING (HTTP {status_code})")
    else:
        print(f"✗ BROKEN (HTTP {status_code})")

    time.sleep(0.5)

print("\n" + "=" * 70)
print("ANALYSIS")
print("=" * 70)
print("""
STANFORD ENCYCLOPEDIA:
- Excellent for philosophical works (Vedas, Upanishads, yoga texts)
- Authoritative, peer-reviewed articles
- Very stable URLs
- Free and open access

SAHITYA AKADEMI:
- Main site exists but specific author pages unclear
- Need to investigate site structure more
- May not have direct author/work pages
- Recommendation: Skip unless specific verified URLs found

RECOMMENDATION:
- Add Stanford Encyclopedia references for philosophical/religious works
- Skip Sahitya Akademi unless specific pages are found and verified
""")
