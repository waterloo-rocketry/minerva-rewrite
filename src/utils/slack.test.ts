import { WebClient, ChatPostMessageResponse } from "@slack/web-api";
import * as slack from "./slack";
import SlackChannel from "../classes/SlackChannel";

jest.mock("@slack/web-api");

describe("slack.ts", () => {
  let mockWebClient: jest.Mocked<WebClient>;

  beforeEach(() => {
    mockWebClient = new WebClient() as jest.Mocked<WebClient>;
    (mockWebClient.chat.postMessage as jest.MockedFunction<typeof mockWebClient.chat.postMessage>).mockRejectedValue(
      new Error("Unexpected call"),
    ); // Reset the mock setup
  });

  describe("postMessage", () => {
    it("posts a message successfully", async () => {
      const mockResponse: ChatPostMessageResponse = {
        ok: true,
        channel: "mockChannel",
        ts: "mockTimestamp",
      };

      (mockWebClient.chat.postMessage as jest.MockedFunction<typeof mockWebClient.chat.postMessage>).mockResolvedValue(
        mockResponse,
      );

      const channelId = "mockChannel";
      const text = "Hello, Slack!";

      try {
        const channel = new SlackChannel(channelId, "mockChannelId");

        if (!channel) {
          fail("Channel object is null.");
        }

        const result = await slack.postMessage(mockWebClient, channel, text);

        console.log(result);
        expect(mockWebClient.chat.postMessage).toHaveBeenCalledWith({
          channel: channelId,
          text: text,
        });
        expect(result).toEqual(mockResponse);
      } catch (error) {
        fail(error);
      }
    });

    it("throws an error if postMessage fails", async () => {
      const errorMessage = "Mocked error message";
      mockWebClient.chat.postMessage = jest.fn().mockRejectedValue(new Error(errorMessage));

      const channelId = "mockChannel";
      const text = "Hello, Slack!";

      try {
        const channel = new SlackChannel(channelId, "mockChannelId");

        if (!channel) {
          fail("Channel object is null.");
        }

        await slack.postMessage(mockWebClient, channel, text);
        fail("Expected the promise to reject, but it resolved.");
      } catch (error: any) {
        console.error(error.message);
        expect(error.message).toBe(`Failed to post message to channel ${channelId} with error ${errorMessage}`);
      }
    });
  });
});
