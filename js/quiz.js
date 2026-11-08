

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
            rank = "Elite Deep-Space Expeditionary";
            recommendation = "You possess exceptional physiological endurance and composure under pressure. Your answers suggest a preference for fictional voyages to Mars or Europa.";
            destKey = "mars";
            rankColor = "#f43f5e";
        } else if (percentage >= 65) {
            rank = "Certified Lunar Explorer";
            recommendation = "You have balanced stamina and psychological readiness. You are perfectly suited for lunar surface stays at Moon Base Shackleton!";
            destKey = "moon";
            rankColor = "#34d399";
        } else {
            rank = "Orbital Wellness Novice";
            recommendation = "You prefer comfort and restorative relaxation in microgravity. We recommend starting with a 3-day retreat aboard the ASTRA Orbital Sanctuary!";
            destKey = "orbital-spa";
            rankColor = "#c084fc";
        }

        $("#quizScoreValue").text(totalScore + " / " + maxScore + " pts (" + percentage + "% Readiness)");
        $("#quizRank").text(rank).css("color", rankColor);
        $("#quizRecommendation").text(recommendation);
        $("#quizBookLink").attr("href", `booking.html?dest=${destKey}`);
        const $resultBox = $("#quizResultCard");
        $resultBox.stop(true, true).slideDown(400);
        $("html, body").animate({
            scrollTop: $resultBox.offset().top - 120
        }, 500);
    });
    $("#retakeQuizBtn").on("click", function () {
        $("#spaceQuizForm")[0].reset();
        $("#quizWarning").stop(true, true).hide();
        $("#spaceQuizForm input").first().trigger("focus");
        $(".quiz-option-label").removeClass("selected");
        $("#quizResultCard").stop(true, true).slideUp(300);
        $("html, body").animate({
            scrollTop: $("#spaceQuizForm").offset().top - 100
        }, 400);
    });
});
