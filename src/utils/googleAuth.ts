import { JWT, OAuth2Client } from "google-auth-library";

// Must be a scope the service account's domain-wide delegation grant includes, or Google rejects the token request
const calendarScope = "https://www.googleapis.com/auth/calendar.events";

export interface GoogleAuthConfig {
  /** The service account's JSON key. Preferred over the OAuth refresh token when set. */
  serviceAccountKey?: string;
  /** The Workspace user the service account acts as through domain-wide delegation. */
  impersonatedUser?: string;
  oauth: {
    clientId?: string;
    clientSecret?: string;
    redirectUri?: string;
    refreshToken?: string;
  };
}

/**
 * Creates the credential used for Google Calendar: the service account when its key is configured, otherwise the
 * OAuth refresh token.
 * @param config The credentials available in the environment.
 * @returns The credential to pass to the Google APIs.
 * @throws Error if only one of the service account key and impersonated user is set, or the key is malformed. The key is never included in the message.
 */
export function createGoogleAuth(config: GoogleAuthConfig): OAuth2Client {
  const { serviceAccountKey, impersonatedUser } = config;

  // Setting only half of the pair is a misconfiguration; falling back would hide it behind the old credential
  if (serviceAccountKey && !impersonatedUser) {
    throw new Error("MINERVA_GOOGLE_IMPERSONATED_USER is required when MINERVA_GOOGLE_SERVICE_ACCOUNT is set");
  }
  if (impersonatedUser && !serviceAccountKey) {
    throw new Error("MINERVA_GOOGLE_SERVICE_ACCOUNT is required when MINERVA_GOOGLE_IMPERSONATED_USER is set");
  }
  if (serviceAccountKey && impersonatedUser) {
    return createServiceAccountAuth(serviceAccountKey, impersonatedUser);
  }

  const auth = new OAuth2Client({
    clientId: config.oauth.clientId,
    clientSecret: config.oauth.clientSecret,
    redirectUri: config.oauth.redirectUri,
  });
  auth.setCredentials({ refresh_token: config.oauth.refreshToken });
  return auth;
}

/**
 * Builds the service account credential that acts as the impersonated user through domain-wide delegation.
 * @param serviceAccountKey The service account's JSON key.
 * @param impersonatedUser The Workspace user to act as.
 * @returns The service account credential.
 */
function createServiceAccountAuth(serviceAccountKey: string, impersonatedUser: string): JWT {
  let key: { client_email?: string; private_key?: string };
  try {
    key = JSON.parse(serviceAccountKey);
  } catch {
    // The parser's own message can quote part of the input, which would leak the key into logs
    throw new Error("MINERVA_GOOGLE_SERVICE_ACCOUNT is not valid JSON");
  }
  if (!key.client_email || !key.private_key) {
    throw new Error("MINERVA_GOOGLE_SERVICE_ACCOUNT must contain client_email and private_key");
  }

  return new JWT({
    email: key.client_email,
    key: key.private_key,
    scopes: [calendarScope],
    subject: impersonatedUser,
  });
}
