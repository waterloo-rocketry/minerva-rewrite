import {
  splitDescriptionAndYamlText,
  replaceATagsWithHref,
  parseDescriptionFromHtml,
  parseDescription,
} from "../../../src/utils/calendarDescription";

import { slackChannels, defaultSlackChannels } from "../../fixtures/slackChannels";

describe("utils/calendarDescription", () => {
  describe("splitDescriptionAndYamlText", () => {
    it("should split and return the description and yaml text", () => {
      const description = `This is a description
---
foo: bar`;
      const { descriptionText, yamlText } = splitDescriptionAndYamlText(description);
      expect(descriptionText).toEqual("This is a description");
      expect(yamlText).toEqual("foo: bar");
    });

    it("should return just the description text if there is no yaml text", () => {
      const description = `This is a description`;
      const { descriptionText, yamlText } = splitDescriptionAndYamlText(description);
      expect(descriptionText).toEqual("This is a description");
      expect(yamlText).toBeUndefined();
    });

    it("should return just yaml if there is no description text", () => {
      const description = `---
foo: bar`;
      const { descriptionText, yamlText } = splitDescriptionAndYamlText(description);
      expect(descriptionText).toEqual("");
      expect(yamlText).toEqual("foo: bar");
    });

    it("should return empty string if the description is empty", () => {
      const description = ``;
      const { descriptionText, yamlText } = splitDescriptionAndYamlText(description);
      expect(descriptionText).toEqual("");
      expect(yamlText).toBeUndefined();
    });

    it("should return empty string if there is a yaml separator and nothing else", () => {
      const description = `---`;
      const { descriptionText, yamlText } = splitDescriptionAndYamlText(description);
      expect(descriptionText).toEqual("");
      expect(yamlText).toEqual("");
    });

    it("should throw an error if there is multiple yaml separators", () => {
      const description = `---
foo: bar
---
foo: bar`;
      expect(() => splitDescriptionAndYamlText(description)).toThrow("Description contains multiple '---' lines");
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
      const description = `This is a description<br>---<br>channels: ${slackChannels[0].name}, ${slackChannels[1].name}, ${slackChannels[2].name}<br>meetingLink: <a href="https://example.com">https://example.com</a>`;
      const result = parseDescription(description, slackChannels);
      expect(result.description).toEqual("This is a description");
      expect(result.minervaEventMetadata).toEqual({
        mainChannel: slackChannels[0],
        additionalChannels: [slackChannels[1], slackChannels[2]],
        meetingLink: "https://example.com",
      });
    });
    it("should parse the description when metadata does not exist", () => {
      const description = `This is a description`;
      const result = parseDescription(description, slackChannels);
      expect(result.description).toEqual("This is a description");
      expect(result.minervaEventMetadata).toBeUndefined();
    });
    it("should parse the description when there is no meeting link in the metadata", () => {
      const description = `This is a description<br>---<br>channels: ${slackChannels[0].name}, ${slackChannels[1].name}, ${slackChannels[2].name}`;
      const result = parseDescription(description, slackChannels);
      expect(result.description).toEqual("This is a description");
      expect(result.minervaEventMetadata).toEqual({
        mainChannel: slackChannels[0],
        additionalChannels: [slackChannels[1], slackChannels[2]],
        meetingLink: undefined,
      });
    });
    it("should parse the description when there is only a single channel in the metadata", () => {
      const description = `This is a description<br>---<br>channels: ${slackChannels[0].name}<br>meetingLink: <a href="https://example.com">https://example.com</a>`;
      const result = parseDescription(description, slackChannels);
      expect(result.description).toEqual("This is a description");
      expect(result.minervaEventMetadata).toEqual({
        mainChannel: slackChannels[0],
        additionalChannels: [],
        meetingLink: "https://example.com",
      });
    });
    it("should parse the description when channels includes default with no overlap with others", () => {
      const description = `This is a description<br>---<br>channels: ${slackChannels[1].name}, default<br>meetingLink: <a href="https://example.com">https://example.com</a>`;
      const result = parseDescription(description, slackChannels);
      expect(result.description).toEqual("This is a description");
      expect(result.minervaEventMetadata).toEqual({
        mainChannel: slackChannels[1],
        additionalChannels: [...defaultSlackChannels],
        meetingLink: "https://example.com",
      });
    });
    it("should parse the description when channels includes default with overlap with others", () => {
      const description = `This is a description<br>---<br>channels: ${slackChannels[0].name}, default<br>meetingLink: <a href="https://example.com">https://example.com</a>`;
      const result = parseDescription(description, slackChannels);
      expect(result.description).toEqual("This is a description");
      expect(result.minervaEventMetadata).toEqual({
        mainChannel: slackChannels[0],
        additionalChannels: [...defaultSlackChannels.slice(1)],
        meetingLink: "https://example.com",
      });
    });
    it("should throw an error if no channels are specified", () => {
      const description = `This is a description<br>---<br>meetingLink: <a href="https://example.com">https://example.com</a>`;
      expect(() => parseDescription(description, slackChannels)).toThrow(
        "nothing specified for `channels` in metadata",
      );
    });
    it("should throw an error if the only channel specified is default", () => {
      const description = `This is a description<br>---<br>channels: default<br>meetingLink: <a href="https://example.com">https://example.com</a>`;
      expect(() => parseDescription(description, slackChannels)).toThrow("main channel cannot be `default`");
    });
    it("should throw an error if the first channel specified is default", () => {
      const description = `This is a description<br>---<br>channels: default, ${slackChannels[0].name}<br>meetingLink: <a href="https://example.com">https://example.com</a>`;
      expect(() => parseDescription(description, slackChannels)).toThrow("main channel cannot be `default`");
    });
  });
});
