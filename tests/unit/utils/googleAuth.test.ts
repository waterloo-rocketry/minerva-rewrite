import { JWT, OAuth2Client } from "google-auth-library";
import { createGoogleAuth, createMeetAuth } from "../../../src/utils/googleAuth";

const oauth = {
  clientId: "client-id",
  clientSecret: "client-secret",
  redirectUri: "https://redirect",
  refreshToken: "refresh",
};
const calendarId = "team@example.com";
const serviceAccountKey = JSON.stringify({
  client_email: "minerva@project.iam.gserviceaccount.com",
  private_key: "-----BEGIN PRIVATE KEY-----\nfake\n-----END PRIVATE KEY-----\n",
});

describe("utils/googleAuth", () => {
  describe("createGoogleAuth", () => {
    it("uses the service account as itself, without impersonating a user, when its key is set", () => {
      const auth = createGoogleAuth({ serviceAccountKey, calendarId, oauth });

      expect(auth).toBeInstanceOf(JWT);
      expect((auth as JWT).email).toBe("minerva@project.iam.gserviceaccount.com");
      expect((auth as JWT).subject).toBeUndefined();
      expect((auth as JWT).scopes).toEqual(["https://www.googleapis.com/auth/calendar.events"]);
    });

    it("falls back to the OAuth refresh token when no service account key is set", () => {
      const auth = createGoogleAuth({ oauth });

      expect(auth).toBeInstanceOf(OAuth2Client);
      expect(auth).not.toBeInstanceOf(JWT);
      expect(auth.credentials.refresh_token).toBe("refresh");
    });

    it("falls back to the OAuth refresh token when the service account key is empty", () => {
      const auth = createGoogleAuth({ serviceAccountKey: "", calendarId, oauth });

      expect(auth.credentials.refresh_token).toBe("refresh");
    });

    it("keeps the OAuth fallback when a calendar ID is set without a service account", () => {
      const auth = createGoogleAuth({ calendarId, oauth });

      expect(auth.credentials.refresh_token).toBe("refresh");
    });

    it.each([undefined, ""])("rejects a service account key with calendar ID %p", (missingCalendarId) => {
      expect(() => createGoogleAuth({ serviceAccountKey, calendarId: missingCalendarId, oauth })).toThrow(
        "MINERVA_GOOGLE_CALENDAR_ID is required",
      );
    });

    it("rejects a key that is not JSON without echoing it", () => {
      const config = { serviceAccountKey: "secret-not-json", calendarId, oauth };

      expect(() => createGoogleAuth(config)).toThrow("not valid JSON");
      expect(() => createGoogleAuth(config)).not.toThrow(/secret-not-json/);
    });

    it("rejects a key missing its private key", () => {
      const key = JSON.stringify({ client_email: "minerva@project.iam.gserviceaccount.com" });

      expect(() => createGoogleAuth({ serviceAccountKey: key, calendarId, oauth })).toThrow(
        "client_email and private_key",
      );
    });
  });

  describe("createMeetAuth", () => {
    it("acts as the impersonated user to create meetings", () => {
      const auth = createMeetAuth({ serviceAccountKey, impersonatedUser: "admin@example.com" });

      expect(auth).toBeInstanceOf(JWT);
      expect(auth?.email).toBe("minerva@project.iam.gserviceaccount.com");
      expect(auth?.subject).toBe("admin@example.com");
      expect(auth?.scopes).toEqual(["https://www.googleapis.com/auth/meetings.space.created"]);
    });

    it.each([undefined, ""])("is unavailable when neither value is set (%p)", (unset) => {
      expect(createMeetAuth({ serviceAccountKey: unset, impersonatedUser: unset })).toBeUndefined();
    });

    it.each([undefined, ""])("rejects a service account key with impersonated user %p", (impersonatedUser) => {
      expect(() => createMeetAuth({ serviceAccountKey, impersonatedUser })).toThrow(
        "MINERVA_GOOGLE_IMPERSONATED_USER is required",
      );
    });

    it.each([undefined, ""])("rejects an impersonated user with service account key %p", (key) => {
      expect(() => createMeetAuth({ serviceAccountKey: key, impersonatedUser: "admin@example.com" })).toThrow(
        "MINERVA_GOOGLE_SERVICE_ACCOUNT is required",
      );
    });

    it("rejects a key that is not JSON without echoing it", () => {
      const config = { serviceAccountKey: "secret-not-json", impersonatedUser: "admin@example.com" };

      expect(() => createMeetAuth(config)).toThrow("not valid JSON");
      expect(() => createMeetAuth(config)).not.toThrow(/secret-not-json/);
    });
  });
});
