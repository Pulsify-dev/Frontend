/**
 * Social Authentication Helper
 * Loads provider SDKs and returns provider tokens for the backend.
 *
 * Required env variables:
 *   VITE_GOOGLE_CLIENT_ID
 *   VITE_FACEBOOK_APP_ID
 *   VITE_APPLE_CLIENT_ID
 */

const GOOGLE_CLIENT_ID = import.meta.env.VITE_GOOGLE_CLIENT_ID || "";
const FACEBOOK_APP_ID = import.meta.env.VITE_FACEBOOK_APP_ID || "";
const APPLE_CLIENT_ID = import.meta.env.VITE_APPLE_CLIENT_ID || "";

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
          return;
        }

        reject(new Error("Google login failed - no credential received."));
      },
    });

    window.google.accounts.id.prompt((notification) => {
      if (notification.isNotDisplayed() || notification.isSkippedMoment()) {
        const div = document.createElement("div");
        div.id = "g-signin-temp";
        div.style.display = "none";
        document.body.appendChild(div);

        window.google.accounts.id.renderButton(div, {
          type: "icon",
          size: "large",
        });

        const button =
          div.querySelector('[role="button"]') || div.firstElementChild;
        if (button) button.click();

        window.setTimeout(() => div.remove(), 60000);
      }
    });
  });
}

async function getFacebookToken() {
  if (!FACEBOOK_APP_ID) {
    throw new Error("Facebook App ID is not configured.");
  }

  await loadScript("https://connect.facebook.net/en_US/sdk.js", "facebook-sdk");

  window.FB.init({
    appId: FACEBOOK_APP_ID,
    cookie: true,
    xfbml: false,
    version: "v20.0",
  });

  return new Promise((resolve, reject) => {
    window.FB.login(
      (response) => {
        const accessToken = response?.authResponse?.accessToken;
        if (accessToken) {
          resolve(accessToken);
          return;
        }

        reject(new Error("Facebook login was cancelled or failed."));
      },
      { scope: "public_profile,email" },
    );
  });
}

async function getAppleToken() {
  if (!APPLE_CLIENT_ID) {
    throw new Error("Apple Client ID is not configured.");
  }

  await loadScript(
    "https://appleid.cdn-apple.com/appleauth/static/jsapi/appleid/1/en_US/appleid.auth.js",
    "apple-id-sdk",
  );

  window.AppleID.auth.init({
    clientId: APPLE_CLIENT_ID,
    scope: "name email",
    redirectURI: window.location.origin,
    usePopup: true,
  });

  const response = await window.AppleID.auth.signIn();
  const token = response?.authorization?.id_token || response?.authorization?.code;

  if (!token) {
    throw new Error("Apple login failed - no token received.");
  }

  return token;
}

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

export function getAvailableProviders() {
  const providers = [];
  if (FACEBOOK_APP_ID) providers.push("facebook");
  if (GOOGLE_CLIENT_ID) providers.push("google");
  if (APPLE_CLIENT_ID) providers.push("apple");
  return providers;
}
