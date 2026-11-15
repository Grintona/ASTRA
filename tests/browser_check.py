from pathlib import Path
from playwright.sync_api import sync_playwright

BASE = 'http://127.0.0.1:8000/'
with sync_playwright() as p:
    browser = p.chromium.launch(executable_path=r'C:\Program Files\Google\Chrome\Application\chrome.exe', headless=True)
    page = browser.new_page()
    errors = []
    page.on('pageerror', lambda error: errors.append(str(error)))
    page.goto(BASE + 'destinations.html')
    page.wait_for_selector('.save-destination-btn')
    page.locator('.save-destination-btn').first.click()
    assert page.locator('#navSavedLink').inner_text() == 'Saved (1)'
    page.reload()
    assert page.locator('.save-destination-btn').first.get_attribute('aria-pressed') == 'true'
    page.goto(BASE + 'profile.html')
    assert page.locator('#savedToursList article').count() == 1
    assert page.locator('#savedToursTotal').inner_text() == '$49,000'
    page.locator('#savedToursList button').click()
    assert page.locator('#navSavedLink').inner_text() == 'Saved (0)'
    result = page.evaluate('''() => {
        const a = AstraAuth;
        const first = a.registerUser({fullName: 'Test One', email:'one@example.com', password:'test123'});
        const duplicate = a.registerUser({fullName: 'Test One', email:'ONE@example.com', password:'test123'});
        a.saveBooking({id:'one', email:'two@example.com', totalPrice:'$49,000'});
        a.logoutUser();
        const second = a.registerUser({fullName:'Test Two',email:'two@example.com',password:'test123'});
        a.saveBooking({id:'two',totalPrice:'$18,500'});
        const own = a.getBookings('two@example.com');
        a.clearAllBookings('two@example.com');
        const remaining = a.getBookings();
        a.logoutUser();
        const wrong = a.loginUser('one@example.com','wrong');
        const login = a.loginUser('ONE@example.com','test123');
        return {first:first.success,duplicate:duplicate.success,second:second.success,own:own.length,remaining:remaining.map(b=>b.id),wrong:wrong.success,login:login.success};
    }''')
    assert result == dict(first=True, duplicate=False, second=True, own=1, remaining=['one'], wrong=False, login=True), result
    page.reload()
    assert page.locator('#navProfileLink').inner_text() == 'Test'
    assert page.locator('#bookingsListContainer article').count() == 1
    page.goto(BASE + 'booking.html?dest=moon')
    page.locator('#phone').fill('+77011234567')
    page.locator('#departure').fill('2030-06-15')
    page.locator('#bookingForm button[type=submit]').click()
    page.wait_for_selector('#bookingSuccessCard', state='visible')
    assert page.evaluate('AstraAuth.getBookings("one@example.com").length') == 2
    page.goto(BASE + 'about.html')
    for q in range(1, 6):
        page.locator(f'input[name=q{q}][value="5"]').check(force=True)
    page.locator('#spaceQuizForm button[type=submit]').click()
    assert page.evaluate('JSON.parse(localStorage.astra_quiz_result).totalScore') == 25
    page.reload()
    assert page.locator('#quizResultCard').is_visible()
    assert '25 / 25' in page.locator('#quizScoreValue').inner_text()
    for file in Path('.').glob('*.html'):
        page.goto(BASE + file.name)
        assert page.locator('#navSavedLink').count() == 1, file.name
    page.goto(BASE + 'destinations.html')
    page.locator('.save-destination-btn').nth(0).click()
    page.locator('.save-destination-btn').nth(1).click()
    page.goto(BASE + 'profile.html')
    assert page.locator('#savedToursTotal').inner_text() == '$2,449,000'
    page.locator('#clearFavoritesBtn').click()
    assert page.locator('#navSavedLink').inner_text() == 'Saved (0)'
    failure = page.evaluate('''() => {
        const original = Storage.prototype.setItem;
        Storage.prototype.setItem = () => { throw new Error('Storage unavailable'); };
        const registration = AstraAuth.registerUser({fullName:'Failed User',email:'failed@example.com',password:'test123'});
        const booking = AstraAuth.saveBooking({id:'failed'});
        Storage.prototype.setItem = original;
        return {success:registration.success,booking};
    }''')
    assert failure == {'success':False,'booking':None}
    for destination in ['ceres-port', 'helios-watch']:
        page.goto(BASE + 'booking.html?dest=' + destination)
        assert page.locator('#destination').input_value() == destination
    page.goto(BASE + 'profile.html')
    for width in [768, 1024, 1280]:
        page.set_viewport_size({'width':width,'height':900})
        assert page.evaluate('document.documentElement.scrollWidth <= window.innerWidth'), width
    page.set_viewport_size({'width':390,'height':844})
    page.evaluate('window.scrollTo(0, 0)')
    page.screenshot(path='tests/profile-mobile.png', full_page=True)
    assert page.evaluate('document.documentElement.scrollWidth <= window.innerWidth')
    assert not errors, errors
    print('PASS: favorites, totals, reload, auth, ownership, bookings, quiz, navigation, mobile width; no JS errors')
    browser.close()
