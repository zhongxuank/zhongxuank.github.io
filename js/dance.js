// Click to load: nothing from YouTube is requested until a visitor presses play.
// If a video cannot be played inside a page (the owner turned embedding off, or it is blocked where you are),
// the card falls back to a plain link that opens YouTube.
(() => {
  const frames = document.querySelectorAll("a.frame[data-yt]");
  if (!frames.length) return;
  let playing = null;
  let apiPromise = null;
  const loadApi = () => {
    if (apiPromise) return apiPromise;
    apiPromise = new Promise((resolve, reject) => {
      if (window.YT && window.YT.Player) return resolve();
      const prev = window.onYouTubeIframeAPIReady;
      window.onYouTubeIframeAPIReady = () => { if (prev) prev(); resolve(); };
      const s = document.createElement("script");
      s.src = "https://www.youtube.com/iframe_api";
      s.onerror = () => { apiPromise = null; reject(new Error("api")); };
      document.head.appendChild(s);
    });
    return apiPromise;
  };
  const restore = () => {
    if (!playing) return;
    try { playing.player && playing.player.destroy(); } catch (e) {}
    playing.slot.replaceWith(playing.frame);
    playing = null;
  };
  const fail = (frame, slot) => {
    const a = frame.cloneNode(false);
    a.className = "frame fail";
    a.removeAttribute("data-yt");
    a.setAttribute("aria-label", "This video cannot play on this page. Watch " + frame.dataset.title + " on YouTube.");
    a.innerHTML = '<span class="msg">This video can’t play on this page.</span><span class="open">Watch on YouTube <span aria-hidden="true">↗</span></span>';
    slot.replaceWith(a);
    if (playing && playing.slot === slot) playing = null;
    a.focus();
  };
  frames.forEach((frame) => {
    frame.addEventListener("click", (e) => {
      if (e.metaKey || e.ctrlKey || e.shiftKey || e.button === 1) return; // let the link open normally
      e.preventDefault();
      restore();
      const slot = document.createElement("div");
      slot.className = "frame player";
      const target = document.createElement("div");
      slot.appendChild(target);
      frame.replaceWith(slot);
      playing = { frame, slot, player: null };
      loadApi().then(() => {
        playing && playing.slot === slot && (playing.player = new YT.Player(target, {
          videoId: frame.dataset.yt,
          host: "https://www.youtube-nocookie.com",
          width: "100%", height: "100%",
          playerVars: { autoplay: 1, rel: 0, modestbranding: 1, playsinline: 1 },
          events: {
            onReady: (ev) => { const f = slot.querySelector("iframe"); if (f) { f.title = "YouTube video player: " + frame.dataset.title; f.focus(); } },
            onError: () => fail(frame, slot)
          }
        }));
      }).catch(() => fail(frame, slot));
    });
  });
})();
