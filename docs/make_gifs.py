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


# ── GIF 2 — View Central (full feature showcase) ──────────────────────────

def gif_view_central(page):
    print("Capturing view-central.gif ...")
    frames = []

    # Ensure default views are seeded
    page.goto(f"{BASE_URL}/view-central", wait_until="networkidle")
    page.wait_for_timeout(800)

    # Show the listing page with view cards
    for _ in range(4):
        frames.append(shot(page))
        page.wait_for_timeout(200)

    # Scroll listing to show all cards
    scroll_page(page, frames, 0, 400, 100, 80)
    page.evaluate("window.scrollTo(0,0)")
    page.wait_for_timeout(300)

    # Click into the first default dashboard (Spectrum Equities)
    try:
        cards = page.locator(".MuiCard-root").all()
        if len(cards) > 0:
            cards[0].click()
            page.wait_for_timeout(1200)
            for _ in range(5):
                frames.append(shot(page))
                page.wait_for_timeout(250)

            # Scroll the dashboard to show widgets
            scroll_page(page, frames, 0, 800, 120, 80)
            page.evaluate("window.scrollTo(0,0)")
            page.wait_for_timeout(300)
    except Exception:
        pass

    # Click "Edit" to enter edit mode (shows drag handles, dashed borders)
    try:
        edit_btn = page.locator("button:has-text('Edit'), [data-testid='EditIcon']").first
        if edit_btn.is_visible(timeout=500):
            edit_btn.click()
            page.wait_for_timeout(600)
            for _ in range(4):
                frames.append(shot(page))
                page.wait_for_timeout(200)
    except Exception:
        pass

    # Open the Add Widget drawer
    try:
        add_btn = page.locator("button:has-text('Add Widget')").first
        if add_btn.is_visible(timeout=500):
            add_btn.click()
            page.wait_for_timeout(600)
            for _ in range(4):
                frames.append(shot(page))
                page.wait_for_timeout(250)

            # Scroll through available widgets in the drawer
            drawer = page.locator(".MuiDrawer-paper").first
            if drawer.is_visible(timeout=500):
                drawer.evaluate("el => el.scrollTop = 200")
                page.wait_for_timeout(300)
                for _ in range(3):
                    frames.append(shot(page))
                    page.wait_for_timeout(200)

                drawer.evaluate("el => el.scrollTop = 400")
                page.wait_for_timeout(300)
                for _ in range(3):
                    frames.append(shot(page))
                    page.wait_for_timeout(200)

            # Add a widget (click an Add button in the drawer)
            add_btns = page.locator(".MuiDrawer-paper button:has-text('Add')").all()
            if len(add_btns) > 0:
                # Find one that isn't already added
                for btn in add_btns:
                    try:
                        text = btn.text_content()
                        if 'Added' not in text:
                            btn.click()
                            page.wait_for_timeout(800)
                            for _ in range(3):
                                frames.append(shot(page))
                                page.wait_for_timeout(200)
                            break
                    except Exception:
                        continue

            # Close the drawer
            page.keyboard.press("Escape")
            page.wait_for_timeout(400)
    except Exception:
        pass

    # Show the dashboard with the new widget
    for _ in range(4):
        frames.append(shot(page))
        page.wait_for_timeout(200)

    # Drag-and-drop a widget to reorder
    try:
        handles = page.locator(".drag-handle").all()
        if len(handles) >= 2:
            handles[0].drag_to(handles[1])
            page.wait_for_timeout(600)
            for _ in range(3):
                frames.append(shot(page))
                page.wait_for_timeout(200)
    except Exception:
        pass

    # Resize a widget (drag the resize handle)
    try:
        resize_handles = page.locator(".react-resizable-handle").all()
        if len(resize_handles) > 0:
            handle = resize_handles[0]
            box = handle.bounding_box()
            if box:
                page.mouse.move(box['x'] + box['width'] / 2, box['y'] + box['height'] / 2)
                page.mouse.down()
                page.mouse.move(box['x'] + 150, box['y'] + 80, steps=10)
                page.wait_for_timeout(300)
                frames.append(shot(page))
                page.mouse.up()
                page.wait_for_timeout(400)
                for _ in range(3):
                    frames.append(shot(page))
                    page.wait_for_timeout(200)
    except Exception:
        pass

    # Click "Lock" to exit edit mode
    try:
        lock_btn = page.locator("button:has-text('Lock'), [data-testid='LockIcon']").first
        if lock_btn.is_visible(timeout=500):
            lock_btn.click()
            page.wait_for_timeout(400)
            for _ in range(3):
                frames.append(shot(page))
                page.wait_for_timeout(200)
    except Exception:
        pass

    # Go back to listing page
    try:
        back_btn = page.locator('[data-testid="ArrowBackIcon"]').first
        if back_btn.is_visible(timeout=500):
            back_btn.click()
            page.wait_for_timeout(600)
            for _ in range(3):
                frames.append(shot(page))
                page.wait_for_timeout(200)
    except Exception:
        pass

    save_gif(frames, "view-central.gif", fps=4)


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


