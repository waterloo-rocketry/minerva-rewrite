import { JWT, OAuth2Client } from "google-auth-library";

// The service account reads the calendar as itself, so it needs no domain-wide delegation grant for this scope
const calendarReadScope = "https://www.googleapis.com/auth/calendar.events.readonly";

// Creating meetings needs a delegated user, so this must be in the service account's domain-wide delegation grant
const meetCreateScope = "https://www.googleapis.com/auth/meetings.space.created";

export interface MeetAuthConfig {
  /** The service account's JSON key. */
  serviceAccountKey?: string;
  /** The Workspace user the service account acts as through domain-wide delegation, and who owns the meetings. */
  impersonatedUser?: string;
}

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

  const { client_email, private_key } = parseServiceAccountKey(serviceAccountKey);
  return new JWT({ email: client_email, key: private_key, scopes: [calendarReadScope] });
}

/**
 * Creates the credential for creating Google Meet meetings. Meet only accepts user credentials, so the service
 * account acts as the impersonated user through domain-wide delegation.
 * @param config The service account key and the user to act as.
 * @returns The credential, or undefined if neither is configured, in which case Minerva can't create meetings.
 * @throws Error if only one of the two is set, or the key is malformed. The key is never included in the message.
 */
export function createMeetAuth(config: MeetAuthConfig): JWT | undefined {
  const { serviceAccountKey, impersonatedUser } = config;

  // Setting only half of the pair is a misconfiguration; staying silent would hide it
  if (serviceAccountKey && !impersonatedUser) {
    throw new Error("MINERVA_GOOGLE_IMPERSONATED_USER is required when MINERVA_GOOGLE_SERVICE_ACCOUNT is set");
  }
  if (impersonatedUser && !serviceAccountKey) {
    throw new Error("MINERVA_GOOGLE_SERVICE_ACCOUNT is required when MINERVA_GOOGLE_IMPERSONATED_USER is set");
  }
  if (!serviceAccountKey || !impersonatedUser) {
    return undefined;
  }

  const { client_email, private_key } = parseServiceAccountKey(serviceAccountKey);
  return new JWT({ email: client_email, key: private_key, scopes: [meetCreateScope], subject: impersonatedUser });
}

/**
 * Parses and checks the service account's JSON key.
 * @param serviceAccountKey The service account's JSON key.
 * @returns The key's email and private key.
 * @throws Error if the key is not JSON or is missing a field. The key is never included in the message.
 */
function parseServiceAccountKey(serviceAccountKey: string): { client_email: string; private_key: string } {
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
  return { client_email: key.client_email, private_key: key.private_key };
}
