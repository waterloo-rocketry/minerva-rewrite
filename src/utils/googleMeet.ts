import { OAuth2Client } from "google-auth-library";

const meetSpacesUrl = "https://meet.googleapis.com/v2/spaces";

/**
 * The part of an authenticated Google client needed to call the Meet API.
 *
 * shortcut: the REST endpoint is called by hand because the installed `googleapis` (133) has no Meet client, and
 * upgrading to one needs Node 22+ while the deployments run Node 18. Switch to the typed client once the pm2 hosts
 * and workflows are on Node 22+.
 */
export type MeetRequester = Pick<OAuth2Client, "request">;

/**
 * Creates a Google Meet meeting space that anyone with the link can join without knocking.
 * @param auth The credential to create the meeting as.
 * @returns The link for joining the meeting.
 * @throws Error if the request fails or Google doesn't return a link.
 */
export async function createMeetingSpace(auth: MeetRequester): Promise<string> {
  const response = await auth.request<{ meetingUri?: string }>({
    url: meetSpacesUrl,
    method: "POST",
    data: { config: { accessType: "OPEN" } },
  });

  const meetingUri = response.data.meetingUri;
  if (!meetingUri) {
    throw new Error("Google Meet did not return a meeting link");
  }
  return meetingUri;
}
