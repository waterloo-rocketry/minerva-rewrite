import { WebClient } from "@slack/web-api";
import SlackChannel from "../../../src/classes/SlackChannel";
import {
  parseEscapedSlashCommandChannel,
  extractChannelIdFromMessageLink,
  getAllSlackChannels,
} from "../../../src/utils/channels";

describe("parseEscapedSlashCommandChannel", () => {
  it("parses the escaped channel text from a Slack command and returns the Slack channel", () => {
    const text = "<#C12345678|channel-name>";
    const expected = new SlackChannel("channel-name", "C12345678");

    expect(parseEscapedSlashCommandChannel(text)).toEqual(expected);
  });

  it("Throws an error when the text is not in the correct format", () => {
    const text = "channel-name";
    expect(() => parseEscapedSlashCommandChannel(text)).toThrow(`could not parse escaped channel text: ${text}`);
  });
});

describe("extractChannelIdFromMessageLink", () => {
  it("extracts the channel ID from a message link", () => {
    const messageLink = "https://waterloorocketrydev.slack.com/archives/C12345678/p1234567890";
    const expected = "C12345678";

    expect(extractChannelIdFromMessageLink(messageLink)).toEqual(expected);
  });

  it("Throws an error when the message link is not in the correct format", () => {
    const messageLink = "https://waterloorocketrydev.slack.com/archives/C12345678";
    expect(() => extractChannelIdFromMessageLink(messageLink)).toThrow(`could not parse message link: ${messageLink}`);
  });

  it("Throws an error when the message link is not from the Slack workspace", () => {
    const messageLink = "https://notwaterloorocketrydev.slack.com/archives/C12345678/p1234567890";
    expect(() => extractChannelIdFromMessageLink(messageLink)).toThrow(
      `link ${messageLink} is not a valid message link from this Slack workspace`,
    );
  });
});

describe("getAllSlackChannels", () => {
  it("includes private channels Minerva is in, marked as private", async () => {
    const list = jest.fn().mockResolvedValue({
      channels: [
        { name: "general", id: "C014J93U4JZ", is_private: false },
        { name: "leads", id: "C0LEADS0001", is_private: true },
      ],
    });
    const client = { conversations: { list } } as unknown as WebClient;

    expect(await getAllSlackChannels(client)).toEqual([
      new SlackChannel("general", "C014J93U4JZ"),
      new SlackChannel("leads", "C0LEADS0001", true),
    ]);
    expect(list).toHaveBeenCalledWith(expect.objectContaining({ types: "public_channel,private_channel" }));
  });
});
