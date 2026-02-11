"""Screenshot tool: take_screenshot."""

import re
import time

from ._common import SCREENSHOTS_DIR

TOOL_DEFS = [
    {
        "name": "take_screenshot",
        "description": "Capture a screenshot of a webpage URL. Saves a PNG to ~/.dyno/screenshots/. Requires playwright to be installed.",
        "input_schema": {
            "type": "object",
            "properties": {
                "url": {
                    "type": "string",
                    "description": "The URL of the webpage to screenshot (e.g. 'https://example.com')"
                }
            },
            "required": ["url"]
        }
    },
]

READ_ONLY = {"take_screenshot"}


async def handle_take_screenshot(input_data: dict) -> str:
    url = input_data["url"]
    try:
        from playwright.async_api import async_playwright
    except ImportError:
        return "Error: playwright is not installed. Run: pip install playwright && python -m playwright install chromium"

    slug = re.sub(r'[^a-zA-Z0-9]+', '-', url.split("//")[-1])[:50].strip('-')
    ts = int(time.time())
    filename = f"{slug}-{ts}.png"
    filepath = SCREENSHOTS_DIR / filename

    try:
        async with async_playwright() as p:
            browser = await p.chromium.launch()
            page = await browser.new_page(viewport={"width": 1280, "height": 720})
            await page.goto(url, timeout=15000, wait_until="networkidle")
            await page.screenshot(path=str(filepath))
            await browser.close()

        size = filepath.stat().st_size
        return f"Screenshot saved: {filename} ({size} bytes)"
    except Exception as e:
        return f"Error taking screenshot: {str(e)}"


HANDLERS = {
    "take_screenshot": handle_take_screenshot,
}
