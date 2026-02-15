// rambam-load-verse.js
// Generic function for dynamically loading verse content (scripts + CSS) into a container.
// Only this loading logic lives here; verse-specific logic is in separate modules.

(function (global) {
  const loadedScripts = {};
  const loadedStyles = {};

  /**
   * Dynamically load a script file. Returns a promise that resolves when loaded.
   */
  function loadScript(src) {
    if (loadedScripts[src]) return loadedScripts[src];
    const p = new Promise(function (resolve, reject) {
      const script = document.createElement("script");
      script.src = src;
      script.onload = function () {
        resolve();
      };
      script.onerror = function () {
        reject(new Error("Failed to load script: " + src));
      };
      document.head.appendChild(script);
    });
    loadedScripts[src] = p;
    return p;
  }

  /**
   * Dynamically load a CSS file. Returns a promise that resolves when loaded.
   */
  function loadStyle(href) {
    if (loadedStyles[href]) return loadedStyles[href];
    const p = new Promise(function (resolve, reject) {
      const link = document.createElement("link");
      link.rel = "stylesheet";
      link.href = href;
      link.onload = function () {
        resolve();
      };
      link.onerror = function () {
        reject(new Error("Failed to load stylesheet: " + href));
      };
      document.head.appendChild(link);
    });
    loadedStyles[href] = p;
    return p;
  }

  /**
   * Load verse content into a container. Dynamically loads the script and CSS
   * for the verse (if configured), then calls the verse module's render function.
   *
   * @param {string} verseId - e.g. "15:6"
   * @param {string|HTMLElement} container - Container element or its id
   * @param {Object} config - Optional: { scriptUrl, styleUrl } - paths to load. If omitted, uses convention: js/rambam-{id}.js, styles/rambam-{id}.css
   * @returns {Promise<void>}
   */
  function loadVerseContent(verseId, container, config) {
    const c = typeof container === "string" ? document.getElementById(container) : container;
    if (!c) return Promise.reject(new Error("Container not found"));

    const id = verseId.replace(":", "-");
    const scriptUrl = (config && config.scriptUrl) || "js/rambam-" + id + ".js";
    const styleUrl = (config && config.styleUrl) || "styles/rambam-" + id + ".css";

    const loadPromises = [loadScript(scriptUrl)];
    if (styleUrl) loadPromises.push(loadStyle(styleUrl));

    return Promise.all(loadPromises).then(function () {
      const moduleName = "RambamVerse" + id.replace(/-/g, "_");
      const module = global[moduleName];
      if (module && typeof module.render === "function") {
        module.render(c);
      }
    });
  }

  /**
   * Registry of verses that are loaded dynamically. Each entry: { label, containerId }
   * Add new lazy verses here; they will appear in the dropdown and load on demand.
   */
  const REGISTRY = {
    "15:6": {
      label: "15:6 – מנת המסלול (ירח)",
      containerId: "rambam-lazy-verse-container",
    },
  };

  global.RambamLoadVerse = {
    loadVerseContent: loadVerseContent,
    REGISTRY: REGISTRY,
  };
})(typeof window !== "undefined" ? window : globalThis);
