import { createMeetingSpace, MeetRequester } from "../../../src/utils/googleMeet";

/**
 * A stand-in for the Meet API that records the request it receives.
 * @param responseData What the fake API responds with.
 * @returns The credential to pass in, and the requests it received.
 */
function fakeMeetApi(responseData: object): { auth: MeetRequester; requests: unknown[] } {
  const requests: unknown[] = [];
  const auth = {
    request: async (options: unknown): Promise<{ data: object }> => {
      requests.push(options);
      return { data: responseData };
    },
  } as unknown as MeetRequester;
  return { auth, requests };
}

describe("utils/googleMeet", () => {
  describe("createMeetingSpace", () => {
    it("asks Meet for a space that anyone with the link can join and returns its link", async () => {
      const { auth, requests } = fakeMeetApi({
        name: "spaces/abc",
        meetingUri: "https://meet.google.com/abc-mnop-xyz",
      });

      const link = await createMeetingSpace(auth);

      expect(link).toBe("https://meet.google.com/abc-mnop-xyz");
      expect(requests).toEqual([
        { url: "https://meet.googleapis.com/v2/spaces", method: "POST", data: { config: { accessType: "OPEN" } } },
      ]);
    });

    it("rejects when Meet returns no link", async () => {
      const { auth } = fakeMeetApi({ name: "spaces/abc" });

      await expect(createMeetingSpace(auth)).rejects.toThrow("did not return a meeting link");
    });
  });
});
