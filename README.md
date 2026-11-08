# ASTRA — Commercial Space Travel Agency

WEB Technologies 1 (Front End), Astana IT University. A fictional space travel website built with HTML, CSS, Bootstrap 5.3.3, JavaScript and jQuery 3.7.1.

## Team contributions

| Team member | Pages | Features |
|---|---|---|
| Mikhail Gulyayev | Home, Destinations | Responsive navigation, shared theme, destination catalog, search, filters, sorting and countdown |
| Beknur Abdykhamit | Missions, Booking | Schedule filter, FAQ accordion, booking validation and price calculator |
| Miras Zhumazhan | Technology, About | Four spacecraft subsystem tabs, blueprint modal, five-question quiz, team and improvements sections, README |

## Run locally

Open `index.html` in a browser, or run `python3 -m http.server 8000` from the ASTRA directory and visit http://localhost:8000. Internet access is required for Bootstrap and jQuery loaded from CDNs.

## Architecture

| File | Purpose |
|---|---|
| `index.html` | Home and countdown |
| `destinations.html`, `js/destinations.js` | Dynamic destination catalog |
| `missions.html`, `js/missions.js` | Mission schedule and FAQ |
| `booking.html`, `js/booking.js` | Booking form, validation and price summary |
| `technology.html`, `js/technology.js` | Four subsystem objects, specifications and blueprint modal |
| `about.html`, `js/quiz.js` | Team, improvements and readiness quiz |
| `js/main.js` | Shared navigation, scrolling and countdown behavior |
| `css/style.css` | Shared responsive visual styles |
| `images/` | Destination photographs and subsystem SVGs |

## Miras's interactive features

The Technology explorer updates the title, description, image and four specifications when a subsystem is selected. Arrow Left/Right, Home and End switch tabs and update `aria-selected`. Inspect Blueprint opens the selected diagram using jQuery `fadeIn`; the close button, backdrop and Escape close it using `fadeOut`. Focus stays on the close control while the modal is open and returns to the opener afterward.

The About quiz requires all five answers, calculates a score out of 25 and a rounded percentage, and recommends Mars at 85% or above, the Moon at 65% or above, or the orbital sanctuary below 65%. Its booking link passes the destination through `?dest=`. Changing an answer hides the previous result; Retake clears the form. The quiz is fictional entertainment, not a medical assessment or flight certification.

## Criteria mapping

| Area | Implementation |
|---|---|
| Responsive layout and navigation | Bootstrap grid, mobile navbar and active page links |
| Form validation | Booking form with inline feedback |
| Dynamic JavaScript | Catalog rendering, filtering, sorting, calculations, subsystem explorer and quiz |
| jQuery effects | FAQ accordion, smooth scrolling, blueprint modal and quiz result reveal |
| Visual design | Shared space theme, interactive cards and countdown |
| Improvements and teamwork | About page changelog and contribution cards |
| Code organization | Separate page modules, shared stylesheet and image directory |

This table describes implemented features; it does not guarantee a grade or confirm live deployment.

## GitHub Pages deployment

1. Commit the project files to your own repository and push the main branch.
2. Open Settings → Pages and choose Deploy from a branch.
3. Select `main` and `/ (root)` if `index.html` is at the repository root.
4. Save and wait for the deployment workflow to finish. Use the URL provided by GitHub.

If ASTRA is a nested directory, move its contents to the repository root or configure a workflow that publishes that directory. The existing repository and Pages URLs must be checked by the repository owner before submission.

## Defense checklist

- Select each of the four systems and inspect its matching blueprint.
- Switch tabs with the keyboard; close the modal with Escape and check focus restoration.
- Submit an unanswered quiz, then test scores of 5/25, 17/25 and 25/25.
- Change an answer after a result, retake the quiz and follow the recommended booking link.
- Demonstrate the About page improvements and each member's contribution.

All spacecraft specifications, destinations and fares are fictional student project content.
