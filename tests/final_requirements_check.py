"""Regression checks for the final brief; run with the local server on port 8000."""
from pathlib import Path
from playwright.sync_api import sync_playwright

BASE = 'http://127.0.0.1:8000/'
with sync_playwright() as p:
    browser = p.chromium.launch(executable_path=r'C:\Program Files\Google\Chrome\Application\chrome.exe', headless=True)
    page = browser.new_page()
    errors = []
    page.on('pageerror', lambda error: errors.append(str(error)))
    page.goto(BASE + 'profile.html')
    page.locator('#tabSignupBtn').click()
    page.locator('#signupFullName').fill('123 456')
    page.locator('#signupEmail').fill('test@example.com')
    page.locator('#signupPassword').fill('test123')
    page.locator('#signupConfirmPassword').fill('test123')
    page.locator('#signupForm button[type=submit]').click()
    assert page.locator('#signupFullName').get_attribute('class').find('is-invalid') != -1
    assert page.evaluate('AstraAuth.getSession()') is None
    page.locator('#signupFullName').fill('Test User')
    page.locator('#signupForm button[type=submit]').click()
    assert page.locator('#passengerCabinetView').is_visible()
    page.goto(BASE + 'booking.html')
    page.locator('#phone').fill('----------')
    page.locator('#departure').fill('2030-06-15')
    page.locator('#bookingForm button[type=submit]').click()
    assert 'is-invalid' in page.locator('#phone').get_attribute('class')
    assert not page.locator('#bookingSuccessCard').is_visible()
    assert page.locator('.nav-cta-btn').get_attribute('aria-current') == 'page'
    page.goto(BASE)
    assert page.locator('a.astra-btn.w-100').evaluate_all('(links)=>links.map(a=>a.getAttribute("href"))') == ['booking.html?dest=moon', 'booking.html?dest=mars', 'booking.html?dest=europa']
    page.goto(BASE + 'destinations.html')
    page.locator('.quick-view-btn').first.click()
    page.wait_for_timeout(300)
    assert page.locator('.modal-close-btn').evaluate('(el)=>el===document.activeElement')
    for _ in range(4):
        page.keyboard.press('Tab')
        assert page.evaluate('!!document.activeElement.closest(".astra-modal-overlay")')
    page.keyboard.press('Escape')
    assert page.locator('.quick-view-btn').first.evaluate('(el)=>el===document.activeElement')
    page.goto(BASE + 'about.html')
    for question in range(1, 6):
        page.locator(f'input[name=q{question}][value="5"]').check(force=True)
    page.evaluate('for(let i=0;i<10;i++) $("#spaceQuizForm").trigger("submit")')
    assert page.evaluate('$("html").queue("fx").length') <= 1
    for theme in ['light', 'dark']:
        page.evaluate('(theme)=>localStorage.setItem("astra-theme",theme)', theme)
        for width in [375, 768, 1280]:
            page.set_viewport_size({'width': width, 'height': 900})
            for file in Path('.').glob('*.html'):
                page.goto(BASE + file.name, wait_until='domcontentloaded')
                page.wait_for_function('typeof AstraAuth !== "undefined" && document.querySelector("#navSavedLink")')
                assert page.evaluate('document.documentElement.dataset.theme') == theme
                assert page.evaluate('document.documentElement.scrollWidth <= innerWidth'), (file.name, theme, width)
                assert page.locator('[aria-current=page]').count() == 1, file.name
        page.reload()
        assert page.evaluate('document.documentElement.dataset.theme') == theme
    assert not errors, errors
    browser.close()
    print('PASS: invalid input, booking links, modal keyboard focus, repeated clicks, 42 page/theme/width combinations, saved theme, active navigation; no JS errors')
