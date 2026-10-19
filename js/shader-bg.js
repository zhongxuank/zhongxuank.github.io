// Optional animated background. Needs WebGPU; otherwise the CSS gradient behind it is all you see.
(() => {
  const hosts = document.querySelectorAll("[data-shader]");
  if (!hosts.length || !navigator.gpu) return;
  const reduce = matchMedia("(prefers-reduced-motion: reduce)");
  if (reduce.matches || (navigator.connection && navigator.connection.saveData)) return;
  const dark = matchMedia("(prefers-color-scheme: dark)");
  const palettes = {
    light: { a: "#e2e9e0", b: "#b4c2b0", c: "#d8d3bd", d: "#9fb3b0" },
    dark: { a: "#1a2a2c", b: "#2b4044", c: "#2c4034", d: "#374b49" }
  };
  const deep = { a: "#233a3e", b: "#2b4044", c: "#2f4b47", d: "#3b5659" };
  const colours = (host) => (host.dataset.shader === "deep" ? deep : dark.matches ? palettes.dark : palettes.light);
  const start = async () => {
    let mod;
    try { mod = await import("/js/shader-bg.bundle.js"); } catch (e) { return; }
    hosts.forEach(async (host, i) => {
      const canvas = document.createElement("canvas");
      canvas.setAttribute("aria-hidden", "true");
      host.prepend(canvas);
      const p = colours(host);
      let inst;
      try {
        inst = await mod.createShader(canvas, {
          components: [{
            type: "FilmGrain", id: "grain", props: { strength: 0.28, bias: 1 },
            children: [{
              type: "FlowingGradient", id: "flow",
              props: { colorA: p.a, colorB: p.b, colorC: p.c, colorD: p.d, colorSpace: "oklab", speed: 0.3, distortion: 0.5, seed: 7 + i * 13 }
            }]
          }]
        }, { colorSpace: "srgb", disableTelemetry: true, onError: () => canvas.remove() });
      } catch (e) { canvas.remove(); return; }
      if (inst.getFailureReason && inst.getFailureReason()) { canvas.remove(); return; }
      host.classList.add("shader-on");
      new ResizeObserver(() => inst.resize()).observe(host);
      new IntersectionObserver(([en]) => (en.isIntersecting ? inst.resume() : inst.pause())).observe(host);
      dark.addEventListener("change", () => { const q = colours(host); inst.update("flow", { colorA: q.a, colorB: q.b, colorC: q.c, colorD: q.d }); });
      reduce.addEventListener("change", () => (reduce.matches ? inst.pause() : inst.resume()));
    });
  };
  ("requestIdleCallback" in window ? requestIdleCallback : (f) => setTimeout(f, 800))(start);
})();
