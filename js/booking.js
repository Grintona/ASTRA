const DESTINATION_RATES = {
    "moon": { name: "Moon — Shackleton Base", baseFare: 49000, duration: "7 Earth Days", minDate: "2030-06-15" },
    "mars": { name: "Mars — Olympus Mons", baseFare: 2400000, duration: "180 Earth Days", minDate: "2030-09-10" },
    "europa": { name: "Europa — Sub-Oceanic Lab", baseFare: 8700000, duration: "2 Years", minDate: "2031-03-20" },
    "titan": { name: "Titan — Methane Dunes", baseFare: 12500000, duration: "3 Years", minDate: "2031-10-01" },
    "orbital-spa": { name: "ASTRA Orbital Sanctuary", baseFare: 18500, duration: "3 Earth Days", minDate: "2030-01-15" },
    "ceres-port": { name: "Ceres - Asteroid Belt Waystation", baseFare: 5400000, duration: "365 Earth Days", minDate: "2031-01-01" },
    "helios-watch": { name: "Helios - Solar Corona Watch", baseFare: 4200000, duration: "90 Earth Days", minDate: "2030-01-15" },
    "venus-cloud": { name: "Venus — Aphrodite Cloud City", baseFare: 3100000, duration: "120 Earth Days", minDate: "2030-11-05" }

};

const CLASS_MULTIPLIERS = {
    "explorer": 1.0,
    "voyager": 1.35,
    "first": 1.80
};

const ADDON_PRICES = {
    "spacewalk": 15000,
    "insurance": 8000,
    "lounge": 5000
};

$(document).ready(function () {
    const $form = $("#bookingForm");
    if (!$form.length) return;

    const urlParams = new URLSearchParams(window.location.search);
    const destParam = urlParams.get("dest");
    if (destParam && DESTINATION_RATES[destParam]) {
        $("#destination").val(destParam);
    }

    if (window.AstraAuth) {
        const session = AstraAuth.getSession();
        if (session) {
            if (!$("#fullName").val()) $("#fullName").val(session.fullName);
            if (!$("#email").val()) $("#email").val(session.email);
        }
    }

    $form.on("input change", "input, select", function () {
        calculateLiveEstimate();
    });

    $form.find("input, select").on("input change", function () {
        clearFieldError($(this));
    });

    $form.on("submit", function (e) {
        e.preventDefault();

        const isValid = validateBookingForm();
        if (isValid) {
            handleSuccessfulSubmission();
        }
    });

    calculateLiveEstimate();
});


function calculateLiveEstimate() {
    const destKey = $("#destination").val() || "moon";
    const destInfo = DESTINATION_RATES[destKey] || DESTINATION_RATES["moon"];

    const travelClass = $("#travelClass").val() || "explorer";
    const classMultiplier = CLASS_MULTIPLIERS[travelClass] || 1.0;

    let passengers = parseInt($("#passengers").val(), 10);
    if (isNaN(passengers) || passengers < 1) passengers = 1;
    if (passengers > 6) passengers = 6;
    let addonsPerPerson = 0;
    if ($("#addonSpacewalk").is(":checked")) addonsPerPerson += ADDON_PRICES.spacewalk;
    if ($("#addonInsurance").is(":checked")) addonsPerPerson += ADDON_PRICES.insurance;
    if ($("#addonLounge").is(":checked")) addonsPerPerson += ADDON_PRICES.lounge;

    const basePerPerson = destInfo.baseFare * classMultiplier;
    const totalPerPerson = basePerPerson + addonsPerPerson;
    const totalFare = totalPerPerson * passengers;
    const depositDue = Math.round(totalFare * 0.20); 

    $("#summaryDestination").text(destInfo.name);
    $("#summaryDuration").text(destInfo.duration);
    $("#summaryDate").text($("#departure").val() || destInfo.minDate);
    $("#summaryPassengers").text(passengers + (passengers > 1 ? " Passengers" : " Passenger"));
    $("#summaryClass").text(capitalize(travelClass) + " (×" + classMultiplier.toFixed(2) + ")");
    $("#summaryFare").text(formatMoney(Math.round(totalPerPerson)));
    $("#totalPrice").text(formatMoney(Math.round(totalFare)));
    $("#depositPrice").text(formatMoney(depositDue));
}