# ── GIF 6 — Blast Radius Layers (Multi-layer Dependency Graphs) ──────────────

def gif_blast_radius(page):
    print("Capturing blast-radius.gif ...")
    frames = []
    page.goto(f"{BASE_URL}/graph-layers", wait_until="networkidle")
    page.wait_for_timeout(1000)

    # Show initial state — Components layer only
    for _ in range(4):
        frames.append(shot(page))
        page.wait_for_timeout(200)

    # Switch between SEALs via the dropdown
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
        for _ in range(4):
            frames.append(shot(page))
            page.wait_for_timeout(200)

    # Toggle Platform layer ON
    try:
        page.locator("text=Platform").first.click()
        page.wait_for_timeout(1000)
        for _ in range(4):
            frames.append(shot(page))
            page.wait_for_timeout(200)
    except Exception:
        pass

    # Toggle Data Centers layer ON (requires Platform)
    try:
        page.locator("text=Data Centers").first.click()
        page.wait_for_timeout(1000)
        for _ in range(4):
            frames.append(shot(page))
            page.wait_for_timeout(200)
    except Exception:
        pass

    # Toggle Health Indicators layer ON
    try:
        page.locator("text=Health Indicators").first.click()
        page.wait_for_timeout(1000)
        for _ in range(5):
            frames.append(shot(page))
            page.wait_for_timeout(200)
    except Exception:
        pass

    # Click on nodes to show edge highlighting and sidebar details
    try:
        nodes = page.locator(".react-flow__node").all()
        if len(nodes) > 0:
            nodes[0].click()
            page.wait_for_timeout(800)
            for _ in range(4):
                frames.append(shot(page))
                page.wait_for_timeout(200)

        if len(nodes) > 3:
            nodes[3].click()
            page.wait_for_timeout(800)
            for _ in range(4):
                frames.append(shot(page))
                page.wait_for_timeout(200)

        # Click background to clear
        page.locator(".react-flow__pane").click(force=True)
        page.wait_for_timeout(500)
        for _ in range(3):
            frames.append(shot(page))
            page.wait_for_timeout(200)
    except Exception:
        pass

    # Toggle layers back off to show toggle interaction
    try:
        page.locator("text=Health Indicators").first.click()
        page.wait_for_timeout(600)
        frames.append(shot(page))
        page.locator("text=Data Centers").first.click()
        page.wait_for_timeout(600)
        frames.append(shot(page))
        page.locator("text=Platform").first.click()
        page.wait_for_timeout(600)
        frames.append(shot(page))
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


# ── GIF 10 — Incident Zero ─────────────────────────────────────────────────

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


# ── GIF 12 — Aura AI Chat (full feature showcase) ─────────────────────────

