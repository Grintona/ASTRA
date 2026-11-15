$(document).ready(function () {
        renderProfileView();

        $(document).on("astra:authChange", function () {
            renderProfileView();
        });

        $("#tabLoginBtn").on("click", function () {
            switchAuthTab("login");
        });

        $("#tabSignupBtn").on("click", function () {
            switchAuthTab("signup");
        });

        $("#loginForm, #signupForm").on("input change", "input", function () {
            clearFieldError($(this));
            $("#loginGeneralFeedback").addClass("d-none").text("");
        });

        $("#loginForm").on("submit", function (e) {
            e.preventDefault();
            handleLoginSubmit();
        });

        $("#signupForm").on("submit", function (e) {
            e.preventDefault();
            handleSignupSubmit();
        });

        $("#cabinetLogoutBtn").on("click", function () {
            AstraAuth.logoutUser();
            showGlobalAlert("You have logged out of your ASTRA account.", "info");
            renderProfileView();
        });

        $("#clearAllBookingsBtn").on("click", function () {
            const session = AstraAuth.getSession();
            if (!session) return;

            const bookings = AstraAuth.getBookings(session.email);
            if (!bookings.length) {
                showGlobalAlert("There are no bookings to clear.", "warning");
                return;
            }

            if (confirm("Are you sure you want to clear all your booked spaceflight reservations?")) {
                if (!AstraAuth.clearAllBookings(session.email)) { showGlobalAlert("Could not clear bookings. Please try again.", "danger"); return; }
                showGlobalAlert("All flight reservations have been cleared.", "info");
                renderBookingsList();
            }
        });

        $(document).on("click", ".btn-remove-booking", function () {
            const bookingId = $(this).attr("data-id");
            if (!bookingId) return;

            const $card = $(this).closest(".booking-item-card");
            $card.fadeOut(350, function () {
                if (!AstraAuth.removeBooking(bookingId)) { $card.show(); showGlobalAlert("Could not remove booking. Please try again.", "danger"); return; }
                showGlobalAlert("Reservation #" + bookingId + " has been cancelled.", "info");
                renderBookingsList();
            });
        });
    });

    function switchAuthTab(tab) {
        if (tab === "login") {
            $("#tabLoginBtn").addClass("active").attr("aria-selected", "true");
            $("#tabSignupBtn").removeClass("active").attr("aria-selected", "false");
            $("#loginTabPane").removeClass("d-none");
            $("#signupTabPane").addClass("d-none");
        } else {
            $("#tabSignupBtn").addClass("active").attr("aria-selected", "true");
            $("#tabLoginBtn").removeClass("active").attr("aria-selected", "false");
            $("#signupTabPane").removeClass("d-none");
            $("#loginTabPane").addClass("d-none");
        }
    }

    function renderProfileView() {
        const session = AstraAuth.getSession();

        if (session) {
            $("#guestPortalView").addClass("d-none");
            $("#passengerCabinetView").removeClass("d-none");

            const initial = session.fullName ? session.fullName.charAt(0).toUpperCase() : "A";
            $("#passengerAvatarInitial").text(initial);
            $("#passengerDisplayName").text(session.fullName);
            $("#passengerEmailDisplay").text(session.email);
            
            const joinDate = (session.createdAt || session.loggedInAt) ? new Date(session.createdAt || session.loggedInAt).toLocaleDateString() : "Active";
            $("#passengerJoinDate").text(joinDate);

            renderBookingsList();
        } else {
            $("#passengerCabinetView").addClass("d-none");
            $("#guestPortalView").removeClass("d-none");
        }
    }

    function renderBookingsList() {
        const session = AstraAuth.getSession();
        if (!session) return;

        const bookings = AstraAuth.getBookings(session.email);
        const $container = $("#bookingsListContainer");
        const $emptyState = $("#bookingsEmptyState");
        const $clearBtn = $("#clearAllBookingsBtn");

        $("#statBookingsCount").text(bookings.length);

        if (!bookings.length) {
            $container.empty();
            $emptyState.removeClass("d-none");
            $clearBtn.hide();
            $("#statBookingsTotal").text("$0");
            return;
        }

        $emptyState.addClass("d-none");
        $clearBtn.show();

        let totalInvestment = 0;
        let html = "";

        bookings.forEach(function (b) {
            const rawPrice = b.totalPrice ? String(b.totalPrice).replace(/[^0-9.]/g, "") : "0";
            const numPrice = parseFloat(rawPrice) || 0;
            totalInvestment += numPrice;

            const dateStr = b.departureDate || "Scheduled 2030";
            const createdStr = b.createdAt ? new Date(b.createdAt).toLocaleDateString() : "Recent";
            const addonsList = Array.isArray(b.addons) && b.addons.length ? b.addons.join(", ") : "None";

            html += `
                <article class="astra-card booking-item-card p-4" data-id="${escapeHtml(b.id)}">
                    <div class="d-flex flex-column flex-md-row justify-content-between align-items-md-center gap-3 mb-3 border-bottom border-secondary-subtle pb-3">
                        <div class="d-flex align-items-center gap-2 flex-wrap">
                            <span class="badge bg-primary-subtle text-info fw-bold font-monospace" style="font-size: 14px;">
                                ${escapeHtml(b.id || b.reference)}
                            </span>
                            <span class="status-badge open">Confirmed</span>
                        </div>
                        <div class="d-flex align-items-center gap-2">
                            <span class="small text-secondary">Booked: ${escapeHtml(createdStr)}</span>
                            <button type="button" class="btn btn-outline-danger btn-sm btn-remove-booking ms-2" data-id="${escapeHtml(b.id)}" title="Cancel this reservation">
                                Cancel Booking
                            </button>
                        </div>
                    </div>

                    <div class="row g-3">
                        <div class="col-12 col-sm-6 col-md-4">
                            <span class="small text-secondary d-block">Destination</span>
                            <strong class="text-white">${escapeHtml(b.destination || b.destinationName || "Solar Orbit")}</strong>
                        </div>
                        <div class="col-12 col-sm-6 col-md-4">
                            <span class="small text-secondary d-block">Launch Date &amp; Duration</span>
                            <span class="text-white">${escapeHtml(dateStr)} &bull; ${escapeHtml(b.duration || "N/A")}</span>
                        </div>
                        <div class="col-12 col-sm-6 col-md-4">
                            <span class="small text-secondary d-block">Lead Passenger</span>
                            <span class="text-white">${escapeHtml(b.fullName || b.passengerName || session.fullName)}</span>
                        </div>
                        <div class="col-12 col-sm-6 col-md-4">
                            <span class="small text-secondary d-block">Class &amp; Passengers</span>
                            <span class="text-white">${escapeHtml(b.travelClass || "Explorer")} &bull; ${escapeHtml(String(b.passengers || 1))} Person(s)</span>
                        </div>
                        <div class="col-12 col-sm-6 col-md-4">
                            <span class="small text-secondary d-block">Extras</span>
                            <span class="text-secondary small">${escapeHtml(addonsList)}</span>
                        </div>
                        <div class="col-12 col-sm-6 col-md-4">
                            <span class="small text-secondary d-block">Total Fare &amp; Deposit</span>
                            <strong class="text-success">${escapeHtml(b.totalPrice || "$0")}</strong>
                            <small class="text-secondary">(20% Deposit: ${escapeHtml(b.depositPrice || "$0")})</small>
                        </div>
                    </div>
                </article>
            `;
        });

        $container.html(html);
        $("#statBookingsTotal").text("$" + Math.round(totalInvestment).toLocaleString("en-US"));
    }

    function handleLoginSubmit() {
        const $email = $("#loginEmail");
        const $pass = $("#loginPassword");
        const email = $email.val().trim();
        const pass = $pass.val().trim();

        let valid = true;
        if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
            showFieldError($email, "Please enter a valid email address.");
            valid = false;
        } else {
            markFieldValid($email);
        }

        if (!pass) {
            showFieldError($pass, "Please enter your password.");
            valid = false;
        } else {
            markFieldValid($pass);
        }

        if (!valid) return;

        const res = AstraAuth.loginUser(email, pass);
        if (!res.success) {
            $("#loginGeneralFeedback")
                .removeClass("d-none")
                .text(res.message || "Invalid credentials.");
            return;
        }

        $("#loginForm")[0].reset();
        clearFieldError($email);
        clearFieldError($pass);
        showGlobalAlert("Welcome back, Astronaut " + res.user.fullName + "! Clearance verified.", "success");
        renderProfileView();
    }

    function handleSignupSubmit() {
        const $name = $("#signupFullName");
        const $email = $("#signupEmail");
        const $pass = $("#signupPassword");
        const $conf = $("#signupConfirmPassword");

        const nameVal = $name.val().trim();
        const emailVal = $email.val().trim();
        const passVal = $pass.val().trim();
        const confVal = $conf.val().trim();

        let valid = true;

        if (!AstraAuth.isValidFullName(nameVal)) {
            showFieldError($name, "Please provide your first and last name.");
            valid = false;
        } else {
            markFieldValid($name);
        }

        const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
        if (!emailVal || !emailRegex.test(emailVal)) {
            showFieldError($email, "Please provide a valid email address (e.g. name@domain.com).");
            valid = false;
        } else {
            markFieldValid($email);
        }

        if (!passVal || passVal.length < 6) {
            showFieldError($pass, "Password must be at least 6 characters.");
            valid = false;
        } else {
            markFieldValid($pass);
        }

        if (confVal !== passVal) {
            showFieldError($conf, "Passwords do not match.");
            valid = false;
        } else {
            markFieldValid($conf);
        }

        if (!valid) return;

        const res = AstraAuth.registerUser({
            fullName: nameVal,
            email: emailVal,
            password: passVal
        });

        if (!res.success) {
            if (res.field === "email") {
                showFieldError($email, res.message);
            } else {
                showGlobalAlert(res.message, "danger");
            }
            return;
        }

        $("#signupForm")[0].reset();
        $("#signupForm").find(".is-valid, .is-invalid").removeClass("is-valid is-invalid");
        showGlobalAlert("Welcome aboard ASTRA, " + res.user.fullName + "! Your astronaut account is now active.", "success");
        renderProfileView();
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

    function showGlobalAlert(message, type) {
        const $alert = $("#authGlobalAlert");
        $alert
            .removeClass("d-none alert-success alert-danger alert-info alert-warning")
            .addClass("alert-" + (type || "info"))
            .text(message)
            .hide()
            .fadeIn(300);

        $alert.stop(true, true).show().delay(5000).fadeOut(400);
    }

    function escapeHtml(text) {
        if (!text) return "";
        return String(text)
            .replace(/&/g, "&amp;")
            .replace(/</g, "&lt;")
            .replace(/>/g, "&gt;")
            .replace(/"/g, "&quot;")
            .replace(/'/g, "&#039;");
    }

    window.renderProfileView = renderProfileView;
