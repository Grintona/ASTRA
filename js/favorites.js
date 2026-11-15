(function (window, $) {
    "use strict";
    const KEY = "astra_favorites";
    function getAll() {
        try {
            const items = JSON.parse(localStorage.getItem(KEY) || "[]");
            if (!Array.isArray(items)) return [];
            const seen = new Set();
            return items.filter(item => {
                if (!item || typeof item.id !== "string" || typeof item.title !== "string" ||
                    !Number.isFinite(item.price) || item.price < 0 || seen.has(item.id)) return false;
                seen.add(item.id);
                return true;
            });
        } catch (_) { return []; }
    }
    function save(items) {
        try { localStorage.setItem(KEY, JSON.stringify(items)); }
        catch (_) {
            if (!$("#favoritesStorageError").length) {
                $("main").prepend('<p id="favoritesStorageError" class="alert alert-danger container mt-3" role="alert"></p>');
            }
            $("#favoritesStorageError").text("Could not save your changes. Check that browser storage is available and try again.");
            return false;
        }
        $("#favoritesStorageError").remove();
        $(document).trigger("astra:favoritesChange");
        return true;
    }
    window.AstraFavorites = {
        getAll,
        has: id => getAll().some(item => item.id === id),
        count: () => getAll().length,
        total: () => getAll().reduce((sum, item) => sum + item.price, 0),
        toggle: function (destination) {
            const items = getAll();
            return items.some(item => item.id === destination.id)
                ? save(items.filter(item => item.id !== destination.id))
                : save(items.concat({ id: destination.id, title: destination.title, price: destination.price }));
        },
        remove: id => save(getAll().filter(item => item.id !== id)),
        clear: () => save([])
    };
    function renderSaved() {
        const $list = $("#savedToursList");
        if (!$list.length) return;
        const items = getAll();
        $list.empty();
        $("#savedToursEmpty").toggle(items.length === 0);
        $("#clearFavoritesBtn").prop("disabled", items.length === 0);
        $("#savedToursTotal").text("$" + window.AstraFavorites.total().toLocaleString("en-US"));
        items.forEach(item => {
            const $row = $('<article class="astra-card d-flex flex-wrap align-items-center justify-content-between gap-3 p-3"></article>');
            const $details = $("<div></div>").append($("<h3 class='h6 mb-1'></h3>").text(item.title));
            $details.append($("<span class='text-info'></span>").text("$" + item.price.toLocaleString("en-US")));
            const $actions = $('<div class="d-flex gap-2"></div>');
            $actions.append($('<a class="astra-btn astra-btn-sm">Book Trip</a>').attr("href", "booking.html?dest=" + encodeURIComponent(item.id)));
            $actions.append($('<button type="button" class="astra-btn-outline astra-btn-sm">Remove</button>')
                .attr("aria-label", "Remove " + item.title).on("click", () => window.AstraFavorites.remove(item.id)));
            $list.append($row.append($details, $actions));
        });
    }
    $(document).ready(function () {
        renderSaved();
        $("#clearFavoritesBtn").on("click", () => window.AstraFavorites.clear());
        $(document).on("astra:favoritesChange", renderSaved);
    });
    window.addEventListener("storage", event => {
        if (event.key === KEY || event.key === null) $(document).trigger("astra:favoritesChange");
    });
})(window, window.jQuery);
