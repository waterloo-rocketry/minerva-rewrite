import { parseEscapedSlashCommandChannel, extractChannelIdFromMessageLink } from "../../../src/utils/channels";

describe("parseEscapedSlashCommandChannel", () => {
  it("parses the escaped channel text from a Slack command and returns the Slack channel", () => {
    const text = "<#C12345678|channel-name>";
    const expected = {
      name: "channel-name",
      id: "C12345678",
    };

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
