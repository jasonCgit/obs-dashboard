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
    raw = page.screenshot()
    return Image.open(BytesIO(raw)).convert("RGB")


def save_gif(frames: list, name: str, fps: int = 5):
    path = OUT_DIR / name
    durations = [1000 // fps] * len(frames)
    durations[-1] = 2000
    frames[0].save(
        path, save_all=True, append_images=frames[1:],
        loop=0, duration=durations, optimize=True,
    )
    size_mb = path.stat().st_size / (1024 * 1024)
    print(f"  saved  {name}  ({len(frames)} frames, {size_mb:.1f} MB)")


def scroll_page(page, frames, start=0, end=2000, step=120, delay=80):
    for y in range(start, end, step):
        page.evaluate(f"window.scrollTo(0,{y})")
        page.wait_for_timeout(delay)
        frames.append(shot(page))


def add_tab_if_needed(page, label):
    """Click the + button and add a tab if it's not already open."""
    try:
        add_btn = page.locator('[data-testid="AddIcon"]').first
        if not add_btn.is_visible(timeout=500):
            return
        add_btn.click()
        page.wait_for_timeout(300)
        page.get_by_role("menuitem", name=label).click()
        page.wait_for_timeout(600)
    except Exception:
        pass


# ── GIF 1 — Dashboard overview (Home) ───────────────────────────────────────

def gif_dashboard(page):
    print("Capturing dashboard-overview.gif ...")
    frames = []
    page.goto(BASE_URL, wait_until="networkidle")
    page.wait_for_timeout(600)
    for _ in range(3):
        frames.append(shot(page))
        page.wait_for_timeout(180)
    scroll_page(page, frames, 0, 2000, 120, 80)
    page.evaluate("window.scrollTo(0,0)")
    page.wait_for_timeout(300)
    for _ in range(3):
        frames.append(shot(page))
    save_gif(frames, "dashboard-overview.gif", fps=6)


# ── GIF 2 — Favorites ───────────────────────────────────────────────────────

def gif_favorites(page):
    print("Capturing favorites.gif ...")
    frames = []
    # Ensure View Centrals are seeded and some are favorited
    page.goto(f"{BASE_URL}/view-central", wait_until="networkidle")
    page.wait_for_timeout(800)
    page.evaluate("""() => {
        const KEY = 'obs-view-centrals';
        const views = JSON.parse(localStorage.getItem(KEY) || '[]');
        views.forEach(v => { v.favorite = true; });
        localStorage.setItem(KEY, JSON.stringify(views));
    }""")
    page.goto(f"{BASE_URL}/favorites", wait_until="networkidle")
    page.wait_for_timeout(600)
    for _ in range(4):
        frames.append(shot(page))
        page.wait_for_timeout(180)
    scroll_page(page, frames, 0, 600, 100, 80)
    save_gif(frames, "favorites.gif", fps=5)


# ── GIF 3 — View Central ────────────────────────────────────────────────────

def gif_view_central(page):
    print("Capturing view-central.gif ...")
    frames = []
    page.goto(f"{BASE_URL}/view-central", wait_until="networkidle")
    page.wait_for_timeout(600)
    for _ in range(3):
        frames.append(shot(page))
        page.wait_for_timeout(150)
    scroll_page(page, frames, 0, 1400, 100, 80)
    save_gif(frames, "view-central.gif", fps=5)


# ── GIF 4 — Product Catalog ─────────────────────────────────────────────────

def gif_product_catalog(page):
    print("Capturing product-catalog.gif ...")
    frames = []
    page.goto(f"{BASE_URL}/product-catalog", wait_until="networkidle")
    page.wait_for_timeout(600)
    for _ in range(3):
        frames.append(shot(page))
        page.wait_for_timeout(150)
    scroll_page(page, frames, 0, 1000, 100, 80)
    save_gif(frames, "product-catalog.gif", fps=5)


# ── GIF 5 — Applications ────────────────────────────────────────────────────

def gif_applications(page):
    print("Capturing applications.gif ...")
    frames = []
    page.goto(f"{BASE_URL}/applications", wait_until="networkidle")
    page.wait_for_timeout(600)
    for _ in range(4):
        frames.append(shot(page))
        page.wait_for_timeout(150)
    for label in ["Critical", "Warning", "Healthy", "All"]:
        try:
            page.get_by_role("button", name=label).click()
            page.wait_for_timeout(400)
            for _ in range(3):
                frames.append(shot(page))
                page.wait_for_timeout(120)
        except Exception:
            pass
    save_gif(frames, "applications.gif", fps=4)


# ── GIF 6 — Blast Radius (Dependency Graphs) ────────────────────────────────

def gif_blast_radius(page):
    print("Capturing blast-radius.gif ...")
    frames = []
    page.goto(f"{BASE_URL}/graph", wait_until="networkidle")
    page.wait_for_timeout(800)
    for _ in range(4):
        frames.append(shot(page))
        page.wait_for_timeout(200)

    # Switch between scenarios via the dropdown
    try:
        select = page.locator(".MuiSelect-select").first
        select.click()
        page.wait_for_timeout(400)
        options = page.locator(".MuiMenuItem-root").all()
        for opt in options[:3]:
            opt.click()
            page.wait_for_timeout(1200)
            for _ in range(3):
                frames.append(shot(page))
                page.wait_for_timeout(200)
            # Reopen dropdown for next option
            if opt != options[2]:
                select = page.locator(".MuiSelect-select").first
                select.click()
                page.wait_for_timeout(400)
    except Exception:
        for _ in range(6):
            frames.append(shot(page))
            page.wait_for_timeout(200)

    # Click on nodes to show edge highlighting
    try:
        # Click root node — highlights all its connected edges
        root_node = page.locator(".react-flow__node").first
        root_node.click()
        page.wait_for_timeout(800)
        for _ in range(5):
            frames.append(shot(page))
            page.wait_for_timeout(200)

        # Click a dependency node — shifts highlights to its edges
        dep_nodes = page.locator(".react-flow__node").all()
        if len(dep_nodes) > 2:
            dep_nodes[2].click()
            page.wait_for_timeout(800)
            for _ in range(5):
                frames.append(shot(page))
                page.wait_for_timeout(200)

        # Click another node deeper in the graph
        if len(dep_nodes) > 5:
            dep_nodes[5].click()
            page.wait_for_timeout(800)
            for _ in range(5):
                frames.append(shot(page))
                page.wait_for_timeout(200)

        # Click an edge directly (force=True needed for SVG path interception)
        edge_paths = page.locator(".react-flow__edge").all()
        if len(edge_paths) > 1:
            edge_paths[1].click(force=True)
            page.wait_for_timeout(800)
            for _ in range(5):
                frames.append(shot(page))
                page.wait_for_timeout(200)

        # Click background to clear all highlights
        page.locator(".react-flow__pane").click(force=True)
        page.wait_for_timeout(500)
        for _ in range(3):
            frames.append(shot(page))
            page.wait_for_timeout(200)
    except Exception:
        pass

    save_gif(frames, "blast-radius.gif", fps=4)


# ── GIF 7 — Customer Journey ────────────────────────────────────────────────

def gif_customer_journey(page):
    print("Capturing customer-journey.gif ...")
    frames = []
    page.goto(f"{BASE_URL}/customer-journey", wait_until="networkidle")
    page.wait_for_timeout(600)
    for _ in range(4):
        frames.append(shot(page))
        page.wait_for_timeout(150)
    for label in ["Client Login", "Document Delivery", "Trade Execution"]:
        try:
            page.get_by_role("button", name=label).click()
            page.wait_for_timeout(500)
            for _ in range(4):
                frames.append(shot(page))
                page.wait_for_timeout(150)
        except Exception:
            pass
    save_gif(frames, "customer-journey.gif", fps=4)


# ── GIF 8 — SLO Agent ───────────────────────────────────────────────────────

def gif_slo_agent(page):
    print("Capturing slo-agent.gif ...")
    frames = []
    page.goto(f"{BASE_URL}/slo-agent", wait_until="networkidle")
    page.wait_for_timeout(600)
    for _ in range(4):
        frames.append(shot(page))
        page.wait_for_timeout(150)
    scroll_page(page, frames, 0, 1200, 80, 80)
    save_gif(frames, "slo-agent.gif", fps=5)


# ── GIF 9 — Announcements ───────────────────────────────────────────────────

def gif_announcements(page):
    print("Capturing announcements.gif ...")
    frames = []
    page.goto(f"{BASE_URL}/announcements", wait_until="networkidle")
    # Wait for announcement cards to render (API fetch + React render)
    try:
        page.locator(".MuiCard-root").first.wait_for(timeout=5000)
    except Exception:
        pass
    page.wait_for_timeout(500)
    for _ in range(4):
        frames.append(shot(page))
        page.wait_for_timeout(200)
    # Cycle type filters via ToggleButton
    for label in ["Incident", "Maintenance", "Security", "All"]:
        try:
            btn = page.locator(f'button[value="{label.lower()}"], button:has-text("{label}")').first
            btn.click()
            page.wait_for_timeout(500)
            for _ in range(3):
                frames.append(shot(page))
                page.wait_for_timeout(150)
        except Exception:
            pass
    # Toggle show closed
    try:
        page.locator(".MuiSwitch-switchBase").first.click()
        page.wait_for_timeout(500)
        for _ in range(3):
            frames.append(shot(page))
            page.wait_for_timeout(150)
    except Exception:
        pass
    # Scroll to see all
    scroll_page(page, frames, 0, 600, 120, 80)
    save_gif(frames, "announcements.gif", fps=4)


# ── GIF 10 — Links ──────────────────────────────────────────────────────────

def gif_links(page):
    print("Capturing links.gif ...")
    frames = []
    page.goto(f"{BASE_URL}/links", wait_until="networkidle")
    page.wait_for_timeout(600)
    for _ in range(3):
        frames.append(shot(page))
        page.wait_for_timeout(150)
    scroll_page(page, frames, 0, 1600, 100, 80)
    save_gif(frames, "links.gif", fps=5)


# ── GIF 11 — Draggable Tabs + Dark / Light mode toggle ────────────────────

def gif_tabs_and_theme(page):
    print("Capturing tabs-and-theme.gif ...")
    frames = []
    page.goto(BASE_URL, wait_until="networkidle")
    page.wait_for_timeout(600)

    # Clear localStorage so only Home tab is open
    page.evaluate("localStorage.removeItem('obs-open-tabs')")
    page.reload(wait_until="networkidle")
    page.wait_for_timeout(600)

    # Show starting state (only Home tab)
    for _ in range(3):
        frames.append(shot(page))
        page.wait_for_timeout(200)

    # Add several tabs via the + button
    for label in ["Favorites", "View Central", "Blast Radius", "Applications"]:
        try:
            add_btn = page.locator('[data-testid="AddIcon"]').first
            add_btn.click()
            page.wait_for_timeout(400)
            page.get_by_role("menuitem", name=label).click()
            page.wait_for_timeout(500)
            for _ in range(2):
                frames.append(shot(page))
                page.wait_for_timeout(150)
        except Exception:
            pass

    # Capture tabs in their original order
    for _ in range(3):
        frames.append(shot(page))
        page.wait_for_timeout(200)

    # Drag-and-drop: reorder "Blast Radius" tab before "Favorites"
    try:
        source = page.locator("button:has-text('Blast Radius')").first
        target = page.locator("button:has-text('Favorites')").first
        source.drag_to(target)
        page.wait_for_timeout(600)
        for _ in range(3):
            frames.append(shot(page))
            page.wait_for_timeout(200)
    except Exception:
        pass

    # Drag-and-drop: move "Applications" before "View Central"
    try:
        source = page.locator("button:has-text('Applications')").first
        target = page.locator("button:has-text('View Central')").first
        source.drag_to(target)
        page.wait_for_timeout(600)
        for _ in range(3):
            frames.append(shot(page))
            page.wait_for_timeout(200)
    except Exception:
        pass

    # Close one tab (Blast Radius) via × button
    try:
        # Hover over the Blast Radius tab to reveal the close button
        br_tab = page.locator("button:has-text('Blast Radius')").first
        br_tab.hover()
        page.wait_for_timeout(300)
        # Click the close icon next to it
        close_btn = br_tab.locator("..").locator('[data-testid="CloseIcon"]').first
        close_btn.click()
        page.wait_for_timeout(500)
        for _ in range(2):
            frames.append(shot(page))
            page.wait_for_timeout(200)
    except Exception:
        pass

    # Navigate back to Home for the theme toggle demo
    page.goto(BASE_URL, wait_until="networkidle")
    page.wait_for_timeout(400)
    for _ in range(3):
        frames.append(shot(page))
        page.wait_for_timeout(200)

    # Toggle to light mode
    try:
        toggle = page.locator('[data-testid="LightModeIcon"], [data-testid="DarkModeIcon"]').first
        toggle.click()
        page.wait_for_timeout(600)
    except Exception:
        pass
    for _ in range(4):
        frames.append(shot(page))
        page.wait_for_timeout(200)

    # Scroll in light mode
    scroll_page(page, frames, 0, 800, 120, 80)

    # Toggle back to dark mode
    try:
        toggle = page.locator('[data-testid="LightModeIcon"], [data-testid="DarkModeIcon"]').first
        toggle.click()
        page.wait_for_timeout(600)
    except Exception:
        pass
    for _ in range(3):
        frames.append(shot(page))
        page.wait_for_timeout(200)

    save_gif(frames, "tabs-and-theme.gif", fps=5)


# ── GIF 12 — Incident Zero ──────────────────────────────────────────────────

def gif_incident_zero(page):
    print("Capturing incident-zero.gif ...")
    frames = []
    page.goto(f"{BASE_URL}/incident-zero", wait_until="networkidle")
    page.wait_for_timeout(600)
    for _ in range(4):
        frames.append(shot(page))
        page.wait_for_timeout(150)
    scroll_page(page, frames, 0, 1200, 80, 80)
    save_gif(frames, "incident-zero.gif", fps=5)


# ── GIF 13 — Admin / Portal Instances ────────────────────────────────────────

def gif_admin(page):
    print("Capturing admin.gif ...")
    frames = []

    # Seed a sample tenant so the admin page isn't empty
    page.goto(BASE_URL, wait_until="networkidle")
    page.evaluate("""() => {
        const KEY = 'obs-tenants';
        const existing = JSON.parse(localStorage.getItem(KEY) || '[]');
        if (existing.length === 0) {
            const sample = {
                id: 'tenant-demo-1',
                name: 'Mission Control',
                title: 'Mission Control',
                subtitle: 'Asset Management',
                logoLetter: 'M',
                logoGradient: ['#7c3aed', '#a78bfa'],
                logoImage: null,
                description: 'purpose-built for Asset Management',
                poweredBy: 'Powered by AWM SRE',
                version: '1.0',
                defaultFilters: {},
                createdAt: new Date().toISOString(),
                updatedAt: new Date().toISOString(),
            };
            localStorage.setItem(KEY, JSON.stringify([sample]));
        }
    }""")

    page.goto(f"{BASE_URL}/admin", wait_until="networkidle")
    page.wait_for_timeout(800)

    # Show the admin page with card grid
    for _ in range(4):
        frames.append(shot(page))
        page.wait_for_timeout(200)

    # Click "Create Instance" button
    try:
        page.get_by_role("button", name="Create Instance").click()
        page.wait_for_timeout(600)
        for _ in range(4):
            frames.append(shot(page))
            page.wait_for_timeout(200)

        # Fill in some fields
        name_field = page.locator('input[name="name"], label:has-text("Instance Name") + div input, #name').first
        if name_field.is_visible(timeout=500):
            name_field.fill("SRE Operations")
            page.wait_for_timeout(300)

        title_field = page.locator('input[name="title"], label:has-text("Portal Title") + div input, #title').first
        if title_field.is_visible(timeout=500):
            title_field.fill("SRE Operations Portal")
            page.wait_for_timeout(300)

        for _ in range(4):
            frames.append(shot(page))
            page.wait_for_timeout(200)

        # Scroll dialog to show more fields
        dialog = page.locator(".MuiDialog-paper").first
        if dialog.is_visible(timeout=500):
            dialog.evaluate("el => el.scrollTop = 300")
            page.wait_for_timeout(400)
            for _ in range(3):
                frames.append(shot(page))
                page.wait_for_timeout(200)

            dialog.evaluate("el => el.scrollTop = 600")
            page.wait_for_timeout(400)
            for _ in range(3):
                frames.append(shot(page))
                page.wait_for_timeout(200)

        # Close dialog
        page.keyboard.press("Escape")
        page.wait_for_timeout(400)
    except Exception:
        pass

    # Show the existing instance card
    for _ in range(3):
        frames.append(shot(page))
        page.wait_for_timeout(200)

    # Scroll to see full cards
    scroll_page(page, frames, 0, 600, 100, 80)

    save_gif(frames, "admin.gif", fps=4)


# ── GIF 14 — Search & Filter ────────────────────────────────────────────────

def gif_search_filter(page):
    print("Capturing search-filter.gif ...")
    frames = []
    page.goto(BASE_URL, wait_until="networkidle")
    page.wait_for_timeout(600)

    # Show initial state
    for _ in range(3):
        frames.append(shot(page))
        page.wait_for_timeout(200)

    # Click the search bar / filter button to open the popover
    try:
        search_btn = page.locator('[data-testid="SearchIcon"]').first
        if search_btn.is_visible(timeout=500):
            search_btn.click()
        else:
            page.locator('[data-testid="FilterListIcon"]').first.click()
        page.wait_for_timeout(600)
        for _ in range(4):
            frames.append(shot(page))
            page.wait_for_timeout(200)

        # Scroll the filter popover if visible
        popover = page.locator(".MuiPopover-paper").first
        if popover.is_visible(timeout=500):
            popover.evaluate("el => el.scrollTop = 200")
            page.wait_for_timeout(400)
            for _ in range(3):
                frames.append(shot(page))
                page.wait_for_timeout(200)

            popover.evaluate("el => el.scrollTop = 400")
            page.wait_for_timeout(400)
            for _ in range(3):
                frames.append(shot(page))
                page.wait_for_timeout(200)

        # Close popover
        page.keyboard.press("Escape")
        page.wait_for_timeout(400)
    except Exception:
        pass

    for _ in range(3):
        frames.append(shot(page))
        page.wait_for_timeout(200)

    save_gif(frames, "search-filter.gif", fps=4)


# ── main ─────────────────────────────────────────────────────────────────────

def main():
    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True)
        page    = browser.new_context(viewport={"width": W, "height": H}).new_page()

        gif_dashboard(page)
        gif_favorites(page)
        gif_view_central(page)
        gif_product_catalog(page)
        gif_applications(page)
        gif_blast_radius(page)
        gif_customer_journey(page)
        gif_slo_agent(page)
        gif_announcements(page)
        gif_links(page)
        gif_tabs_and_theme(page)
        gif_incident_zero(page)
        gif_admin(page)
        gif_search_filter(page)

        browser.close()

    print(f"\nAll GIFs saved to {OUT_DIR}")


if __name__ == "__main__":
    main()
