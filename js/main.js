
$(document).ready(function () {
    const currentPath = window.location.pathname.split("/").pop() || "index.html";
    
    $(".navbar-nav .nav-link").each(function () {
        const href = $(this).attr("href");
        if (href === currentPath || (currentPath === "" && href === "index.html")) {
            $(".navbar-nav .nav-link").removeClass("active").removeAttr("aria-current");
            $(this).addClass("active").attr("aria-current", "page");
        }
    });

    $(".navbar-nav .nav-link").on("click", function () {
        const navbarCollapse = $("#mainMenu");
        if (navbarCollapse.hasClass("show")) {
            const bsCollapse = bootstrap.Collapse.getInstance(navbarCollapse[0]);
            if (bsCollapse) {
                bsCollapse.hide();
            }
        }
    });


    if ($("#backToTopBtn").length === 0) {
        $("body").append(
            '<button id="backToTopBtn" type="button" aria-label="Scroll back to top" title="Back to top">↑</button>'
        );
    }

    const $backToTopBtn = $("#backToTopBtn");

    $(window).on("scroll", function () {
        if ($(this).scrollTop() > 300) {
            $backToTopBtn.stop(true, true).fadeIn(300);
        } else {
            $backToTopBtn.stop(true, true).fadeOut(300);
        }
    });

    $backToTopBtn.on("click", function (e) {
        e.preventDefault();
        $("html, body").stop(true, false).animate({ scrollTop: 0 }, 600);
    });

    $('a[href^="#"]:not([href="#"]):not([data-bs-toggle])').on("click", function (e) {
        const target = $(this.getAttribute("href"));
        if (target.length) {
            e.preventDefault();
            $("html, body").stop(true, false).animate({
                scrollTop: target.offset().top - 90
            }, 600);
        }
    });

    initLaunchCountdown();


    initNumberCounters();
});


function initLaunchCountdown() {
    const $days = $("#countdownDays");
    const $hours = $("#countdownHours");
    const $mins = $("#countdownMins");
    const $secs = $("#countdownSecs");

    if (!$days.length) return; 


    const targetDate = new Date();
    targetDate.setDate(targetDate.getDate() + 42);
    targetDate.setHours(targetDate.getHours() + 14);
    targetDate.setMinutes(targetDate.getMinutes() + 28);

    function updateTimer() {
        const now = new Date().getTime();
        const difference = targetDate.getTime() - now;

        if (difference <= 0) {
            $days.text("00");
            $hours.text("00");
            $mins.text("00");
            $secs.text("00");
            return;
        }

        const days = Math.floor(difference / (1000 * 60 * 60 * 24));
        const hours = Math.floor((difference % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
        const mins = Math.floor((difference % (1000 * 60 * 60)) / (1000 * 60));
        const secs = Math.floor((difference % (1000 * 60)) / 1000);

        $days.text(days < 10 ? "0" + days : days);
        $hours.text(hours < 10 ? "0" + hours : hours);
        $mins.text(mins < 10 ? "0" + mins : mins);
        $secs.text(secs < 10 ? "0" + secs : secs);
    }

    updateTimer();
    setInterval(updateTimer, 1000);
}

function initNumberCounters() {
    const $counters = $(".stat-number");
    if (!$counters.length) return;

    $counters.each(function () {
        const $this = $(this);
        const targetStr = $this.attr("data-target");
        if (!targetStr) return;

        const target = parseFloat(targetStr);
        const suffix = $this.attr("data-suffix") || "";
        const isDecimal = targetStr.includes(".");
        let count = 0;
        const step = target / 40;

        const interval = setInterval(function () {
            count += step;
            if (count >= target) {
                count = target;
                clearInterval(interval);
            }
            $this.text((isDecimal ? count.toFixed(1) : Math.floor(count)) + suffix);
        }, 30);
    });
}
