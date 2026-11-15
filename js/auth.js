/**
 * ASTRA Space Travel - Authentication & Session Management Module
 * Web Technologies 1 (Front End) - Final Project
 * 
 * Manages:
 * - Local user registration & login (astra_users)
 * - Session state (astra_session)
 * - Flight reservations (astra_bookings)
 * - Dynamic navbar authentication status
 */

(function (window, $) {
    "use strict";

    const USERS_STORAGE_KEY = "astra_users";
    const SESSION_STORAGE_KEY = "astra_session";
    const BOOKINGS_STORAGE_KEY = "astra_bookings";

    const AstraAuth = {
        // --- Storage Helpers ---
        getUsers: function () {
            try {
                const raw = localStorage.getItem(USERS_STORAGE_KEY);
                return raw ? JSON.parse(raw) : [];
            } catch (err) {
                console.error("Failed to load users from localStorage", err);
                return [];
            }
        },

        saveUsers: function (users) {
            try {
                localStorage.setItem(USERS_STORAGE_KEY, JSON.stringify(users));
                return true;
            } catch (err) {
                console.error("Failed to save users to localStorage", err);
                return false;
            }
        },

        getSession: function () {
            try {
                const raw = localStorage.getItem(SESSION_STORAGE_KEY);
                return raw ? JSON.parse(raw) : null;
            } catch (err) {
                console.error("Failed to parse session", err);
                return null;
            }
        },

        setSession: function (user) {
            try {
                const sessionPayload = {
                    id: user.id,
                    fullName: user.fullName,
                    email: user.email.toLowerCase(),
                    loggedInAt: new Date().toISOString()
                };
                localStorage.setItem(SESSION_STORAGE_KEY, JSON.stringify(sessionPayload));
                this.updateNavbarAuth();
                $(document).trigger("astra:authChange", [sessionPayload]);
                return sessionPayload;
            } catch (err) {
                console.error("Failed to set session", err);
                return null;
            }
        },

        clearSession: function () {
            try {
                localStorage.removeItem(SESSION_STORAGE_KEY);
                this.updateNavbarAuth();
                $(document).trigger("astra:authChange", [null]);
                return true;
            } catch (err) {
                console.error("Failed to clear session", err);
                return false;
            }
        },

        // --- User Authentication ---
        registerUser: function (data) {
            const fullName = (data.fullName || "").trim();
            const email = (data.email || "").trim().toLowerCase();
            const password = (data.password || "").trim();

            if (!fullName || fullName.length < 3) {
                return { success: false, field: "fullName", message: "Please enter your full legal name." };
            }

            const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
            if (!email || !emailRegex.test(email)) {
                return { success: false, field: "email", message: "Please enter a valid email address." };
            }

            if (!password || password.length < 6) {
                return { success: false, field: "password", message: "Password must be at least 6 characters long." };
            }

            const users = this.getUsers();
            const existingUser = users.find(u => u.email.toLowerCase() === email);
            if (existingUser) {
                return { success: false, field: "email", message: "An astronaut account with this email already exists." };
            }

            const newUser = {
                id: "usr_" + Date.now().toString(36) + Math.random().toString(36).substr(2, 5),
                fullName: fullName,
                email: email,
                password: password, // Demo client-side storage
                createdAt: new Date().toISOString()
            };

            users.push(newUser);
            this.saveUsers(users);
            this.setSession(newUser);

            return { success: true, user: newUser };
        },

        loginUser: function (email, password) {
            email = (email || "").trim().toLowerCase();
            password = (password || "").trim();

            if (!email) {
                return { success: false, field: "loginEmail", message: "Email is required." };
            }
            if (!password) {
                return { success: false, field: "loginPassword", message: "Password is required." };
            }

            const users = this.getUsers();
            const foundUser = users.find(u => u.email.toLowerCase() === email && u.password === password);

            if (!foundUser) {
                return {
                    success: false,
                    field: "general",
                    message: "Incorrect orbital email or demo password. Please try again or create a new account."
                };
            }

            this.setSession(foundUser);
            return { success: true, user: foundUser };
        },

        logoutUser: function () {
            this.clearSession();
        },

        // --- Bookings Management ---
        getBookings: function (userEmail) {
            try {
                const raw = localStorage.getItem(BOOKINGS_STORAGE_KEY);
                const all = raw ? JSON.parse(raw) : [];
                if (!userEmail) {
                    return all;
                }
                const normalized = userEmail.toLowerCase();
                return all.filter(b => 
                    (b.userEmail && b.userEmail.toLowerCase() === normalized) ||
                    (b.email && b.email.toLowerCase() === normalized)
                );
            } catch (err) {
                console.error("Failed to load bookings", err);
                return [];
            }
        },

        saveBooking: function (bookingData) {
            try {
                const raw = localStorage.getItem(BOOKINGS_STORAGE_KEY);
                const bookings = raw ? JSON.parse(raw) : [];
                
                const session = this.getSession();
                const newBooking = Object.assign({}, bookingData, {
                    id: bookingData.id || "ASTRA-" + Math.floor(100000 + Math.random() * 900000),
                    createdAt: bookingData.createdAt || new Date().toISOString(),
                    userEmail: session ? session.email : (bookingData.email || "")
                });

                bookings.unshift(newBooking);
                localStorage.setItem(BOOKINGS_STORAGE_KEY, JSON.stringify(bookings));
                $(document).trigger("astra:bookingSaved", [newBooking]);
                return newBooking;
            } catch (err) {
                console.error("Failed to save booking", err);
                return null;
            }
        },

        removeBooking: function (bookingId) {
            try {
                const raw = localStorage.getItem(BOOKINGS_STORAGE_KEY);
                let bookings = raw ? JSON.parse(raw) : [];
                bookings = bookings.filter(b => b.id !== bookingId && b.reference !== bookingId);
                localStorage.setItem(BOOKINGS_STORAGE_KEY, JSON.stringify(bookings));
                $(document).trigger("astra:bookingRemoved", [bookingId]);
                return true;
            } catch (err) {
                console.error("Failed to remove booking", err);
                return false;
            }
        },

        clearAllBookings: function (userEmail) {
            try {
                if (!userEmail) {
                    localStorage.setItem(BOOKINGS_STORAGE_KEY, JSON.stringify([]));
                } else {
                    const normalized = userEmail.toLowerCase();
                    const raw = localStorage.getItem(BOOKINGS_STORAGE_KEY);
                    let bookings = raw ? JSON.parse(raw) : [];
                    bookings = bookings.filter(b => 
                        (b.userEmail && b.userEmail.toLowerCase() !== normalized) &&
                        (b.email && b.email.toLowerCase() !== normalized)
                    );
                    localStorage.setItem(BOOKINGS_STORAGE_KEY, JSON.stringify(bookings));
                }
                $(document).trigger("astra:bookingsCleared");
                return true;
            } catch (err) {
                console.error("Failed to clear bookings", err);
                return false;
            }
        },

        // --- Navbar Synchronization ---
        updateNavbarAuth: function () {
            const session = this.getSession();
            const $profileLink = $("#navProfileLink");
            const $authSlot = $("#navAuthSlot");

            if (session) {
                const firstName = session.fullName.split(/\s+/)[0] || "Passenger";
                if ($profileLink.length) {
                    const userSvg = `<svg class="nav-user-svg" width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="vertical-align: -2px; margin-right: 4px;" aria-hidden="true"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path><circle cx="12" cy="7" r="4"></circle></svg>`;
                    $profileLink.html(`${userSvg}<span class="nav-user-name">${escapeHtml(firstName)}</span>`);
                    $profileLink.attr("title", `Signed in as ${session.fullName}`);
                }

                if ($authSlot.length) {
                    $authSlot.html(
                        `<button type="button" class="nav-logout-btn" id="navLogoutBtn" aria-label="Log Out of your ASTRA account" title="Log Out">Log Out</button>`
                    );
                }
            } else {
                if ($profileLink.length) {
                    $profileLink.text("Profile");
                    $profileLink.attr("title", "Passenger Portal & Sign In");
                }
                if ($authSlot.length) {
                    $authSlot.empty();
                }
            }
        }
    };

    function escapeHtml(text) {
        if (!text) return "";
        return String(text)
            .replace(/&/g, "&amp;")
            .replace(/</g, "&lt;")
            .replace(/>/g, "&gt;")
            .replace(/"/g, "&quot;")
            .replace(/'/g, "&#039;");
    }

    // Handle Navbar Logout Click
    $(document).on("click", "#navLogoutBtn", function (e) {
        e.preventDefault();
        AstraAuth.logoutUser();
        // If we are currently on profile.html, refresh view
        if (typeof window.renderProfileView === "function") {
            window.renderProfileView();
        } else if (window.location.pathname.endsWith("profile.html")) {
            window.location.reload();
        }
    });

    $(document).ready(function () {
        AstraAuth.updateNavbarAuth();
    });

    window.AstraAuth = AstraAuth;

})(window, window.jQuery || window.$);
