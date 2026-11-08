(function () {
    "use strict";

    const canvas = document.getElementById("radarCanvas");
    if (!canvas) return;

    const ctx = canvas.getContext("2d");
    const TAU = Math.PI * 2;
    const VIEW = 640;
    const CENTER = VIEW / 2;
    const DAY_MS = 86400000;
    const SIM_START = Date.UTC(2029, 11, 1);
    const WINDOW_DAYS = 1096;
    const WINDOW_LEAD = 548;
    const LIGHT_MIN_PER_AU = 8.317;

    const BODIES = [
        { id: "venus",   name: "Venus",   type: "Planet", color: "#f6c177", size: 5,  orbitPx: 62,  period: 225,   phase: 0.6, au: 0.72, bookKey: "venus-cloud",
          info: "Cloud-top aerostat colony in the temperate layer of Venus's atmosphere, 50 km above the surface." },
        { id: "earth",   name: "Earth",   type: "Home spaceport", color: "#38bdf8", size: 6, orbitPx: 100, period: 365, phase: 2.4, au: 1,
          info: "ASTRA home base. Every mission starts here: training centres in Houston and Baikonur, launch pads and the orbital ferry dock." },
        { id: "mars",    name: "Mars",    type: "Planet", color: "#ef6a4a", size: 4.5, orbitPx: 142, period: 687,  phase: 4.1, au: 1.52, bookKey: "mars",
          info: "Full atmospheric descent to the Olympus Mons outpost and exploration of the Mariner Valleys." },
        { id: "jupiter", name: "Jupiter", type: "Gas giant", color: "#d9a273", size: 11, orbitPx: 200, period: 4333, phase: 1.1, au: 5.2,
          info: "Gas giant. Civilians do not land here: ASTRA flights stop at its moon Europa." },
        { id: "saturn",  name: "Saturn",  type: "Gas giant", color: "#e8d28f", size: 8.5, orbitPx: 262, period: 10759, phase: 5.3, au: 9.58, ring: true,
          info: "Ringed gas giant. ASTRA flights stop at its moon Titan." },
        { id: "moon",    name: "Moon",    type: "Moon of Earth", color: "#cbd5e1", size: 3, parent: "earth", orbitPx: 17, period: 90, phase: 0, bookKey: "moon",
          info: "Shackleton Base Alpha at the lunar south pole. The shortest and most popular ASTRA voyage.", localDelay: "1.3 sec", localDistance: "384,400 km" },
        { id: "orbital-spa", name: "Orbital Sanctuary", type: "Orbital station", color: "#a78bfa", size: 3, station: true, parent: "earth", orbitPx: 11, period: 40, phase: 3, bookKey: "orbital-spa",
          info: "Zero-gravity spa and observation ring in low Earth orbit. Reached by the ORION-X ferry.", localDelay: "< 0.01 sec", localDistance: "400 km" },
        { id: "europa",  name: "Europa",  type: "Moon of Jupiter", color: "#bfe3f5", size: 3, parent: "jupiter", orbitPx: 21, period: 120, phase: 2, bookKey: "europa",
          info: "Sub-Oceanic Lab beneath the ice crust, built over geothermal vents of the Europan ocean." },
        { id: "titan",   name: "Titan",   type: "Moon of Saturn", color: "#f2a65a", size: 3.5, parent: "saturn", orbitPx: 22, period: 150, phase: 4, bookKey: "titan",
          info: "Methane Sea Dunes outpost. Dense atmosphere, hydrocarbon lakes, and the farthest ASTRA destination." }
    ];

    const MISSIONS = [
        { code: "ASTRA-OR02", dest: "orbital-spa", status: "open",    vessel: "ORION-X Ferry",          duration: "3 Earth Days",  fare: "$18,500", launch: [2030, 0, 15],  viewDays: 20, repeatEvery: 90,  crew: "2 Pilots, 4 Berths" },
        { code: "ASTRA-LH01", dest: "moon",        status: "open",    vessel: "ORION-X Mark II",        duration: "7 Earth Days",  fare: "$49,000", launch: [2030, 5, 15],  viewDays: 30, repeatEvery: 150,  crew: "2 Pilots, 1 Medical Officer, 6 Berths" },
        { code: "ASTRA-RF04", dest: "mars",        status: "limited", vessel: "TITAN-LANDER Express",   duration: "180 Earth Days", fare: "$2.4M",  launch: [2030, 8, 10],  viewDays: 140, repeatEvery: 520, crew: "3 Commanders, 1 Astrobiologist, 4 Berths" },
        { code: "ASTRA-VN03", dest: "venus-cloud", status: "limited", vessel: "AEROSTAT Vanguard",      duration: "120 Earth Days", fare: "$3.1M",  launch: [2030, 10, 5],  viewDays: 110, repeatEvery: 584, crew: "2 Pilots, 1 Meteorologist, 4 Berths" },
        { code: "ASTRA-EO09", dest: "europa",      status: "planned", vessel: "ORION-X Deep Space",     duration: "2 Years",       fare: "$8.7M",   launch: [2031, 2, 20],  viewDays: 300, repeatEvery: 900, crew: "Autonomous AI + 4 Specialists" },
        { code: "ASTRA-TN07", dest: "titan",       status: "planned", vessel: "ORION-X Deep Space",     duration: "3 Years",       fare: "$12.5M",  launch: [2031, 9, 1],   viewDays: 380, repeatEvery: 1100, crew: "Autonomous AI + 4 Specialists" }
    ];

    const STATUS_COLORS = { open: "#10b981", limited: "#f59e0b", planned: "#a78bfa" };
    const STATUS_LABELS = { open: "Open", limited: "Limited", planned: "Planned" };
    const SPEEDS = [
        { label: "Slow",   daysPerSec: 12 },
        { label: "Normal", daysPerSec: 30 },
        { label: "Fast",   daysPerSec: 90 }
    ];


    const BODY_BY_ID = {};
    BODIES.forEach(function (b) { BODY_BY_ID[b.id] = b; });


    const DEST_TO_BODY = { "venus-cloud": "venus" };
    function destBody(m) { return BODY_BY_ID[DEST_TO_BODY[m.dest] || m.dest]; }

    MISSIONS.forEach(function (m, i) {
        m.index = i;
        m.launchDay = (Date.UTC(m.launch[0], m.launch[1], m.launch[2]) - SIM_START) / DAY_MS;
        m.launchText = formatDate(m.launchDay);
    });

    const state = {
        day: 0,
        playing: !window.matchMedia("(prefers-reduced-motion: reduce)").matches,
        speedIndex: 0,
        rate: 0,
        selected: null,
        hovered: null,
        visible: true,
        scale: 1
    };

    let dragWindowStart = null;

    const hitTargets = [];
    const shipHeadings = {};

    function formatDate(day) {
        return new Date(SIM_START + day * DAY_MS).toLocaleDateString("en-GB", {
            day: "2-digit", month: "short", year: "numeric", timeZone: "UTC"
        });
    }

    function bodyPos(body, day) {
        const angle = body.phase + TAU * day / body.period;
        const origin = body.parent ? bodyPos(BODY_BY_ID[body.parent], day) : { x: CENTER, y: CENTER };
        return {
            x: origin.x + Math.cos(angle) * body.orbitPx,
            y: origin.y + Math.sin(angle) * body.orbitPx
        };
    }

    function rootBody(body) {
        return body.parent ? rootBody(BODY_BY_ID[body.parent]) : body;
    }

    function distanceFromEarthAU(body, day) {
        const root = rootBody(body);
        const earth = BODY_BY_ID.earth;
        const a1 = root.phase + TAU * day / root.period;
        const a2 = earth.phase + TAU * day / earth.period;
        const dx = root.au * Math.cos(a1) - earth.au * Math.cos(a2);
        const dy = root.au * Math.sin(a1) - earth.au * Math.sin(a2);
        return Math.sqrt(dx * dx + dy * dy);
    }

    function formatDelay(au) {
        const minutes = au * LIGHT_MIN_PER_AU;
        return minutes.toFixed(1) + " min";
    }

    function shipState(m, day) {
        if (day < m.launchDay) {
            return { phase: "prelaunch", t: 0, daysLeft: m.launchDay - day };
        }
        const V = m.viewDays;
        const local = (day - m.launchDay) % m.repeatEvery;
        if (local < V)         return { phase: "outbound", t: local / V, daysLeft: V - local };
        if (local < V * 1.25)  return { phase: "arrived",  t: 1,         daysLeft: 0 };
        if (local < V * 2.25)  return { phase: "inbound",  t: 1 - (local - V * 1.25) / V, daysLeft: V * 2.25 - local };
        return { phase: "docked", t: 0, daysLeft: 0 };
    }

    function nextLaunchDay(m, day) {
        if (day < m.launchDay) return m.launchDay;
        return m.launchDay + (Math.floor((day - m.launchDay) / m.repeatEvery) + 1) * m.repeatEvery;
    }

    const PHASE_TEXT = {
        prelaunch: "Awaiting launch window",
        outbound:  "In transit to destination",
        arrived:   "Docked at destination",
        inbound:   "Returning to Earth",
        docked:    "Docked at Earth spaceport"
    };

    function pathPoint(a, b, t) {
        const e = t * t * (3 - 2 * t);
        const dx = b.x - a.x, dy = b.y - a.y;
        const bulge = Math.sin(Math.PI * t) * 0.18;
        return { x: a.x + dx * e - dy * bulge, y: a.y + dy * e + dx * bulge };
    }

    function shipPos(m, day) {
        const st = shipState(m, day);
        const a = bodyPos(BODY_BY_ID.earth, day);
        const b = bodyPos(destBody(m), day);
        const p = pathPoint(a, b, st.t);

        const parkRadius = Math.hypot(b.x - a.x, b.y - a.y) < 40 ? 5 : 9;
        const park = Math.max(0, 1 - Math.min(st.t, 1 - st.t) * 8);
        const spin = m.index * 1.7 + day * 0.35;
        return {
            x: p.x + Math.cos(spin) * parkRadius * park,
            y: p.y + Math.sin(spin) * parkRadius * park,
            state: st
        };
    }

    function resizeCanvas() {
        const cssWidth = canvas.clientWidth;
        if (!cssWidth) return;
        const dpr = window.devicePixelRatio || 1;
        canvas.width = Math.round(cssWidth * dpr);
        canvas.height = Math.round(cssWidth * dpr);
        state.scale = canvas.width / VIEW;
        draw();
    }

    function fitSize(logical, minCss) {
        const cssPerUnit = canvas.clientWidth / VIEW || 1;
        return Math.max(logical, minCss / cssPerUnit);
    }

    function isActive(kind, id) {
        return (state.selected && state.selected.kind === kind && state.selected.id === id) ||
               (state.hovered && state.hovered.kind === kind && state.hovered.id === id);
    }

    function drawSun() {
        const glow = ctx.createRadialGradient(CENTER, CENTER, 2, CENTER, CENTER, 46);
        glow.addColorStop(0, "rgba(255, 224, 140, 1)");
        glow.addColorStop(0.35, "rgba(255, 170, 60, 0.55)");
        glow.addColorStop(1, "rgba(255, 140, 40, 0)");
        ctx.fillStyle = glow;
        ctx.beginPath();
        ctx.arc(CENTER, CENTER, 46, 0, TAU);
        ctx.fill();
        ctx.fillStyle = "#ffe08c";
        ctx.beginPath();
        ctx.arc(CENTER, CENTER, 13, 0, TAU);
        ctx.fill();
    }

    function drawOrbits() {
        ctx.save();
        ctx.setLineDash([2, 7]);
        ctx.lineWidth = 1;
        ctx.strokeStyle = "rgba(160, 174, 192, 0.28)";
        BODIES.forEach(function (b) {
            if (b.parent) return;
            ctx.beginPath();
            ctx.arc(CENTER, CENTER, b.orbitPx, 0, TAU);
            ctx.stroke();
        });
        ctx.restore();
    }

    function drawBody(b, pos) {
        const active = isActive("body", b.id);

        if (b.ring) {
            ctx.save();
            ctx.strokeStyle = "rgba(232, 210, 143, 0.75)";
            ctx.lineWidth = 1.6;
            ctx.beginPath();
            ctx.ellipse(pos.x, pos.y, b.size * 1.9, b.size * 0.65, -0.35, 0, TAU);
            ctx.stroke();
            ctx.restore();
        }

        ctx.save();
        ctx.shadowColor = b.color;
        ctx.shadowBlur = active ? 18 : 8;
        ctx.fillStyle = b.color;
        ctx.beginPath();
        if (b.station) {
            ctx.rect(pos.x - b.size, pos.y - b.size, b.size * 2, b.size * 2);
        } else {
            ctx.arc(pos.x, pos.y, b.size, 0, TAU);
        }
        ctx.fill();
        ctx.restore();

        if (b.bookKey) {
            ctx.strokeStyle = "rgba(56, 189, 248, 0.55)";
            ctx.lineWidth = 1;
            ctx.beginPath();
            ctx.arc(pos.x, pos.y, b.size + 4, 0, TAU);
            ctx.stroke();
        }

        if (!b.parent || active) {
            ctx.fillStyle = active ? "#ffffff" : "rgba(226, 232, 240, 0.8)";
            ctx.font = (active ? "600 " : "") + fitSize(12, 10) + "px -apple-system, 'Segoe UI', Roboto, Arial, sans-serif";
            ctx.textAlign = "center";
            ctx.fillText(b.name, pos.x, pos.y + b.size + fitSize(b.ring ? 18 : 16, 14));
        }

        if (state.selected && state.selected.kind === "body" && state.selected.id === b.id) {
            const pulse = 8 + 3 * Math.sin(performance.now() / 260);
            ctx.strokeStyle = "#38bdf8";
            ctx.lineWidth = 1.5;
            ctx.beginPath();
            ctx.arc(pos.x, pos.y, b.size + pulse, 0, TAU);
            ctx.stroke();
        }

        hitTargets.push({ kind: "body", id: b.id, x: pos.x, y: pos.y, r: Math.max(12, b.size + 8) });
    }

    function drawRoute(m, day) {
        const a = bodyPos(BODY_BY_ID.earth, day);
        const b = bodyPos(destBody(m), day);
        ctx.beginPath();
        for (let i = 0; i <= 24; i++) {
            const p = pathPoint(a, b, i / 24);
            if (i === 0) ctx.moveTo(p.x, p.y); else ctx.lineTo(p.x, p.y);
        }
        ctx.stroke();
    }

    function drawShip(m, day) {
        const sp = shipPos(m, day);
        const color = STATUS_COLORS[m.status];
        const active = isActive("ship", m.code);
        const flying = sp.state.phase === "outbound" || sp.state.phase === "inbound";

        if (flying || active) {
            ctx.save();
            ctx.setLineDash([3, 5]);
            ctx.lineWidth = active ? 1.4 : 1;
            ctx.strokeStyle = active ? "rgba(56, 189, 248, 0.8)" : "rgba(255, 255, 255, 0.18)";
            drawRoute(m, day);
            ctx.restore();
        }

        const prev = shipHeadings[m.code];
        let heading = prev ? prev.angle : -Math.PI / 2;
        if (prev && Math.hypot(sp.x - prev.x, sp.y - prev.y) > 0.05) {
            heading = Math.atan2(sp.y - prev.y, sp.x - prev.x);
        }
        shipHeadings[m.code] = { x: sp.x, y: sp.y, angle: heading };

        ctx.save();
        ctx.translate(sp.x, sp.y);
        ctx.rotate(heading);
        ctx.shadowColor = color;
        ctx.shadowBlur = active ? 16 : 9;
        ctx.fillStyle = sp.state.phase === "prelaunch" ? "rgba(255,255,255,0.55)" : color;
        ctx.beginPath();
        ctx.moveTo(6, 0);
        ctx.lineTo(-4.5, 3.8);
        ctx.lineTo(-2.5, 0);
        ctx.lineTo(-4.5, -3.8);
        ctx.closePath();
        ctx.fill();
        ctx.restore();

        if (active) {
            ctx.fillStyle = "#ffffff";
            ctx.font = "600 " + fitSize(11, 10) + "px -apple-system, 'Segoe UI', Roboto, Arial, sans-serif";
            ctx.textAlign = "center";
            ctx.fillText(m.code, sp.x, sp.y - 12);
        }
        if (state.selected && state.selected.kind === "ship" && state.selected.id === m.code) {
            ctx.strokeStyle = "#38bdf8";
            ctx.lineWidth = 1.5;
            ctx.beginPath();
            ctx.arc(sp.x, sp.y, 10 + 2.5 * Math.sin(performance.now() / 260), 0, TAU);
            ctx.stroke();
        }

        hitTargets.push({ kind: "ship", id: m.code, x: sp.x, y: sp.y, r: 11 });
    }

    function draw() {
        ctx.setTransform(state.scale, 0, 0, state.scale, 0, 0);
        ctx.clearRect(0, 0, VIEW, VIEW);
        hitTargets.length = 0;

        drawOrbits();
        drawSun();
        BODIES.forEach(function (b) { drawBody(b, bodyPos(b, state.day)); });
        MISSIONS.forEach(function (m) { drawShip(m, state.day); });
    }

    const $panel = $("#radarPanel");
    const $date = $("#radarDate");
    const $next = $("#radarNext");
    const $timeline = $("#radarTimeline");
    const $windowLabel = $("#radarWindow");
    const $play = $("#radarPlay");

    function bodyPanelHTML(b) {
        const missions = MISSIONS.filter(function (m) { return destBody(m) === b; });
        let html = '<span class="status-badge planned">' + b.type + '</span>' +
            '<h3 class="radar-title">' + b.name + '</h3>' +
            '<p class="radar-text">' + b.info + '</p>' +
            '<dl class="radar-stats">' +
            '<div><dt>Distance from Earth</dt><dd data-live="distance">—</dd></div>' +
            '<div><dt>Signal delay (one way)</dt><dd data-live="delay">—</dd></div>' +
            '</dl>';

        if (missions.length) {
            html += '<p class="radar-label">Missions to this destination</p><div class="radar-mini-list">';
            missions.forEach(function (m) {
                html += '<button type="button" class="filter-pill radar-chip" data-select-ship="' + m.code + '">' + m.code + '</button>';
            });
            html += '</div>';
        } else if (b.id !== "earth") {
            html += '<p class="radar-empty">No ASTRA missions are scheduled to this body.</p>';
        }

        if (b.bookKey) {
            html += '<a class="astra-btn astra-btn-sm w-100 mt-3" href="booking.html?dest=' + b.bookKey + '">Book this destination →</a>';
        }
        return html;
    }

    function shipPanelHTML(m) {
        const dest = destBody(m);
        return '<span class="status-badge ' + m.status + '">' + STATUS_LABELS[m.status] + '</span>' +
            '<h3 class="radar-title">' + m.code + '</h3>' +
            '<p class="radar-text">Earth → ' + dest.name + ' aboard ' + m.vessel + '.</p>' +
            '<p class="radar-phase" data-live="phase">—</p>' +
            '<div class="radar-progress" role="progressbar" aria-label="Flight progress" aria-valuemin="0" aria-valuemax="100" aria-valuenow="0"><span data-live="bar"></span></div>' +
            '<dl class="radar-stats">' +
            '<div><dt>Next milestone</dt><dd data-live="eta">—</dd></div>' +
            '<div><dt>Next launch window</dt><dd data-live="window">' + m.launchText + '</dd></div>' +
            '<div><dt>Real duration</dt><dd>' + m.duration + '</dd></div>' +
            '<div><dt>Base fare</dt><dd>' + m.fare + '</dd></div>' +
            '</dl>' +
            '<p class="radar-text small mb-0"><strong>Crew:</strong> ' + m.crew + '</p>' +
            '<div class="d-grid gap-2 mt-3">' +
            '<a class="astra-btn astra-btn-sm" href="booking.html?dest=' + m.dest + '">' + (m.status === "planned" ? "Pre-register interest →" : "Book this mission →") + '</a>' +
            '<button type="button" class="astra-btn-outline astra-btn-sm" data-jump="' + m.code + '">Jump to launch window</button>' +
            '</div>';
    }

    function emptyPanelHTML() {
        return '<span class="status-badge planned">Radar standby</span>' +
            '<h3 class="radar-title">Select a target</h3>' +
            '<p class="radar-text">Click a planet, station or ship on the radar, or pick one from the list below it, to see live telemetry. Cyan rings mark destinations that can be booked.</p>' +
            '<p class="radar-empty">Tip: drag the timeline to watch launch windows open.</p>';
    }

    function renderPanel() {
        let html;
        const sel = state.selected;
        if (!sel) {
            html = emptyPanelHTML();
        } else if (sel.kind === "body") {
            html = bodyPanelHTML(BODY_BY_ID[sel.id]);
        } else {
            html = shipPanelHTML(MISSIONS.filter(function (m) { return m.code === sel.id; })[0]);
        }
        $panel.stop(true, true).hide().html(html).fadeIn(220);
        refreshLive();
        syncChips();
    }

    function refreshLive() {
        $date.text(formatDate(state.day));

        const upcoming = MISSIONS.slice().sort(function (a, b) {
            return nextLaunchDay(a, state.day) - nextLaunchDay(b, state.day);
        })[0];
        $next.text(upcoming.code + " launches in " + Math.ceil(nextLaunchDay(upcoming, state.day) - state.day) + " days");

        const ws = windowStart();
        $windowLabel.text(formatDate(ws) + " → " + formatDate(ws + WINDOW_DAYS));

        const sel = state.selected;
        if (!sel) return;

        if (sel.kind === "body") {
            const b = BODY_BY_ID[sel.id];
            if (b.id === "earth") {
                setLive("distance", "0 (home)");
                setLive("delay", "—");
            } else if (b.localDistance) {
                setLive("distance", b.localDistance);
                setLive("delay", b.localDelay);
            } else {
                const au = distanceFromEarthAU(b, state.day);
                setLive("distance", au.toFixed(2) + " AU (" + Math.round(au * 149.6) + " million km)");
                setLive("delay", formatDelay(au));
            }
        } else {
            const m = MISSIONS.filter(function (x) { return x.code === sel.id; })[0];
            const st = shipState(m, state.day);
            const percent = (st.phase === "outbound" || st.phase === "inbound")
                ? Math.round((st.phase === "outbound" ? st.t : 1 - st.t) * 100)
                : (st.phase === "arrived" ? 100 : 0);

            setLive("phase", PHASE_TEXT[st.phase]);
            setLive("window", formatDate(nextLaunchDay(m, state.day)));
            $panel.find('[data-live="bar"]').css("width", percent + "%");
            $panel.find(".radar-progress").attr("aria-valuenow", percent);
            if (st.phase === "prelaunch") {
                setLive("eta", "Launch in " + Math.ceil(st.daysLeft) + " days");
            } else if (st.phase === "outbound") {
                setLive("eta", "Arrival in " + Math.ceil(st.daysLeft) + " days");
            } else if (st.phase === "inbound") {
                setLive("eta", "Back on Earth in " + Math.ceil(st.daysLeft) + " days");
            } else if (st.phase === "arrived") {
                setLive("eta", "Surface programme in progress");
            } else {
                setLive("eta", "Preparing next cycle");
            }
        }
    }

    function setLive(name, text) {
        $panel.find('[data-live="' + name + '"]').text(text);
    }

    function select(kind, id, scrollToPanel) {
        if (state.selected && state.selected.kind === kind && state.selected.id === id) {
            state.selected = null;
        } else {
            state.selected = { kind: kind, id: id };
        }
        renderPanel();
        draw();
        if (scrollToPanel && state.selected && window.innerWidth < 992) {
            $panel[0].scrollIntoView({ behavior: "smooth", block: "nearest" });
        }
    }

    function buildChips() {
        const $bodies = $("#radarBodyChips");
        const $ships = $("#radarShipChips");
        BODIES.forEach(function (b) {
            $bodies.append($('<button type="button" class="filter-pill radar-chip"></button>')
                .text(b.name).attr({ "data-kind": "body", "data-id": b.id, "aria-pressed": "false" }));
        });
        MISSIONS.forEach(function (m) {
            $ships.append($('<button type="button" class="filter-pill radar-chip"></button>')
                .text(m.code).attr({ "data-kind": "ship", "data-id": m.code, "aria-pressed": "false" }));
        });
    }

    function syncChips() {
        $(".radar-chip[data-kind]").each(function () {
            const on = !!state.selected &&
                state.selected.kind === $(this).attr("data-kind") &&
                state.selected.id === $(this).attr("data-id");
            $(this).toggleClass("active", on).attr("aria-pressed", on);
        });
    }

    function setDay(day) {
        state.day = Math.max(0, day);
        syncSlider();
        refreshLive();
        draw();
    }

    function windowStart() {
        return dragWindowStart !== null ? dragWindowStart : Math.max(0, state.day - WINDOW_LEAD);
    }

    function syncSlider() {
        $timeline.val(Math.round(state.day - windowStart()));
    }

    function setPlaying(on) {
        state.playing = on;
        $play.text(on ? "❚❚ Pause" : "▶ Play").attr("aria-pressed", String(on));
    }

    function buildSpeedButtons() {
        const $group = $("#radarSpeed");
        SPEEDS.forEach(function (s, i) {
            $group.append($('<button type="button" class="filter-pill radar-chip"></button>')
                .text(s.label).attr({ "data-speed": i, "aria-pressed": String(i === state.speedIndex) })
                .toggleClass("active", i === state.speedIndex));
        });
    }


    function pointerToView(e) {
        const rect = canvas.getBoundingClientRect();
        return {
            x: (e.clientX - rect.left) * VIEW / rect.width,
            y: (e.clientY - rect.top) * VIEW / rect.height
        };
    }

    function hitTest(p) {
        let best = null, bestDist = Infinity;
        hitTargets.forEach(function (t) {
            const d = Math.hypot(p.x - t.x, p.y - t.y);
            const priority = t.kind === "ship" ? d - 4 : d;
            if (d <= fitSize(t.r, 22) && priority < bestDist) { best = t; bestDist = priority; }
        });
        return best;
    }


    function bindEvents() {
        $(canvas).on("pointermove", function (e) {
            const hit = hitTest(pointerToView(e.originalEvent));
            const next = hit ? { kind: hit.kind, id: hit.id } : null;
            const changed = JSON.stringify(next) !== JSON.stringify(state.hovered);
            state.hovered = next;
            canvas.style.cursor = hit ? "pointer" : "default";
            if (changed && !state.playing) draw();
        });

        $(canvas).on("pointerleave", function () {
            state.hovered = null;
            if (!state.playing) draw();
        });

        $(canvas).on("click", function (e) {
            const hit = hitTest(pointerToView(e.originalEvent));
            if (hit) select(hit.kind, hit.id, true);
        });

        $(document).on("click", ".radar-chip[data-kind]", function () {
            select($(this).attr("data-kind"), $(this).attr("data-id"), false);
        });
        $panel.on("click", "[data-select-ship]", function () {
            state.selected = null;
            select("ship", $(this).attr("data-select-ship"), false);
        });
        $panel.on("click", "[data-jump]", function () {
            const m = MISSIONS.filter(function (x) { return x.code === $(this).attr("data-jump"); }.bind(this))[0];
            setDay(nextLaunchDay(m, state.day) - 4);
        });

        $play.on("click", function () { setPlaying(!state.playing); });

        $("#radarSpeed").on("click", "[data-speed]", function () {
            state.speedIndex = parseInt($(this).attr("data-speed"), 10);
            $("#radarSpeed .radar-chip").removeClass("active").attr("aria-pressed", "false");
            $(this).addClass("active").attr("aria-pressed", "true");
        });

        $("#radarReset").on("click", function () { setDay(0); });

        $timeline.on("pointerdown", function () {
            dragWindowStart = Math.max(0, state.day - WINDOW_LEAD);
        });
        $(document).on("pointerup pointercancel", function () { dragWindowStart = null; });
        $timeline.on("input", function () {
            setDay(windowStart() + parseInt($(this).val(), 10));
        });

        $(document).on("keydown", function (e) {
            if (!state.visible || $(e.target).is("input, select, textarea")) return;
            if (e.key === "Escape" && state.selected) {
                state.selected = null;
                renderPanel();
                draw();
            }
        });
    }

    let lastFrame = 0;
    let lastLive = 0;

    function frame(ts) {
        const dt = Math.min(0.05, (ts - lastFrame) / 1000);
        lastFrame = ts;

        if (state.visible && !document.hidden) {
            const target = state.playing ? SPEEDS[state.speedIndex].daysPerSec : 0;
            state.rate += (target - state.rate) * Math.min(1, dt * 3);
            if (Math.abs(state.rate) > 0.001) {
                state.day += state.rate * dt;
                syncSlider();
            }
            draw();
            if (ts - lastLive > 200) {
                refreshLive();
                lastLive = ts;
            }
        }
        requestAnimationFrame(frame);
    }

    function trackShip(code) {
        const m = MISSIONS.filter(function (x) { return x.code === code; })[0];
        if (!m) return false;
        setDay(m.launchDay + m.viewDays * 0.4);
        state.selected = null;
        select("ship", code, false);
        return true;
    }

    function openFromUrl() {
        const params = new URLSearchParams(window.location.search);
        const ship = params.get("ship");
        const body = params.get("body");
        if (ship && trackShip(ship.toUpperCase())) return;
        if (body && BODY_BY_ID[body]) select("body", body, false);
    }

    function init() {
        $timeline.attr("max", WINDOW_DAYS);
        $(canvas).css("opacity", 0).animate({ opacity: 1 }, 900);
        buildChips();
        buildSpeedButtons();
        setPlaying(state.playing);
        renderPanel();
        bindEvents();
        resizeCanvas();

        if ("ResizeObserver" in window) {
            new ResizeObserver(resizeCanvas).observe(canvas);
        } else {
            $(window).on("resize", resizeCanvas);
        }
        if ("IntersectionObserver" in window) {
            new IntersectionObserver(function (entries) {
                state.visible = entries[0].isIntersecting;
            }).observe(canvas);
        }
        openFromUrl();
        requestAnimationFrame(frame);
    }

    // Table links "Track on radar"
    $(document).on("click", "[data-track]", function () {
        trackShip($(this).attr("data-track"));
    });

    $(document).ready(init);
})();
