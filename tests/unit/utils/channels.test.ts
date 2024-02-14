import { parseEscapedSlashCommandChannel } from "../../../src/utils/channels";

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