def _aura_scroll_chat(page, frames, positions):
    """Scroll the AURA chat messages container via JS evaluation."""
    for pos in positions:
        page.evaluate(f"""(() => {{
            const panels = document.querySelectorAll('.MuiPaper-root');
            for (const p of panels) {{
                if (getComputedStyle(p).position === 'fixed' && p.textContent.includes('AURA')) {{
                    const divs = p.querySelectorAll('div');
                    for (const d of divs) {{
                        if (d.scrollHeight > d.clientHeight + 20 && getComputedStyle(d).overflowY === 'auto') {{
                            d.scrollTop = {pos};
                            return;
                        }}
                    }}
                }}
            }}
        }})()""")
        page.wait_for_timeout(500)
        for _ in range(3):
            frames.append(shot(page))
            page.wait_for_timeout(350)


def _aura_scroll_bottom(page, frames):
    """Scroll the AURA chat to the very bottom."""
    page.evaluate("""(() => {
        const panels = document.querySelectorAll('.MuiPaper-root');
        for (const p of panels) {
            if (getComputedStyle(p).position === 'fixed' && p.textContent.includes('AURA')) {
                const divs = p.querySelectorAll('div');
                for (const d of divs) {
                    if (d.scrollHeight > d.clientHeight + 20 && getComputedStyle(d).overflowY === 'auto') {
                        d.scrollTop = d.scrollHeight;
                        return;
                    }
                }
            }
        }
    })()""")
    page.wait_for_timeout(500)
    for _ in range(4):
        frames.append(shot(page))
        page.wait_for_timeout(400)


