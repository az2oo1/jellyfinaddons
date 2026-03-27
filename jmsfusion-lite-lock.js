(function () {
  "use strict";

  var studioImgCache = Object.create(null);

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

  function enforceLocalStorage() {
    var keys = Object.keys(enforced);
    for (var i = 0; i < keys.length; i++) {
      var k = keys[i];
      try {
        var v = enforced[k];
        localStorage.setItem(k, typeof v === "string" ? v : String(v));
      } catch (_) {}
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
      var nodes = document.querySelectorAll(
        "#slides-container,#recent-rows,#genre-hubs,#personal-recommendations,.personal-recs-section,.director-rows-wrapper,.recent-row-section"
      );
      for (var i = 0; i < nodes.length; i++) {
        var el = nodes[i];
        if (el.closest("#studio-hubs")) continue;
        if (el.closest("#itemDetailPage")) continue;
        el.remove();
      }
    } catch (_) {}
  }

  function getUserId() {
    try {
      return (
        window.ApiClient?._serverInfo?.UserId ||
        window.ApiClient?._currentUser?.Id ||
        localStorage.getItem("userId") ||
        ""
      );
    } catch (_) {
      return "";
    }
  }

  function parseStudioIdFromHref(href) {
    try {
      if (!href) return "";
      var m = String(href).match(/[?&]studioId=([^&]+)/i);
      return m ? decodeURIComponent(m[1]) : "";
    } catch (_) {
      return "";
    }
  }

  function authHeaders() {
    try {
      if (window.ApiClient && typeof window.ApiClient.getAuthenticationHeader === "function") {
        return { "X-Emby-Authorization": window.ApiClient.getAuthenticationHeader("MediaBrowser Client=JMSFusion") };
      }
    } catch (_) {}
    return {};
  }

  async function fetchStudioImage(studioId) {
    if (!studioId) return "";
    if (studioImgCache[studioId]) return studioImgCache[studioId];

    var userId = getUserId();
    if (!userId) return "";

    var url = "/Users/" + encodeURIComponent(userId) + "/Items?IncludeItemTypes=Movie,Series&Recursive=true&Limit=20&SortBy=Random&SortOrder=Descending&Fields=ImageTags,PrimaryImageTag,BackdropImageTags&StudioIds=" + encodeURIComponent(studioId);

    try {
      var res = await fetch(url, {
        method: "GET",
        credentials: "same-origin",
        headers: authHeaders()
      });
      if (!res.ok) return "";
      var data = await res.json();
      var items = Array.isArray(data && data.Items) ? data.Items : [];
      if (!items.length) return "";

      var item = items[0];
      var bdTag = item && item.BackdropImageTags && item.BackdropImageTags[0];
      if (bdTag) {
        var bdUrl = "/Items/" + encodeURIComponent(item.Id) + "/Images/Backdrop/0?tag=" + encodeURIComponent(bdTag) + "&quality=90";
        studioImgCache[studioId] = bdUrl;
        return bdUrl;
      }

      var pTag = (item && item.ImageTags && item.ImageTags.Primary) || (item && item.PrimaryImageTag);
      if (pTag) {
        var pUrl = "/Items/" + encodeURIComponent(item.Id) + "/Images/Primary?tag=" + encodeURIComponent(pTag) + "&fillHeight=320&quality=90";
        studioImgCache[studioId] = pUrl;
        return pUrl;
      }
    } catch (_) {}

    return "";
  }

  async function replaceBundledStudioPosters() {
    try {
      var cards = document.querySelectorAll("#studio-hubs a.hub-card");
      for (var i = 0; i < cards.length; i++) {
        var card = cards[i];
        if (!card) continue;
        var img = card.querySelector("img.hub-img");
        if (!img) continue;

        var src = String(img.getAttribute("src") || img.src || "");
        var isBundled = src.indexOf("/slider/src/images/studios/") !== -1;
        if (!isBundled) continue;

        var studioId = parseStudioIdFromHref(card.getAttribute("href") || "");
        if (!studioId) continue;

        var realImg = await fetchStudioImage(studioId);
        if (!realImg) continue;

        img.classList.remove("hub-logo");
        if (img.src !== realImg) img.src = realImg;
      }
    } catch (_) {}
  }

  function runEnforcement() {
    enforceLocalStorage();
    enforceRuntimeConfig();
    removeDuplicateSections();
    replaceBundledStudioPosters();
  }

  runEnforcement();

  var mo = new MutationObserver(function () {
    removeDuplicateSections();
    enforceRuntimeConfig();
    replaceBundledStudioPosters();
  });

  try {
    mo.observe(document.documentElement || document.body, {
      childList: true,
      subtree: true
    });
  } catch (_) {}

  setInterval(runEnforcement, 1200);

})();