function validateBookingForm() {
    let isValid = true;
    let $firstInvalid = null;

    const $name = $("#fullName");
    const nameVal = $name.val().trim();
    const nameRegex = /^[A-Za-zА-Яа-яЁёІіҢңҒғҮүҰұҚқӨөӘә\s'-]{3,80}$/;
    if (!nameVal) {
        showFieldError($name, "Please enter your full passenger name.");
        isValid = false;
        if (!$firstInvalid) $firstInvalid = $name;
    } else if (!nameRegex.test(nameVal) || nameVal.split(/\s+/).length < 2) {
        showFieldError($name, "Please provide your first and last name (letters only).");
        isValid = false;
        if (!$firstInvalid) $firstInvalid = $name;
    } else {
        markFieldValid($name);
    }

    const $email = $("#email");
    const emailVal = $email.val().trim();
    const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
    if (!emailVal) {
        showFieldError($email, "Email address is required.");
        isValid = false;
        if (!$firstInvalid) $firstInvalid = $email;
    } else if (!emailRegex.test(emailVal)) {
        showFieldError($email, "Please enter a valid email address (e.g., name@domain.com).");
        isValid = false;
        if (!$firstInvalid) $firstInvalid = $email;
    } else {
        markFieldValid($email);
    }

    const $phone = $("#phone");
    const phoneVal = $phone.val().trim();
    const phoneRegex = /^\+?[0-9\s\-()]{10,20}$/;
    if (!phoneVal) {
        showFieldError($phone, "Emergency contact phone is required.");
        isValid = false;
        if (!$firstInvalid) $firstInvalid = $phone;
    } else if (!phoneRegex.test(phoneVal) || phoneVal.replace(/\D/g, "").length < 10 || phoneVal.replace(/\D/g, "").length > 18) {
        showFieldError($phone, "Enter a valid phone number (10-18 digits, e.g. +7 701 123 4567).");
        isValid = false;
        if (!$firstInvalid) $firstInvalid = $phone;
    } else {
        markFieldValid($phone);
    }

    const $departure = $("#departure");
    const dateVal = $departure.val();
    if (!dateVal) {
        showFieldError($departure, "Please select an expedition departure date.");
        isValid = false;
        if (!$firstInvalid) $firstInvalid = $departure;
    } else {
        const selectedDate = new Date(dateVal);
        const earliestAllowed = new Date((DESTINATION_RATES[$("#destination").val()] || DESTINATION_RATES.moon).minDate);
        if (isNaN(selectedDate.getTime()) || selectedDate < earliestAllowed) {
            showFieldError($departure, "Choose a date on or after " + earliestAllowed.toISOString().slice(0, 10) + ".");
            isValid = false;
            if (!$firstInvalid) $firstInvalid = $departure;
        } else {
            markFieldValid($departure);
        }
    }

    const $passengers = $("#passengers");
    const passCount = Number($passengers.val());
    if (!Number.isInteger(passCount) || passCount < 1 || passCount > 6) {
        showFieldError($passengers, "Passenger limit per stateroom booking is 1 to 6.");
        isValid = false;
        if (!$firstInvalid) $firstInvalid = $passengers;
    } else {
        markFieldValid($passengers);
    }

    const $dest = $("#destination");
    if (!DESTINATION_RATES[$dest.val()]) {
        showFieldError($dest, "Please choose a spaceflight destination.");
        isValid = false;
        if (!$firstInvalid) $firstInvalid = $dest;
    } else {
        markFieldValid($dest);
    }

    const $travelClass = $("#travelClass");
    if (!CLASS_MULTIPLIERS[$travelClass.val()]) {
        showFieldError($travelClass, "Please select a travel class.");
        isValid = false;
        if (!$firstInvalid) $firstInvalid = $travelClass;
    } else { markFieldValid($travelClass); }

    if ($firstInvalid) {
        $firstInvalid.focus();
    }

    return isValid;
}

function showFieldError($field, message) {
    $field.removeClass("is-valid").addClass("is-invalid");
    let $feedback = $field.siblings(".invalid-feedback");
    if ($feedback.length === 0) {
        $feedback = $field.parent().find(".invalid-feedback");
    }
    $feedback.text(message).show();
}

function clearFieldError($field) {
    $field.removeClass("is-invalid");
    let $feedback = $field.siblings(".invalid-feedback");
    if ($feedback.length === 0) {
        $feedback = $field.parent().find(".invalid-feedback");
    }
    $feedback.hide().text("");
}

function markFieldValid($field) {
    clearFieldError($field);
    $field.addClass("is-valid");
}

function handleSuccessfulSubmission() {
    const bookingCode = "ASTRA-" + Math.floor(100000 + Math.random() * 900000);
    const passengerName = $("#fullName").val().trim();
    const contactEmail = $("#email").val().trim();
    const contactPhone = $("#phone").val().trim();
    const destName = $("#summaryDestination").text();
    const destKey = $("#destination").val();
    const departureDate = $("#departure").val();
    const duration = $("#summaryDuration").text();
    const passengers = parseInt($("#passengers").val(), 10) || 1;
    const travelClass = $("#summaryClass").text();
    const total = $("#totalPrice").text();
    const deposit = $("#depositPrice").text();

    const selectedAddons = [];
    if ($("#addonSpacewalk").is(":checked")) selectedAddons.push("Zero-G Spacewalk (EVA)");
    if ($("#addonInsurance").is(":checked")) selectedAddons.push("Cosmic Radiation Insurance");
    if ($("#addonLounge").is(":checked")) selectedAddons.push("VIP Orbital Lounge");

    const bookingData = {
        id: bookingCode,
        reference: bookingCode,
        fullName: passengerName,
        email: contactEmail,
        phone: contactPhone,
        destination: destName,
        destinationKey: destKey,
        departureDate: departureDate,
        duration: duration,
        passengers: passengers,
        travelClass: travelClass,
        addons: selectedAddons,
        totalPrice: total,
        depositPrice: deposit,
        createdAt: new Date().toISOString()
    };

    if (!window.AstraAuth || !window.AstraAuth.saveBooking(bookingData)) {
        $("#bookingSuccessCard").hide();
        if (!$("#bookingStorageError").length) $("#bookingForm").prepend('<p id="bookingStorageError" class="alert alert-danger" role="alert"></p>');
        $("#bookingStorageError").text("Could not save your booking. Check browser storage and try again.");
        return;
    }
    $("#bookingStorageError").remove();

    $("#confirmedCode").text(bookingCode);
    $("#confirmedPassenger").text(passengerName);
    $("#confirmedDest").text(destName);
    $("#confirmedTotal").text(total);
    $("#confirmedDeposit").text(deposit);

    const $successBox = $("#bookingSuccessCard");
    $successBox.stop(true, true).slideDown(400);

    $("html, body").animate({
        scrollTop: $successBox.offset().top - 100
    }, 500);

    $("#bookingForm")[0].reset();
    $("#bookingForm").find(".is-valid, .is-invalid").removeClass("is-valid is-invalid");

    if (window.AstraAuth) {
        const session = AstraAuth.getSession();
        if (session) {
            $("#fullName").val(session.fullName);
            $("#email").val(session.email);
        }
    }

    calculateLiveEstimate();
}

function formatMoney(num) {
    return "$" + Number(num).toLocaleString("en-US");
}

function capitalize(str) {
    if (!str) return "";
    return str.charAt(0).toUpperCase() + str.slice(1);
}
