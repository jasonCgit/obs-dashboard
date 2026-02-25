"""
Captures the obs-dashboard app and assembles GIFs.
Run:  python docs/make_gifs.py
Requires the app running at http://localhost:5174 first.
"""

from io import BytesIO
from pathlib import Path
from PIL import Image
from playwright.sync_api import sync_playwright

BASE_URL = "http://localhost:5174"
OUT_DIR  = Path(__file__).parent / "gifs"
OUT_DIR.mkdir(parents=True, exist_ok=True)
W, H = 1440, 900


# ── helpers ───────────────────────────────────────────────────────────────────

def shot(page) -> Image.Image:
    return Image.open(BytesIO(page.screenshot())).convert("RGB")


def save_gif(frames: list, name: str, fps: int = 5):
    path = OUT_DIR / name
    durations = [1000 // fps] * len(frames)
    durations[-1] = 2000  # hold last frame
    frames[0].save(
        path, save_all=True, append_images=frames[1:],
        loop=0, duration=durations, optimize=True,
    )
    print(f"  saved  {name}  ({len(frames)} frames)")


def select_service(page, hint: str):
    """Type into the Autocomplete and pick the first matching option."""
    inp = page.get_by_placeholder("Select service...")
    inp.click()
    inp.fill("")
    for ch in hint[:8]:
        inp.press_sequentially(ch, delay=60)
    page.wait_for_timeout(500)
    page.locator(".MuiAutocomplete-listbox li").first.click()
    page.wait_for_timeout(900)


# ── GIF 1 — Dashboard overview ────────────────────────────────────────────────

def gif_dashboard(page):
    print("Capturing dashboard-overview.gif ...")
    frames = []

    page.goto(BASE_URL, wait_until="networkidle")
    page.wait_for_timeout(600)

    for _ in range(3):
        frames.append(shot(page))
        page.wait_for_timeout(180)

    for y in range(0, 2000, 100):
        page.evaluate(f"window.scrollTo(0,{y})")
        page.wait_for_timeout(80)
        frames.append(shot(page))

    page.evaluate("window.scrollTo(0,0)")
    page.wait_for_timeout(300)
    for _ in range(3):
        frames.append(shot(page))

    save_gif(frames, "dashboard-overview.gif", fps=6)


# ── GIF 2 — Knowledge graph / dependency view ─────────────────────────────────

def gif_dependencies(page):
    print("Capturing knowledge-graph-dependencies.gif ...")
    frames = []

    page.goto(f"{BASE_URL}/graph", wait_until="networkidle")
    page.wait_for_timeout(800)
    for _ in range(3):
        frames.append(shot(page))

    for hint in ["MERIDIAN", "PAYMENT", "API-GATEWAY"]:
        select_service(page, hint)
        for _ in range(5):
            frames.append(shot(page))
            page.wait_for_timeout(200)

    save_gif(frames, "knowledge-graph-dependencies.gif", fps=4)


# ── GIF 3 — Blast radius view ─────────────────────────────────────────────────

def gif_blast_radius(page):
    print("Capturing blast-radius.gif ...")
    frames = []

    page.goto(f"{BASE_URL}/graph", wait_until="networkidle")
    page.wait_for_timeout(800)

    select_service(page, "POSTGRES")

    # toggle to Blast Radius mode using the ToggleButton
    page.get_by_role("button", name="Blast Radius").click()
    page.wait_for_timeout(800)
    for _ in range(4):
        frames.append(shot(page))
        page.wait_for_timeout(180)

    for hint in ["KAFKA", "REDIS", "MERIDIAN"]:
        select_service(page, hint)
        for _ in range(4):
            frames.append(shot(page))
            page.wait_for_timeout(180)

    save_gif(frames, "blast-radius.gif", fps=4)


# ── GIF 4 — Incident trends chart ─────────────────────────────────────────────

def gif_incident_trends(page):
    print("Capturing incident-trends.gif ...")
    frames = []

    page.goto(BASE_URL, wait_until="networkidle")
    page.wait_for_timeout(600)

    page.evaluate("window.scrollTo(0, document.body.scrollHeight)")
    page.wait_for_timeout(500)
    frames.append(shot(page))

    chart = page.locator(".recharts-wrapper").first
    try:
        chart.wait_for(timeout=4000)
        box = chart.bounding_box()
        if box:
            x0 = box["x"] + 30
            x1 = box["x"] + box["width"] - 30
            y  = box["y"] + box["height"] * 0.55
            for i in range(31):
                page.mouse.move(x0 + (x1 - x0) * i / 30, y)
                page.wait_for_timeout(80)
                frames.append(shot(page))
    except Exception:
        for _ in range(10):
            frames.append(shot(page))
            page.wait_for_timeout(200)

    save_gif(frames, "incident-trends.gif", fps=8)


# ── main ──────────────────────────────────────────────────────────────────────

def main():
    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True)
        page    = browser.new_context(viewport={"width": W, "height": H}).new_page()

        gif_dashboard(page)
        gif_dependencies(page)
        gif_blast_radius(page)
        gif_incident_trends(page)

        browser.close()

    print(f"\nAll GIFs saved to {OUT_DIR}")


if __name__ == "__main__":
    main()
