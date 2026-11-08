/**
 * ASTRA Space Travel - Destinations Catalog JavaScript
 * Student 1: Mikhail Gulyayev
 * Meets Criterion 3: Array of 8+ objects, DOM manipulation, 
 * search, filter, sort, count & average price calculation, empty state.
 * Meets Criterion 4: jQuery Quick View Modal with fadeIn/fadeOut.
 */

const destinationsData = [
    {
        id: "moon",
        title: "Moon — Shackleton Base Alpha",
        category: "orbital",
        price: 49000,
        duration: 7,
        distance: "384,400 km",
        difficulty: "Beginner",
        rating: 4.9,
        status: "open",
        statusText: "Booking Open",
        image: "images/Moon.jpg",
        description: "A luxury 7-day lunar expedition. Experience 1/6th gravity walking, visit historic Apollo sites, and reside in pressurized subterranean lava tubes.",
        features: ["Low Earth Orbit insertion", "Shackleton Crater habitat stay", "Pressurized rover excursion"]
    },
    {
        id: "mars",
        title: "Mars — Olympus Mons Outpost",
        category: "interplanetary",
        price: 2400000,
        duration: 180,
        distance: "225,000,000 km",
        difficulty: "Challenging",
        rating: 4.8,
        status: "limited",
        statusText: "Limited Berths",
        image: "images/Mars.jpg",
        description: "An interplanetary voyage to the Red Planet. Explore immense volcanic calderas, ancient dry riverbeds, and work alongside planetary scientists.",
        features: ["Ion-drive transit", "Olympus Mons overlook", "Hydroponic greenhouse dining"]
    },
    {
        id: "europa",
        title: "Europa — Sub-Oceanic Station",
        category: "deep-space",
        price: 8700000,
        duration: 730,
        distance: "628,000,000 km",
        difficulty: "Expert",
        rating: 4.7,
        status: "planned",
        statusText: "Planned Voyage",
        image: "images/Europa.jpg",
        description: "Explore Jupiter's enigmatic icy moon. Dive deep beneath a 15-mile ice crust in thermal submersibles to witness geothermal vents in warm oceans.",
        features: ["Cryo-stabilized long transit", "Sub-ice drone immersion", "Jupiter magnetic observation"]
    },
    {
        id: "titan",
        title: "Titan — Methane Dunes Resort",
        category: "deep-space",
        price: 12500000,
        duration: 1095,
        distance: "1,400,000,000 km",
        difficulty: "Expert",
        rating: 4.9,
        status: "planned",
        statusText: "Planned Voyage",
        image: "images/dest-titan.jpg",
        description: "In Titan's dense hydrocarbon atmosphere and low gravity, human visitors can literally strap on mechanical wings and fly like birds above dunes.",
        features: ["Atmospheric wing-gliding", "Kraken Mare hydrofoil tour", "Panoramic view of Saturn's rings"]
    },
    {
        id: "orbital-spa",
        title: "ASTRA Orbital Sanctuary",
        category: "orbital",
        price: 18500,
        duration: 3,
        distance: "420 km",
        difficulty: "Beginner",
        rating: 5.0,
        status: "open",
        statusText: "Booking Open",
        image: "images/dest-orbital-spa.jpg",
        description: "A quick 3-day luxury getaway in Low Earth Orbit. Enjoy microgravity zero-g wellness spas, panoramic cupola views, and 16 spectacular orbital sunrises every 24 hours.",
        features: ["Zero-G sensory flotation tanks", "360-degree panoramic cupola", "Space sommelier wine tasting"]
    },
    {
        id: "venus-cloud",
        title: "Venus — Aphrodite Aerostat City",
        category: "interplanetary",
        price: 3100000,
        duration: 120,
        distance: "41,000,000 km",
        difficulty: "Challenging",
        rating: 4.6,
        status: "limited",
        statusText: "Limited Berths",
        image: "images/dest-venus.jpg",
        description: "Float 55 km above Venus in high-altitude aerostats where atmospheric pressure and ambient temperatures match Earth's temperate Mediterranean zone.",
        features: ["Thermal sulfuric blimp cruises", "Golden dawn observation decks", "Upper-atmosphere laboratory access"]
    },
    {
        id: "ceres-port",
        title: "Ceres — Asteroid Belt Waystation",
        category: "deep-space",
        price: 5400000,
        duration: 365,
        distance: "414,000,000 km",
        difficulty: "Moderate",
        rating: 4.5,
        status: "planned",
        statusText: "Planned Voyage",
        image: "images/dest-ceres.jpg",
        description: "The gateway to the Outer Solar System. Reside inside the hollowed-out subterranean caverns of the dwarf planet Ceres and inspect prospecting mining drones.",
        features: ["Subterranean cavern habitats", "Occator bright spot excursions", "Asteroid core prospecting tours"]
    },
    {
        id: "helios-watch",
        title: "Helios — Solar Corona Watch",
        category: "interplanetary",
        price: 4200000,
        duration: 90,
        distance: "50,000,000 km",
        difficulty: "Challenging",
        rating: 4.9,
        status: "open",
        statusText: "Booking Open",
        image: "images/dest-helios.jpg",
        description: "Sail within 0.3 AU of the Sun behind multi-layered magnetic and carbon-composite shields to witness coronal mass ejections and solar storms up close.",
        features: ["Layered magnetic plasma shields", "Heliophysics science observatory", "Ultra-high frequency solar displays"]
    }
];

