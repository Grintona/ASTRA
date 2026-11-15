

$(document).ready(function () {
    const $quizForm = $("#spaceQuizForm");
    if (!$quizForm.length) return;
    $("#spaceQuizForm input[type=radio]").on("change", function () {
        const $parent = $(this).closest(".quiz-options");
        $parent.find(".quiz-option-label").removeClass("selected");
        $(this).closest(".quiz-option-label").addClass("selected");
        $("#quizWarning").hide();
        $("#quizResultCard").stop(true, true).hide();
    });
    $quizForm.on("submit", function (e) {
        e.preventDefault();
        const answers = [];
        let allAnswered = true;

        for (let q = 1; q <= 5; q++) {
            const selectedVal = $(`input[name="q${q}"]:checked`).val();
            if (!["1", "3", "5"].includes(selectedVal)) {
                allAnswered = false;
                break;
            }
            answers.push(parseInt(selectedVal, 10));
        }

        if (!allAnswered) {
            $("#quizWarning").stop(true, true).slideDown(250).text("Please answer all 5 questions before computing your readiness.");
            return;
        }

        $("#quizWarning").stop(true, true).slideUp(200);
        const maxScore = 25;
        const totalScore = answers.reduce((sum, score) => sum + score, 0);
        const percentage = Math.round((totalScore / maxScore) * 100);
        let rank = "";
        let recommendation = "";
        let destKey = "orbital-spa";
        let rankColor = "#38bdf8";

        if (percentage >= 85) {
            rank = "Mars explorer";
            recommendation = "You chose longer trips and more demanding activities. Try the Mars expedition.";
            destKey = "mars";
            rankColor = "#f43f5e";
        } else if (percentage >= 65) {
            rank = "Lunar explorer";
            recommendation = "You like a mix of exploration and comfort. Take a look at our week on the Moon.";
            destKey = "moon";
            rankColor = "#34d399";
        } else {
            rank = "Orbital traveller";
            recommendation = "You prefer a shorter, relaxed trip. Start with three days at the Orbital Sanctuary.";
            destKey = "orbital-spa";
            rankColor = "#c084fc";
        }

        $("#quizScoreValue").text(totalScore + " / " + maxScore + " pts (" + percentage + "% Readiness)");
        $("#quizRank").text(rank).css("color", rankColor);
        $("#quizRecommendation").text(recommendation);
        $("#quizBookLink").attr("href", `booking.html?dest=${destKey}`);
        try {
            localStorage.setItem("astra_quiz_result", JSON.stringify({ answers, totalScore, maxScore, percentage, rank, recommendation, destination: destKey, completedAt: new Date().toISOString() }));
        } catch (_) {
            $("#quizWarning").stop(true, true).show().text("Your result could not be saved. Check browser storage and try again.");
        }
        const $resultBox = $("#quizResultCard");
        $resultBox.stop(true, true).slideDown(400);
        $("html, body").stop(true, false).animate({
            scrollTop: $resultBox.offset().top - 120
        }, 500);
    });
    try {
        const saved = JSON.parse(localStorage.getItem("astra_quiz_result") || "null");
        if (saved && Array.isArray(saved.answers) && saved.answers.length === 5 && saved.answers.every(value => [1, 3, 5].includes(value))) {
            saved.answers.forEach((value, index) => $(`input[name="q${index + 1}"][value="${value}"]`).prop("checked", true).closest(".quiz-option-label").addClass("selected"));
            $("#quizScoreValue").text(saved.totalScore + " / 25 pts (" + saved.percentage + "% Readiness)");
            $("#quizRank").text(saved.rank);
            $("#quizRecommendation").text(saved.recommendation);
            $("#quizBookLink").attr("href", "booking.html?dest=" + encodeURIComponent(saved.destination));
            $("#quizResultCard").show();
        }
    } catch (_) { /* An unreadable result leaves the quiz empty. */ }
    $("#retakeQuizBtn").on("click", function () {
        $("#spaceQuizForm")[0].reset();
        $("#quizWarning").stop(true, true).hide();
        $("#spaceQuizForm input").first().trigger("focus");
        $(".quiz-option-label").removeClass("selected");
        $("#quizResultCard").stop(true, true).slideUp(300);
        $("html, body").stop(true, false).animate({
            scrollTop: $("#spaceQuizForm").offset().top - 100
        }, 400);
    });
});