def gif_aura_chat(page):
    print("Capturing aura-chat.gif ...")
    frames = []
    page.goto(BASE_URL, wait_until="networkidle")
    page.wait_for_timeout(800)

    # Show the page with the FAB pulse
    for _ in range(4):
        frames.append(shot(page))
        page.wait_for_timeout(400)

    # ── Open chat panel ──────────────────────────────────────────────────────
    fab = page.locator("button.MuiFab-root").first
    fab.click()
    page.wait_for_timeout(1200)

    # Hold on the welcome screen
    for _ in range(6):
        frames.append(shot(page))
        page.wait_for_timeout(400)

    # Locate the AURA panel — scoped selectors for all buttons
    aura_panel = page.locator('.MuiPaper-root:has-text("AURA AI Assistant")').first

    # ══════════════════════════════════════════════════════════════════════════
    # CHAT 1 — Executive Summary (metric_cards + bar_chart + line_chart + recs)
    # ══════════════════════════════════════════════════════════════════════════
    input_field = page.locator('textarea[placeholder*="AURA"], input[placeholder*="AURA"]').first
    input_field.click()
    page.wait_for_timeout(200)
    input_field.fill("Give me an executive summary of platform health")
    page.wait_for_timeout(500)
    for _ in range(3):
        frames.append(shot(page))
        page.wait_for_timeout(300)
    page.keyboard.press("Enter")
    page.wait_for_timeout(5000)  # Wait for SSE streaming to finish
    for _ in range(5):
        frames.append(shot(page))
        page.wait_for_timeout(500)

    # Scroll slowly through all response blocks
    _aura_scroll_chat(page, frames, [200, 400, 600, 800, 1000])

    # Scroll to bottom to show follow-up chips
    _aura_scroll_bottom(page, frames)

    # ══════════════════════════════════════════════════════════════════════════
    # NEW CHAT — click + button inside AURA panel, show fresh welcome screen
    # ══════════════════════════════════════════════════════════════════════════
    new_chat_btn = aura_panel.locator('[data-testid="AddIcon"]').first
    new_chat_btn.click()
    page.wait_for_timeout(1200)
    for _ in range(5):
        frames.append(shot(page))
        page.wait_for_timeout(400)

    # ══════════════════════════════════════════════════════════════════════════
    # CHAT 2 — SLO Compliance (metric_cards + table + bar_chart)
    # ══════════════════════════════════════════════════════════════════════════
    input_field = page.locator('textarea[placeholder*="AURA"], input[placeholder*="AURA"]').first
    input_field.click()
    page.wait_for_timeout(200)
    input_field.fill("Show me the SLO compliance report for all services")
    page.wait_for_timeout(500)
    for _ in range(3):
        frames.append(shot(page))
        page.wait_for_timeout(300)
    page.keyboard.press("Enter")
    page.wait_for_timeout(5000)
    for _ in range(5):
        frames.append(shot(page))
        page.wait_for_timeout(500)

    # Scroll through SLO response (table, bar chart)
    _aura_scroll_chat(page, frames, [200, 450, 700])

    # ══════════════════════════════════════════════════════════════════════════
    # MENU — show chat history with BOTH sessions visible
    # ══════════════════════════════════════════════════════════════════════════
    menu_btn = aura_panel.locator('[data-testid="MenuIcon"]').first
    menu_btn.click()
    page.wait_for_timeout(1000)
    # Hold on menu — viewer can see 2 history entries + customizations
    for _ in range(8):
        frames.append(shot(page))
        page.wait_for_timeout(450)

    # Click the FIRST (older) chat session to restore it
    history_entries = aura_panel.locator('[data-testid="ChatBubbleOutlineIcon"]')
    if history_entries.count() > 0:
        history_entries.first.click()
        page.wait_for_timeout(1200)
        for _ in range(5):
            frames.append(shot(page))
            page.wait_for_timeout(400)

    # Close menu
    close_menu = aura_panel.locator('[data-testid="CloseIcon"]').first
    close_menu.click()
    page.wait_for_timeout(600)
    for _ in range(4):
        frames.append(shot(page))
        page.wait_for_timeout(350)

    # ══════════════════════════════════════════════════════════════════════════
    # RESIZE — slowly drag left edge to widen, then top edge to grow taller
    # ══════════════════════════════════════════════════════════════════════════
    box = aura_panel.bounding_box()
    if box:
        # Widen by dragging left edge leftward
        sx = box['x'] + 3
        sy = box['y'] + box['height'] / 2
        page.mouse.move(sx, sy)
        page.wait_for_timeout(300)
        frames.append(shot(page))
        page.mouse.down()
        for step in range(8):
            page.mouse.move(sx - (step + 1) * 25, sy, steps=3)
            page.wait_for_timeout(250)
            frames.append(shot(page))
        page.mouse.up()
        page.wait_for_timeout(500)
        for _ in range(3):
            frames.append(shot(page))
            page.wait_for_timeout(400)

        # Grow taller by dragging top edge upward
        box2 = aura_panel.bounding_box()
        if box2:
            tx = box2['x'] + box2['width'] / 2
            ty = box2['y'] + 3
            page.mouse.move(tx, ty)
            page.wait_for_timeout(300)
            page.mouse.down()
            for step in range(6):
                page.mouse.move(tx, ty - (step + 1) * 30, steps=3)
                page.wait_for_timeout(250)
                frames.append(shot(page))
            page.mouse.up()
            page.wait_for_timeout(500)
            for _ in range(3):
                frames.append(shot(page))
                page.wait_for_timeout(400)

    # ══════════════════════════════════════════════════════════════════════════
    # CLEAR CHAT — trash icon removes current conversation
    # ══════════════════════════════════════════════════════════════════════════
    clear_btn = aura_panel.locator('[data-testid="DeleteOutlineIcon"]').first
    if clear_btn.is_visible(timeout=500):
        clear_btn.click()
        page.wait_for_timeout(800)
        for _ in range(4):
            frames.append(shot(page))
            page.wait_for_timeout(400)

    # ── Close panel ──────────────────────────────────────────────────────────
    fab.click()
    page.wait_for_timeout(500)
    for _ in range(3):
        frames.append(shot(page))
        page.wait_for_timeout(300)

    save_gif(frames, "aura-chat.gif", fps=3)


# ── main ─────────────────────────────────────────────────────────────────────

def main():
    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True)
        page    = browser.new_context(viewport={"width": W, "height": H}).new_page()

        gif_aura_chat(page)
        gif_dashboard(page)
        gif_view_central(page)
        gif_product_catalog(page)
        gif_applications(page)
        gif_blast_radius(page)
        gif_customer_journey(page)
        gif_slo_agent(page)
        gif_announcements(page)
        gif_incident_zero(page)
        gif_admin(page)

        browser.close()

    print(f"\nAll GIFs saved to {OUT_DIR}")


if __name__ == "__main__":
    main()
