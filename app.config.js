// Extends app.json. Used only to adapt the web build for hosting under a sub-path
// (GitHub Pages serves the app at https://<user>.github.io/<repo>/).
//   EXPO_BASE_URL   e.g. "/OrderIN" — URL prefix for all routes and assets
//   EXPO_WEB_OUTPUT "single" for static hosts without server-side routing
// Without these variables the configuration is exactly app.json.
module.exports = ({ config }) => {
  const baseUrl = process.env.EXPO_BASE_URL;
  const output = process.env.EXPO_WEB_OUTPUT;
  return {
    ...config,
    web: { ...config.web, ...(output ? { output } : {}) },
    experiments: { ...config.experiments, ...(baseUrl ? { baseUrl } : {}) },
  };
};
