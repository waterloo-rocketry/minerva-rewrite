import {
  splitDescription,
  replaceATagsWithHref,
  parseDescriptionFromHtml,
  parseDescription,
} from "../../../src/utils/calendarDescription";

import { slackChannels, defaultSlackChannels } from "../../fixtures/slackChannels";

describe("utils/calendarDescription", () => {
  describe("splitDescription", () => {
    it("should split the description containing channel, meeting link, and a single line description text", () => {
      const description = `#${slackChannels[0].name}\nhttps://example.com\nThis is a description`;
      const result = splitDescription(description);
      expect(result).toEqual({
        descriptionText: "This is a description",
        channelName: slackChannels[0].name,
        meetingLink: "https://example.com",
      });
    });
    it("should split the description containing channel, meeting link, and a single line description text, with the description text being separated from the metadata by an empty line", () => {
      const description = `#${slackChannels[0].name}\nhttps://example.com\n\nThis is a description`;
      const result = splitDescription(description);
      expect(result).toEqual({
        descriptionText: "This is a description",
        channelName: slackChannels[0].name,
        meetingLink: "https://example.com",
      });
    });
    it("should split the description containing just a single line description text", () => {
      const description = `This is a description`;
      const result = splitDescription(description);
      expect(result).toEqual({
        descriptionText: "This is a description",
      });
    });
    it("should split the description containing just a multi line description text", () => {
      const description = `This is a description\nWith multiple lines`;
      const result = splitDescription(description);
      expect(result).toEqual({
        descriptionText: "This is a description\nWith multiple lines",
      });
    });
    it("should split the description containing channel, meeting link, and a multi line description text", () => {
      const description = `#${slackChannels[0].name}\nhttps://example.com\nThis is a description\nWith multiple lines`;
      const result = splitDescription(description);
      expect(result).toEqual({
        descriptionText: "This is a description\nWith multiple lines",
        channelName: slackChannels[0].name,
        meetingLink: "https://example.com",
      });
    });
    it("should split the description containing just the channel and description text", () => {
      const description = `#${slackChannels[0].name}\nThis is a description`;
      const result = splitDescription(description);
      expect(result).toEqual({
        descriptionText: "This is a description",
        channelName: slackChannels[0].name,
      });
    });
    it("should split the description containing just channel and meeting link", () => {
      const description = `#${slackChannels[0].name}\nhttps://example.com`;
      const result = splitDescription(description);
      expect(result).toEqual({
        descriptionText: "",
        channelName: slackChannels[0].name,
        meetingLink: "https://example.com",
      });
    });
    it("should split the description containing just the channel", () => {
      const description = `#${slackChannels[0].name}`;
      const result = splitDescription(description);
      expect(result).toEqual({
        descriptionText: "",
        channelName: slackChannels[0].name,
      });
    });
    it("should handle an empty description properly", () => {
      const description = ``;
      const result = splitDescription(description);
      expect(result).toEqual({
        descriptionText: "",
      });
    });
    it("should handle description text that contains a line that starts with a `#` with the channel specified", () => {
      const description = `#${slackChannels[0].name}\nThis is a description\n#sotruebestie`;
      const result = splitDescription(description);
      expect(result).toEqual({
        descriptionText: "This is a description\n#sotruebestie",
        channelName: slackChannels[0].name,
      });
    });
    it("should parse the metadata values even if they are out of order", () => {
      const description = `https://example.com\n#${slackChannels[0].name}\nThis is a description`;
      const result = splitDescription(description);
      expect(result).toEqual({
        descriptionText: "This is a description",
        channelName: slackChannels[0].name,
        meetingLink: "https://example.com",
      });
    });
  });

  describe("replaceATagsWithHref", () => {
    it("should replace <a> tags with their href", () => {
      const html = `<a href="https://example.com">Example</a>`;
      const result = replaceATagsWithHref(html);
      expect(result).toEqual("https://example.com");
    });

    it("should ignore <a> tags that don't have an href", () => {
      const html = `<a>Example</a>`;
      const result = replaceATagsWithHref(html);
      expect(result).toEqual(html);
    });

    it("should work even if the <a> tag does not contain anything inside it", () => {
      const html = `<a href="https://example.com"></a>`;
      const result = replaceATagsWithHref(html);
      expect(result).toEqual("https://example.com");
    });
  });
  describe("parseDescriptionFromHtml", () => {
    it("should properly parse the HTML description", () => {
      const description = `This is a description<br>With a <a href="https://example.com">link</a><br>And another line<br>---<br>foo: bar`;
      const result = parseDescriptionFromHtml(description);
      expect(result).toEqual("This is a description\nWith a https://example.com\nAnd another line\n---\nfoo: bar");
    });
  });

  describe("parseDescription", () => {
    it("should parse the description when metadata exists", () => {
      const description = `#${slackChannels[0].name}<br><a href="https://example.com">https://example.com</a><br>This is a description<br>Yep it is.`;
      const result = parseDescription(description, slackChannels);
      expect(result).toEqual({
        description: "This is a description\nYep it is.",
        minervaEventMetadata: {
          channels: [slackChannels[0]],
          meetingLink: "https://example.com",
        },
      });
    });
    it("should parse the description when metadata does not exist", () => {
      const description = `This is a description<br>Yep it is.`;
      const result = parseDescription(description, slackChannels);
      expect(result).toEqual({
        description: "This is a description\nYep it is.",
      });
    });
    it("should parse the description when there is no meeting link in the metadata", () => {
      const description = `#${slackChannels[0].name}<br>This is a description<br>Yep it is.`;
      const result = parseDescription(description, slackChannels);
      expect(result).toEqual({
        description: "This is a description\nYep it is.",
        minervaEventMetadata: {
          channels: [slackChannels[0]],
        },
      });
    });

    it("should return the default channels when the channel specified is `default`", () => {
      const description = `#default<br>This is a description<br>Yep it is.`;
      const result = parseDescription(description, slackChannels);
      result.minervaEventMetadata?.channels.sort((a, b) => a.name.localeCompare(b.name));
      expect(result).toEqual({
        description: "This is a description\nYep it is.",
        minervaEventMetadata: {
          channels: defaultSlackChannels,
        },
      });
    });

    it("should throw an error if the the channel specified does not exist", () => {
      const description = `#foodstuffs<br>This is a description<br>Yep it is.`;
      expect(() => parseDescription(description, [])).toThrow("could not find channel with name foodstuffs");
    });

    it("should throw an error if no channel is specified", () => {
      const description = `<a href="https://example.com">https://example.com</a><br>This is a description<br>Yep it is.`;
      expect(() => parseDescription(description, slackChannels)).toThrow("channel name not specified");
    });
  });
});