// Current filter state
let activeCategory = "all";
let searchQuery = "";
let currentSort = "featured";

$(document).ready(function () {
    // 1. Initial DOM render
    filterAndRender();

    // 2. Search input event
    $("#destinationSearch").on("input", function () {
        searchQuery = $(this).val().trim().toLowerCase();
        filterAndRender();
    });

    // Clear search on Escape key
    $("#destinationSearch").on("keydown", function (e) {
        if (e.key === "Escape") {
            $(this).val("");
            searchQuery = "";
            filterAndRender();
        }
    });

    // 3. Category Filter buttons
    $(".filter-pill").on("click", function () {
        $(".filter-pill").removeClass("active");
        $(this).addClass("active");
        activeCategory = $(this).attr("data-category");
        filterAndRender();
    });

    // 4. Sort dropdown change
    $("#sortSelect").on("change", function () {
        currentSort = $(this).val();
        filterAndRender();
    });

    // 5. Empty State Reset button
    $(document).on("click", "#resetFiltersBtn", function () {
        searchQuery = "";
        activeCategory = "all";
        currentSort = "featured";
        $("#destinationSearch").val("");
        $("#sortSelect").val("featured");
        $(".filter-pill").removeClass("active");
        $('.filter-pill[data-category="all"]').addClass("active");
        filterAndRender();
    });

    // 6. jQuery Feature: Quick View Modal (fadeIn / fadeOut)
    $(document).on("click", ".quick-view-btn", function (e) {
        e.preventDefault();
        const id = $(this).attr("data-id");
        openQuickViewModal(id);
    });

    $(".modal-close-btn, .astra-modal-overlay").on("click", function (e) {
        if (e.target === this) {
            closeQuickViewModal();
        }
    });

    $(document).on("keydown", function (e) {
        if (e.key === "Escape") {
            closeQuickViewModal();
        }
    });
});

/**
 * Filter, sort and render destinations using DOM manipulation
 */
function filterAndRender() {
    let results = destinationsData.filter(function (item) {
        // Category check
        const matchesCategory = (activeCategory === "all") || (item.category === activeCategory);
        
        // Search query check (title, description, or difficulty)
        const matchesSearch = !searchQuery || 
            item.title.toLowerCase().includes(searchQuery) || 
            item.description.toLowerCase().includes(searchQuery) ||
            item.difficulty.toLowerCase().includes(searchQuery);

        return matchesCategory && matchesSearch;
    });

    // Apply Sorting
    if (currentSort === "price-asc") {
        results.sort((a, b) => a.price - b.price);
    } else if (currentSort === "price-desc") {
        results.sort((a, b) => b.price - a.price);
    } else if (currentSort === "duration-asc") {
        results.sort((a, b) => a.duration - b.duration);
    } else if (currentSort === "rating-desc") {
        results.sort((a, b) => b.rating - a.rating);
    }

    renderCards(results);
    updateCalculatedStats(results);
}

/**
 * Generates DOM cards dynamically
 */
