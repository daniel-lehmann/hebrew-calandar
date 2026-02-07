// api.js
// Simple placeholder API layer. Right now everything is computed client-side,
// but this module isolates any future server calls.

(function (global) {
  function fetchHebrewCalendarConfig() {
    // In a deployed version this could fetch from a server.
    return Promise.resolve({
      epochHebrewYear: 5786,
    });
  }

  const Api = { fetchHebrewCalendarConfig };

  if (typeof module !== "undefined" && module.exports) {
    module.exports = Api;
  }

  global.Api = Api;
})(typeof window !== "undefined" ? window : globalThis);


