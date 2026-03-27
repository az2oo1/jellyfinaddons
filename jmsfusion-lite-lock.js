(function () {
  "use strict";

  var enforced = {
    enableSlider: false,
    enableNotifications: false,
    enableDirectorRows: false,
    enableRecentRows: false,
    enablePersonalRecommendations: false,
    enableGenreHubs: false,
    enableContinueMovies: false,
    enableContinueSeries: false,
    enableRecentMoviesRow: false,
    enableRecentSeriesRow: false,
    enableRecentMusicRow: false,
    enableRecentMusicTracksRow: false,
    enableRecentEpisodesRow: false,
    enableBecauseYouWatched: false,
    enabledGmmp: false,
    enableSubtitleCustomizer: false,

    enableStudioHubs: true,
    enableProfileChooser: true,
    createAvatar: true,
    previewModal: true,
    allPreviewModal: true,
    globalPreviewMode: "modal",
    preferTrailersInPreviewModal: true,
    onlyTrailerInPreviewModal: false,
    disableAllPlayback: false,
    enableTrailerThenVideo: true
  };

  function setLs(k, v) {
    try {
      localStorage.setItem(k, typeof v === "string" ? v : String(v));
    } catch (_) {}
  }

  function enforceLocalStorage() {
    var keys = Object.keys(enforced);
    for (var i = 0; i < keys.length; i++) {
      var k = keys[i];
      setLs(k, enforced[k]);
    }

    try {
      var po = JSON.parse(localStorage.getItem("pauseOverlay") || "{}");
      po.showAgeBadge = true;
      localStorage.setItem("pauseOverlay", JSON.stringify(po));
    } catch (_) {}
  }

  function enforceRuntimeConfig() {
    try {
      var cfg = window.__JMS_GLOBAL_CONFIG__;
      if (!cfg || typeof cfg !== "object") return;

      var keys = Object.keys(enforced);
      for (var i = 0; i < keys.length; i++) {
        var k = keys[i];
        cfg[k] = enforced[k];
      }

      cfg.pauseOverlay = cfg.pauseOverlay || {};
      cfg.pauseOverlay.showAgeBadge = true;
    } catch (_) {}
  }

  function removeDuplicateSections() {
    try {
      var selectors = [
        "#slides-container",
        "#recent-rows",
        "#genre-hubs",
        "#personal-recommendations",
        ".personal-recs-section",
        ".director-rows-wrapper",
        ".recent-row-section"
      ];

      var nodes = document.querySelectorAll(selectors.join(","));
      for (var i = 0; i < nodes.length; i++) {
        var el = nodes[i];
        if (!el) continue;
        if (el.id === "studio-hubs") continue;
        if (el.closest("#studio-hubs")) continue;
        if (el.closest("#itemDetailPage")) continue;
        el.remove();
      }
    } catch (_) {}
  }

  function runEnforcement() {
    enforceLocalStorage();
    enforceRuntimeConfig();
    removeDuplicateSections();
  }

  runEnforcement();

  var mo = new MutationObserver(function () {
    removeDuplicateSections();
    enforceRuntimeConfig();
  });

  try {
    mo.observe(document.documentElement || document.body, {
      childList: true,
      subtree: true
    });
  } catch (_) {}

  setInterval(runEnforcement, 1200);

  window.__JMS_LITE_LOCK_ACTIVE__ = true;
})();
