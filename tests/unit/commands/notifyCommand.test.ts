import { parseNotifyCommand } from "../../../src/listeners/commands/notifyCommand";
import { NotifyParameters } from "../../../src/listeners/commands/notifyCommand";
import SlackChannel from "../../../src/classes/SlackChannel";

describe("parseNotifyCommand", () => {
  it("parses the /notify command", () => {
    const commandArgs = "https://waterloorocketrydev.slack.com/archives/C015FXXXXXX/p1707843500000000";
    const expected: NotifyParameters = {
      messageUrl: "https://waterloorocketrydev.slack.com/archives/C015FXXXXXX/p1707843500000000",
      pingChannels: false,
      includeDefaultChannels: true,
      channels: [],
    };

    expect(parseNotifyCommand(commandArgs)).toEqual(expected);
  });

  it("parses the /notify command when link is not plaintext", () => {
    const commandArgs = "<https://waterloorocketrydev.slack.com/archives/C015FXXXXXX/p1707843500000000>";
    const expected: NotifyParameters = {
      messageUrl: "https://waterloorocketrydev.slack.com/archives/C015FXXXXXX/p1707843500000000",
      includeDefaultChannels: true,
      pingChannels: false,
      channels: [],
    };

    expect(parseNotifyCommand(commandArgs)).toEqual(expected);
  });

  it("parses the /notify command with pinging channels", () => {
    const commandArgs =
      "https://waterloorocketrydev.slack.com/archives/C015FXXXXXX/p1707843500000000 ping <#C12345678|channel-name> <#C12345679|channel-name2>";
    const expected: NotifyParameters = {
      messageUrl: "https://waterloorocketrydev.slack.com/archives/C015FXXXXXX/p1707843500000000",
      pingChannels: true,
      includeDefaultChannels: false,
      channels: [new SlackChannel("channel-name", "C12345678"), new SlackChannel("channel-name2", "C12345679")],
    };

    expect(parseNotifyCommand(commandArgs)).toEqual(expected);
  });

  it("parses the /notify command with the default channels", () => {
    const commandArgs = "https://waterloorocketrydev.slack.com/archives/C015FXXXXXX/p1707843500000000";
    const expected: NotifyParameters = {
      messageUrl: "https://waterloorocketrydev.slack.com/archives/C015FXXXXXX/p1707843500000000",
      pingChannels: false,
      includeDefaultChannels: true,
      channels: [],
    };

    expect(parseNotifyCommand(commandArgs)).toEqual(expected);
  });

  it("parses the /notify command with pinging default channels", () => {
    const commandArgs = "https://waterloorocketrydev.slack.com/archives/C015FXXXXXX/p1707843500000000 ping";
    const expected: NotifyParameters = {
      messageUrl: "https://waterloorocketrydev.slack.com/archives/C015FXXXXXX/p1707843500000000",
      pingChannels: true,
      includeDefaultChannels: true,
      channels: [],
    };

    expect(parseNotifyCommand(commandArgs)).toEqual(expected);
  });

  it("parses the /notify command with the default channels and specific channels", () => {
    const commandArgs =
      "https://waterloorocketrydev.slack.com/archives/C015FXXXXXX/p1707843500000000 default <#C12345678|channel-name> <#C12345679|channel-name2>";
    const expected: NotifyParameters = {
      messageUrl: "https://waterloorocketrydev.slack.com/archives/C015FXXXXXX/p1707843500000000",
      pingChannels: false,
      includeDefaultChannels: true,
      channels: [new SlackChannel("channel-name", "C12345678"), new SlackChannel("channel-name2", "C12345679")],
    };
    expect(parseNotifyCommand(commandArgs)).toEqual(expected);
  });

  it("parses the /notify command with the default channels and specific channels (default not first)", () => {
    const commandArgs =
      "https://waterloorocketrydev.slack.com/archives/C015FXXXXXX/p1707843500000000 <#C12345678|channel-name> default <#C12345679|channel-name2>";
    const expected: NotifyParameters = {
      messageUrl: "https://waterloorocketrydev.slack.com/archives/C015FXXXXXX/p1707843500000000",
      pingChannels: false,
      includeDefaultChannels: true,
      channels: [new SlackChannel("channel-name", "C12345678"), new SlackChannel("channel-name2", "C12345679")],
    };
    expect(parseNotifyCommand(commandArgs)).toEqual(expected);
  });

  it("parses the /notify command with pinging the default channels and specific channels", () => {
    const commandArgs =
      "https://waterloorocketrydev.slack.com/archives/C015FXXXXXX/p1707843500000000 ping default <#C12345678|channel-name> <#C12345679|channel-name2>";
    const expected: NotifyParameters = {
      messageUrl: "https://waterloorocketrydev.slack.com/archives/C015FXXXXXX/p1707843500000000",
      pingChannels: true,
      includeDefaultChannels: true,
      channels: [new SlackChannel("channel-name", "C12345678"), new SlackChannel("channel-name2", "C12345679")],
    };
    expect(parseNotifyCommand(commandArgs)).toEqual(expected);
  });

  it("throws an error when the command is empty", () => {
    const commandArgs = "";
    expect(() => parseNotifyCommand(commandArgs)).toThrow(
      "Please provide a message to send. Usage: `/notify <messageURL>`",
    );
  });

  it("throws an error when the URL is invalid", () => {
    const commandArgs = "https://google.com";
    expect(() => parseNotifyCommand(commandArgs)).toThrow(
      "Please provide a valid message URL from this Slack workspace as the first argument.",
    );
  });

  it("throws an error when the channels are invalid", () => {
    const commandArgs = "https://waterloorocketrydev.slack.com/archives/C015FXXXXXX/p1707843500000000 #C12345678";
    expect(() => parseNotifyCommand(commandArgs)).toThrow();
  });
});
