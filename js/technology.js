

const SPACECRAFT_SYSTEMS = {
    "orion-x": {
        name: "ORION-X Exploration Vehicle",
        tagline: "Heavy Interplanetary Crew Capsule & Observation Lounge",
        svg: "images/orion-x.svg",
        thrust: "450 kN Dual-Mode Methane/LOX",
        isp: "385 seconds",
        capacity: "6 Civilian Astronauts + 2 Crew",
        shielding: "Multi-layered water wall & magnetic deflectors",
        description: "The flagship carrier for lunar and near-Earth voyages. Features artificial micro-gravity rotation hubs, panoramic glass cupolas, and emergency escape launch thrusters capable of 12G abort maneuvers."
    },
    "lifecore": {
        name: "LIFECORE Environmental Loop",
        tagline: "Closed-Loop Oxygen, Water & Biomass Regeneration",
        svg: "images/lifecore.svg",
        thrust: "N/A (Autonomous Life Support Subsystem)",
        isp: "99.4% Recycled Water Efficiency",
        capacity: "Supports 8 Humans continuously for 3 Years",
        shielding: "Pressurized Kevlar & Aerogel thermal blankets",
        description: "Bioregenerative life support utilizing spirulina algae photobioreactors and catalytic sabatier reactors. Produces medical-grade potable water and breathable O2 from recycled passenger respiration."
    },
    "navigate-ai": {
        name: "NAVIGATE-AI Guidance Array",
        tagline: "Quantum Stellar Triangulation & Micro-Meteoroid Evasion",
        svg: "images/navigate-ai.svg",
        thrust: "Cold-gas attitude RCS thruster grid",
        isp: "Nanosecond laser sensor resolution",
        capacity: "Autonomous interplanetary trajectory calculation",
        shielding: "Hardened Gallium-Nitride optical computing core",
        description: "Calculates gravitational slingshot burns around Venus, Earth, and Jupiter. Scans 100,000 km ahead using pulsed LIDAR to detect debris and adjusts ship orientation in milliseconds."
    },
    "astra-shield": {
        name: "ASTRA Magneto-Hydrodynamic Shield",
        tagline: "Deep Space Cosmic Ray & Coronal Mass Ejection Protection",
        svg: "images/astra-shield.svg",
        thrust: "High-temperature superconducting coil array",
        isp: "Generates 4.2 Tesla magnetic bubble",
        capacity: "Shields entire vehicle payload perimeter",
        shielding: "Magnetic field deflects 99.8% ionizing protons",
        description: "Creates an artificial mini-magnetosphere around the spacecraft during interplanetary transit, shielding civilian passengers from solar energetic particles and deep-space galactic cosmic radiation."
    }
};

$(document).ready(function () {
    const $tabs = $(".tech-tab-btn");
    const $modal = $("#blueprintModal");
    let previousFocus;
    let previousOverflow;

    function selectTab(button) {
        $tabs.removeClass("active").attr({ "aria-selected": "false", tabindex: "-1" });
        $(button).addClass("active").attr({ "aria-selected": "true", tabindex: "0" });
        $("#systemPanel").attr("aria-labelledby", button.id);
        switchSpacecraftSystem($(button).attr("data-system"));
    }

    $tabs.on("click", function () { selectTab(this); });
    $tabs.on("keydown", function (event) {
        let index = $tabs.index(this);
        if (event.key === "ArrowRight") index = (index + 1) % $tabs.length;
        else if (event.key === "ArrowLeft") index = (index - 1 + $tabs.length) % $tabs.length;
        else if (event.key === "Home") index = 0;
        else if (event.key === "End") index = $tabs.length - 1;
        else return;
        event.preventDefault();
        selectTab($tabs[index]);
        $tabs[index].focus();
    });
    selectTab($tabs[0]);

    function closeModal() {
        if ($modal.attr("aria-hidden") === "true") return;
        $modal.attr("aria-hidden", "true").stop(true, true).fadeOut(200);
        document.body.style.overflow = previousOverflow;
        if (previousFocus) previousFocus.focus();
    }

    $("#inspectBlueprintBtn").on("click", function () {
        const system = SPACECRAFT_SYSTEMS[$tabs.filter(".active").attr("data-system")];
        previousFocus = document.activeElement;
        previousOverflow = document.body.style.overflow;
        $("#blueprintModalTitle").text(system.name);
        $("#blueprintModalTagline").text(system.tagline);
        $("#blueprintModalSvg").attr({ src: system.svg, alt: system.name });
        $("#blueprintModalDesc").text(system.description);
        document.body.style.overflow = "hidden";
        $modal.stop(true, true).css("display", "flex").hide().attr("aria-hidden", "false").fadeIn(250);
        $("#closeBlueprintModalBtn").trigger("focus");
    });
    $("#closeBlueprintModalBtn").on("click", closeModal);
    $modal.on("click", function (event) { if (event.target === this) closeModal(); });
    $(document).on("keydown", function (event) {
        if ($modal.attr("aria-hidden") === "true") return;
        if (event.key === "Escape") closeModal();
        if (event.key === "Tab") {
            event.preventDefault();
            $("#closeBlueprintModalBtn").trigger("focus");
        }
    });
});

function switchSpacecraftSystem(key) {
    const sys = SPACECRAFT_SYSTEMS[key];
    if (!sys) return;

    $("#systemTitle").text(sys.name);
    $("#systemTagline").text(sys.tagline);
    $("#systemSvg").attr("src", sys.svg).attr("alt", sys.name);
    $("#systemDescription").text(sys.description);

    $("#specThrust").text(sys.thrust);
    $("#specIsp").text(sys.isp);
    $("#specCapacity").text(sys.capacity);
    $("#specShielding").text(sys.shielding);
}
