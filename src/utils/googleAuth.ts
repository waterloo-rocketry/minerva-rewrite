import { JWT, OAuth2Client } from "google-auth-library";

// The service account reads the calendar as itself, so it needs no domain-wide delegation grant for this scope
const calendarReadScope = "https://www.googleapis.com/auth/calendar.events.readonly";

export interface GoogleAuthConfig {
  /** The service account's JSON key. Preferred over the OAuth refresh token when set. */
  serviceAccountKey?: string;
  /** The calendar to read. Required with a service account, which has no primary calendar of its own to fall back to. */
  calendarId?: string;
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
 * @throws Error if the service account key is malformed or has no calendar ID to read. The key is never included in the message.
 */
export function createGoogleAuth(config: GoogleAuthConfig): OAuth2Client {
  if (config.serviceAccountKey) {
    return createServiceAccountAuth(config.serviceAccountKey, config.calendarId);
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
 * Builds the credential for the service account acting as itself, which can read the calendars shared with it.
 * @param serviceAccountKey The service account's JSON key.
 * @param calendarId The calendar shared with the service account.
 * @returns The service account credential.
 */
function createServiceAccountAuth(serviceAccountKey: string, calendarId?: string): JWT {
  // Without this the "primary" fallback would silently read the service account's own empty calendar
  if (!calendarId) {
    throw new Error("MINERVA_GOOGLE_CALENDAR_ID is required when MINERVA_GOOGLE_SERVICE_ACCOUNT is set");
  }

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

  return new JWT({ email: key.client_email, key: key.private_key, scopes: [calendarReadScope] });
}
