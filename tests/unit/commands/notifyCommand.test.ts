import { parseNotifyCommand } from "../../../src/listeners/commands/notifyCommand";
import { NotifyParameters, NotifyType } from "../../../src/listeners/commands/notifyCommand";
import SlackChannel from "../../../src/classes/SlackChannel";

describe("parseNotifyCommand", () => {
  it("parses the /notify command", () => {
    const commandArgs = "https://waterloorocketrydev.slack.com/archives/C015FXXXXXX/p1707843500000000";
    const expected: NotifyParameters = {
      messageUrl: "https://waterloorocketrydev.slack.com/archives/C015FXXXXXX/p1707843500000000",
      notifyType: NotifyType.DM_SINGLE_CHANNEL_GUESTS,
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
      notifyType: NotifyType.DM_SINGLE_CHANNEL_GUESTS,
      channels: [],
    };

    expect(parseNotifyCommand(commandArgs)).toEqual(expected);
  });

  it("parses the /notify command with the copy flag", () => {
    const commandArgs = "https://waterloorocketrydev.slack.com/archives/C015FXXXXXX/p1707843500000000 copy";
    const expected: NotifyParameters = {
      messageUrl: "https://waterloorocketrydev.slack.com/archives/C015FXXXXXX/p1707843500000000",
      notifyType: NotifyType.CHANNEL,
      includeDefaultChannels: true,
      channels: [],
    };

    expect(parseNotifyCommand(commandArgs)).toEqual(expected);
  });

  it("parses the /notify command with the copy-ping flag", () => {
    const commandArgs = "https://waterloorocketrydev.slack.com/archives/C015FXXXXXX/p1707843500000000 copy-ping";
    const expected: NotifyParameters = {
      messageUrl: "https://waterloorocketrydev.slack.com/archives/C015FXXXXXX/p1707843500000000",
      notifyType: NotifyType.CHANNEL_PING,
      includeDefaultChannels: true,
      channels: [],
    };

    expect(parseNotifyCommand(commandArgs)).toEqual(expected);
  });

  it("parses the /notify command with the copy-ping flag and explicit channels", () => {
    const commandArgs =
      "https://waterloorocketrydev.slack.com/archives/C015FXXXXXX/p1707843500000000 copy-ping <#C12345678|channel-name> <#C12345679|channel-name2>";
    const expected: NotifyParameters = {
      messageUrl: "https://waterloorocketrydev.slack.com/archives/C015FXXXXXX/p1707843500000000",
      notifyType: NotifyType.CHANNEL_PING,
      includeDefaultChannels: false,
      channels: [new SlackChannel("channel-name", "C12345678"), new SlackChannel("channel-name2", "C12345679")],
    };

    expect(parseNotifyCommand(commandArgs)).toEqual(expected);
  });

  it("parses the /notify command with the copy flag and explicit channels", () => {
    const commandArgs =
      "https://waterloorocketrydev.slack.com/archives/C015FXXXXXX/p1707843500000000 copy <#C12345678|channel-name> <#C12345679|channel-name2>";
    const expected: NotifyParameters = {
      messageUrl: "https://waterloorocketrydev.slack.com/archives/C015FXXXXXX/p1707843500000000",
      notifyType: NotifyType.CHANNEL,
      includeDefaultChannels: false,
      channels: [new SlackChannel("channel-name", "C12345678"), new SlackChannel("channel-name2", "C12345679")],
    };

    expect(parseNotifyCommand(commandArgs)).toEqual(expected);
  });

  it("parses the /notify command with the default channels and specific channels", () => {
    const commandArgs =
      "https://waterloorocketrydev.slack.com/archives/C015FXXXXXX/p1707843500000000 default <#C12345678|channel-name> <#C12345679|channel-name2>";
    const expected: NotifyParameters = {
      messageUrl: "https://waterloorocketrydev.slack.com/archives/C015FXXXXXX/p1707843500000000",
      notifyType: NotifyType.DM_SINGLE_CHANNEL_GUESTS,
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
      notifyType: NotifyType.DM_SINGLE_CHANNEL_GUESTS,
      includeDefaultChannels: true,
      channels: [new SlackChannel("channel-name", "C12345678"), new SlackChannel("channel-name2", "C12345679")],
    };
    expect(parseNotifyCommand(commandArgs)).toEqual(expected);
  });

  it("parses the /notify command with pinging the default channels and specific channels", () => {
    const commandArgs =
      "https://waterloorocketrydev.slack.com/archives/C015FXXXXXX/p1707843500000000 copy-ping default <#C12345678|channel-name> <#C12345679|channel-name2>";
    const expected: NotifyParameters = {
      messageUrl: "https://waterloorocketrydev.slack.com/archives/C015FXXXXXX/p1707843500000000",
      notifyType: NotifyType.CHANNEL_PING,
      includeDefaultChannels: true,
      channels: [new SlackChannel("channel-name", "C12345678"), new SlackChannel("channel-name2", "C12345679")],
    };
    expect(parseNotifyCommand(commandArgs)).toEqual(expected);
  });

  it("parses the /notify command with copy flag to the default channels and specific channels", () => {
    const commandArgs =
      "https://waterloorocketrydev.slack.com/archives/C015FXXXXXX/p1707843500000000 copy default <#C12345678|channel-name> <#C12345679|channel-name2>";
    const expected: NotifyParameters = {
      messageUrl: "https://waterloorocketrydev.slack.com/archives/C015FXXXXXX/p1707843500000000",
      notifyType: NotifyType.CHANNEL,
      includeDefaultChannels: true,
      channels: [new SlackChannel("channel-name", "C12345678"), new SlackChannel("channel-name2", "C12345679")],
    };
    expect(parseNotifyCommand(commandArgs)).toEqual(expected);
  });

  it("fails if both the copy and copy-ping flags are passed", () => {
    const commandArgs = "https://waterloorocketrydev.slack.com/archives/C015FXXXXXX/p1707843500000000 copy copy-ping";
    expect(() => parseNotifyCommand(commandArgs)).toThrow();
  });

  it("fails if both the copy and copy-ping flags are passed with explicit channels specified", () => {
    const commandArgs =
      "https://waterloorocketrydev.slack.com/archives/C015FXXXXXX/p1707843500000000 copy copy-ping <#C12345678|channel-name> <#C12345679|channel-name2>";
    expect(() => parseNotifyCommand(commandArgs)).toThrow();
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
