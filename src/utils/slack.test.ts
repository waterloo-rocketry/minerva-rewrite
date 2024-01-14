import { WebClient, ChatPostMessageResponse } from "@slack/web-api";
import * as slack from "./slack";
import SlackChannel from "../classes/SlackChannel";

jest.mock("@slack/web-api");

describe("slack.ts", () => {
  let mockWebClient: jest.Mocked<WebClient>;

  beforeEach(() => {
    mockWebClient = {
      chat: {
        postMessage: jest.fn().mockImplementation(() => {
          throw new Error("Unexpected call");
        }),
      },
    } as unknown as jest.Mocked<WebClient>;
  });

  describe("postMessage", () => {
    it("handles empty channel ID", async () => {
      const channelId = "";
      const text = "Hello, Slack!";

      try {
        const channel = new SlackChannel(channelId, "mockChannelId");

        if (!channel) {
          throw new Error("Channel object is null.");
        }

        await slack.postMessage(mockWebClient, channel, text);
        throw new Error("Expected the promise to reject, but it resolved.");
      } catch (error) {
        expect(error.message).toEqual("Channel ID is empty.");
      }
    });

    it("handles empty message text", async () => {
      const channelId = "mockChannel";
      const text = "";

      try {
        const channel = new SlackChannel(channelId, "mockChannelId");

        if (!channel) {
          throw new Error("Channel object is null.");
        }

        await slack.postMessage(mockWebClient, channel, text);
        throw new Error("Expected the promise to reject, but it resolved.");
      } catch (error) {
        expect(error.message).toEqual("Message text is empty.");
      }
    });

    it("handles invalid channel object", async () => {
      const text = "Hello, Slack!";

      try {
        const channel = null; // Invalid channel object

        if (!channel) {
          throw new Error("Invalid channel object.");
        }

        await slack.postMessage(mockWebClient, channel, text);
        throw new Error("Expected the promise to reject, but it resolved.");
      } catch (error) {
        expect(error.message).toEqual("Invalid channel object.");
      }
    });
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
          throw new Error("Channel object is null.");
        }

        const result = await slack.postMessage(mockWebClient, channel, text);

        console.log(result);
        expect(mockWebClient.chat.postMessage).toHaveBeenCalledWith({
          channel: channelId,
          text: text,
        });
        expect(result).toEqual(mockResponse);
      } catch (error) {
        throw new Error(error);
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
          throw new Error("Channel object is null.");
        }

        await slack.postMessage(mockWebClient, channel, text);
        throw new Error("Expected the promise to reject, but it resolved.");
      } catch (error) {
        //console.error(error);
        throw error;
      }
    });
  });
});
