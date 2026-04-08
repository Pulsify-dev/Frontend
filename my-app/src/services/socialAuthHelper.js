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
const FACEBOOK_APP_ID = import.meta.env.VITE_FACEBOOK_APP_ID || "";
const APPLE_CLIENT_ID = import.meta.env.VITE_APPLE_CLIENT_ID || "";

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
    const client = window.google.accounts.oauth2.initTokenClient({
      client_id: GOOGLE_CLIENT_ID,
      scope: "email profile",
      callback: (response) => {
        if (response.error) {
          reject(
            new Error(response.error_description || "Google login failed"),
          );
        } else {
          resolve(response.access_token);
        }
      },
      error_callback: (err) => {
        reject(new Error(err?.message || "Google login was cancelled"));
      },
    });
    client.requestAccessToken();
  });
}

/* ─── Facebook ─── */
async function getFacebookToken() {
  if (!FACEBOOK_APP_ID) {
    throw new Error("Facebook App ID is not configured.");
  }

  await loadScript("https://connect.facebook.net/en_US/sdk.js", "facebook-sdk");

  // Initialize FB SDK if not already done
  if (!window.FB._initialized) {
    window.FB.init({
      appId: FACEBOOK_APP_ID,
      cookie: true,
      xfbml: false,
      version: "v19.0",
    });
    window.FB._initialized = true;
  }

  return new Promise((resolve, reject) => {
    window.FB.login(
      (response) => {
        if (
          response.status === "connected" &&
          response.authResponse?.accessToken
        ) {
          resolve(response.authResponse.accessToken);
        } else {
          reject(new Error("Facebook login was cancelled or failed."));
        }
      },
      { scope: "email,public_profile" },
    );
  });
}

/* ─── Apple ─── */
async function getAppleToken() {
  if (!APPLE_CLIENT_ID) {
    throw new Error("Apple Client ID is not configured.");
  }

  await loadScript(
    "https://appleid.cdn-apple.com/appleauth/static/jsapi/appleid/1/en_US/appleid.auth.js",
    "apple-signin",
  );

  window.AppleID.auth.init({
    clientId: APPLE_CLIENT_ID,
    scope: "name email",
    redirectURI: window.location.origin + "/login",
    usePopup: true,
  });

  try {
    const response = await window.AppleID.auth.signIn();
    const idToken = response?.authorization?.id_token;
    if (!idToken) {
      throw new Error("No token received from Apple.");
    }
    return idToken;
  } catch (err) {
    if (err?.error === "popup_closed_by_user") {
      throw new Error("Apple login was cancelled.");
    }
    throw new Error(err?.message || "Apple login failed.");
  }
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
    case "facebook":
      return getFacebookToken();
    case "apple":
      return getAppleToken();
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
  if (FACEBOOK_APP_ID) providers.push("facebook");
  if (APPLE_CLIENT_ID) providers.push("apple");
  return providers;
}
