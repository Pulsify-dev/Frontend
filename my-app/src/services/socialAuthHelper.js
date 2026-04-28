/**
 * Social Authentication Helper
 * Loads Google, Facebook, and Apple SDKs and handles token retrieval.
 *
 * Required env variables:
 *   VITE_GOOGLE_CLIENT_ID   – from Google Cloud Console
 *   VITE_FACEBOOK_APP_ID    – from Meta Developer Portal
 *   VITE_APPLE_CLIENT_ID    – from Apple Developer Portal (Services ID)
 */

const GOOGLE_CLIENT_ID = import.meta.env.VITE_GOOGLE_CLIENT_ID || "";
/* ─── Script Loader ─── */
function loadScript(src, id) {
  return new Promise((resolve, reject) => {
    if (document.getElementById(id)) {
      resolve();
      return;
    }
    const script = document.createElement("script");
    script.id = id;
    script.src = src;
    script.async = true;
    script.defer = true;
    script.onload = resolve;
    script.onerror = () => reject(new Error(`Failed to load ${src}`));
    document.head.appendChild(script);
  });
}

/* ─── Google ─── */
async function getGoogleToken() {
  if (!GOOGLE_CLIENT_ID) {
    throw new Error("Google Client ID is not configured.");
  }

  await loadScript("https://accounts.google.com/gsi/client", "google-gsi");

  return new Promise((resolve, reject) => {
    window.google.accounts.id.initialize({
      client_id: GOOGLE_CLIENT_ID,
      callback: (response) => {
        if (response.credential) {
          resolve(response.credential);
        } else {
          reject(new Error("Google login failed - no credential received"));
        }
      },
    });

    window.google.accounts.id.prompt((notification) => {
      if (notification.isNotDisplayed() || notification.isSkippedMoment()) {
        // One Tap not available, fall back to button-triggered popup
        const div = document.createElement("div");
        div.id = "g-signin-temp";
        div.style.display = "none";
        document.body.appendChild(div);

        window.google.accounts.id.renderButton(div, {
          type: "icon",
          size: "large",
        });

        const btn =
          div.querySelector('[role="button"]') || div.firstElementChild;
        if (btn) btn.click();

        // Clean up after a delay
        setTimeout(() => div.remove(), 60000);
      }
    });
  });
}
/* ─── Public API ─── */

/**
 * Get a provider token by launching the provider's login flow.
 * @param {'google' | 'facebook' | 'apple'} provider
 * @returns {Promise<string>} The provider token to send to the backend
 */
export async function getSocialToken(provider) {
  switch (provider) {
    case "google":
      return getGoogleToken();
    default:
      throw new Error(`Unknown provider: ${provider}`);
  }
}

/**
 * Check which providers are configured (have client IDs).
 */
export function getAvailableProviders() {
  const providers = [];
  if (GOOGLE_CLIENT_ID) providers.push("google");
  return providers;
}
