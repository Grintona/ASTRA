$(document).ready(function () {
    $(".faq-question").on("click", function () {
        const $item = $(this).closest(".faq-item");
        const $answer = $item.find(".faq-answer");
        const isActive = $item.hasClass("active");

        $(".faq-item").not($item).removeClass("active").find(".faq-answer").stop(true, true).slideUp(280);

        if (isActive) {
            $item.removeClass("active");
            $answer.stop(true, true).slideUp(280);
        } else {
            $item.addClass("active");
            $answer.stop(true, true).slideDown(280);
        }
    });

    $(".mission-filter-btn").on("click", function () {
        $(".mission-filter-btn").removeClass("active");
        $(this).addClass("active");

        const filterStatus = $(this).attr("data-status");

        $("#missionTableBody tr").each(function () {
            const rowStatus = $(this).attr("data-status");
            if (filterStatus === "all" || rowStatus === filterStatus) {
                $(this).stop(true, true).fadeIn(250);
            } else {
                $(this).stop(true, true).fadeOut(250);
            }
        });
    });
});
