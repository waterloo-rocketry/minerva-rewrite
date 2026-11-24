import { JWT, OAuth2Client } from "google-auth-library";
import { createGoogleAuth, GoogleAuthConfig } from "../../../src/utils/googleAuth";

const oauth = {
  clientId: "client-id",
  clientSecret: "client-secret",
  redirectUri: "https://redirect",
  refreshToken: "refresh",
};
const serviceAccountKey = JSON.stringify({
  client_email: "minerva@project.iam.gserviceaccount.com",
  private_key: "-----BEGIN PRIVATE KEY-----\nfake\n-----END PRIVATE KEY-----\n",
});

describe("utils/googleAuth", () => {
  describe("createGoogleAuth", () => {
    it("uses the service account, impersonating the configured user, when its key is set", () => {
      const auth = createGoogleAuth({ serviceAccountKey, impersonatedUser: "admin@example.com", oauth });

      expect(auth).toBeInstanceOf(JWT);
      expect((auth as JWT).email).toBe("minerva@project.iam.gserviceaccount.com");
      expect((auth as JWT).subject).toBe("admin@example.com");
    });

    it("falls back to the OAuth refresh token when no service account key is set", () => {
      const auth = createGoogleAuth({ oauth });

      expect(auth).toBeInstanceOf(OAuth2Client);
      expect(auth).not.toBeInstanceOf(JWT);
      expect(auth.credentials.refresh_token).toBe("refresh");
    });

    it("falls back to the OAuth refresh token when both service account values are empty", () => {
      const auth = createGoogleAuth({ serviceAccountKey: "", impersonatedUser: "", oauth });

      expect(auth.credentials.refresh_token).toBe("refresh");
    });

    it.each([undefined, ""])("rejects a service account key with impersonated user %p", (impersonatedUser) => {
      expect(() => createGoogleAuth({ serviceAccountKey, impersonatedUser, oauth })).toThrow(
        "MINERVA_GOOGLE_IMPERSONATED_USER is required",
      );
    });

    it.each([undefined, ""])("rejects an impersonated user with service account key %p", (key) => {
      expect(() => createGoogleAuth({ serviceAccountKey: key, impersonatedUser: "admin@example.com", oauth })).toThrow(
        "MINERVA_GOOGLE_SERVICE_ACCOUNT is required",
      );
    });

    it("rejects a key that is not JSON without echoing it", () => {
      const config: GoogleAuthConfig = {
        serviceAccountKey: "secret-not-json",
        impersonatedUser: "admin@example.com",
        oauth,
      };

      expect(() => createGoogleAuth(config)).toThrow("not valid JSON");
      expect(() => createGoogleAuth(config)).not.toThrow(/secret-not-json/);
    });

    it("rejects a key missing its private key", () => {
      const key = JSON.stringify({ client_email: "minerva@project.iam.gserviceaccount.com" });

      expect(() => createGoogleAuth({ serviceAccountKey: key, impersonatedUser: "admin@example.com", oauth })).toThrow(
        "client_email and private_key",
      );
    });
  });
});