function renderCards(list) {
    const $container = $("#destinationsContainer");
    $container.empty();

    if (list.length === 0) {
        const emptyHtml = `
            <div class="empty-state">
                <span class="empty-state-icon">🔭</span>
                <h3>No Cosmic Expeditions Found</h3>
                <p>We could not find any voyages matching "${escapeHtml(searchQuery)}" in this category.</p>
                <button type="button" id="resetFiltersBtn" class="astra-btn astra-btn-sm mt-3">Reset All Filters</button>
            </div>
        `;
        $container.append(emptyHtml);
        return;
    }

    list.forEach(function (dest) {
        const formattedPrice = formatPrice(dest.price);
        const cardHtml = `
            <div class="col-12 col-md-6 col-lg-4 d-flex">
                <article class="astra-card w-100 d-flex flex-column" data-id="${dest.id}">
                    <div class="card-img-wrapper">
                        <img src="${dest.image}" alt="${dest.title}" style="height: 200px;">
                    </div>
                    
                    <div class="d-flex justify-content-between align-items-center mb-2">
                        <span class="status-badge ${dest.status}">${dest.statusText}</span>
                        <span class="small text-secondary">⭐ ${dest.rating.toFixed(1)} / 5.0</span>
                    </div>

                    <h3 class="h5 mb-2">${dest.title}</h3>
                    <p class="small flex-grow-1 mb-3">${dest.description}</p>

                    <div class="p-2 mb-3 rounded" style="background: rgba(7, 10, 19, 0.6); font-size: 13px;">
                        <div class="d-flex justify-content-between mb-1">
                            <span class="text-secondary">Duration:</span>
                            <span class="fw-bold">${dest.duration} days</span>
                        </div>
                        <div class="d-flex justify-content-between mb-1">
                            <span class="text-secondary">Distance:</span>
                            <span class="fw-bold">${dest.distance}</span>
                        </div>
                        <div class="d-flex justify-content-between">
                            <span class="text-secondary">Base Fare:</span>
                            <span class="fw-bold text-info">${formattedPrice}</span>
                        </div>
                    </div>

                    <div class="d-flex gap-2 mt-auto">
                        <a href="booking.html?dest=${dest.id}" class="astra-btn flex-grow-1 astra-btn-sm">
                            Book Trip
                        </a>
                        <button type="button" class="astra-btn-outline astra-btn-sm quick-view-btn" data-id="${dest.id}" aria-label="Quick specs for ${dest.title}">
                            Quick View
                        </button>
                    </div>
                </article>
            </div>
        `;
        $container.append(cardHtml);
    });
}

/**
 * Calculates live count and average price
 */
function updateCalculatedStats(list) {
    $("#shownCount").text(list.length);
    $("#totalCount").text(destinationsData.length);

    if (list.length > 0) {
        const totalPrice = list.reduce((acc, curr) => acc + curr.price, 0);
        const avg = Math.round(totalPrice / list.length);
        $("#avgPrice").text(formatPrice(avg));
    } else {
        $("#avgPrice").text("$0");
    }
}

/**
 * Formats numbers into currency format ($49,000 or $2.4M)
 */
function formatPrice(num) {
    if (num >= 1000000) {
        return "$" + (num / 1000000).toFixed(1) + "M";
    }
    return "$" + num.toLocaleString("en-US");
}

/**
 * Modal viewer with jQuery fadeIn
 */
function openQuickViewModal(id) {
    const dest = destinationsData.find(item => item.id === id);
    if (!dest) return;

    $("#modalTitle").text(dest.title);
    $("#modalImage").attr("src", dest.image).attr("alt", dest.title);
    $("#modalDesc").text(dest.description);
    $("#modalDuration").text(dest.duration + " Earth Days");
    $("#modalDistance").text(dest.distance);
    $("#modalPrice").text(formatPrice(dest.price));
    $("#modalDifficulty").text(dest.difficulty);
    $("#modalRating").text(dest.rating + " / 5.0");

    const $features = $("#modalFeatures").empty();
    dest.features.forEach(feat => {
        $features.append(`<li>${feat}</li>`);
    });

    $("#modalBookLink").attr("href", `booking.html?dest=${dest.id}`);
    $(".astra-modal-overlay").css("display", "flex").hide().stop(true, true).fadeIn(250);
}

function closeQuickViewModal() {
    $(".astra-modal-overlay").stop(true, true).fadeOut(200);
}

function escapeHtml(string) {
    return String(string)
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#039;");
}
