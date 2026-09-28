import { ViewStateValue } from "@slack/bolt";
import {
  buildIssueRequestModal,
  extractMentionedUserIds,
  FROM_SLACK_LABEL,
  IssueRequest,
  ISSUE_REQUEST_VIEW_ID,
  issueRequestToGitHubIssue,
  parseIssueRequestSource,
  parseIssueRequestSubmission,
  REQUEST_TYPES,
  slackTextToMarkdown,
  URGENCIES,
} from "../../../src/utils/issueRequests";

const REPO = "waterloo-rocketry/2026-2027-software-issues";
const PERMALINK = "https://waterloorocketrydev.slack.com/archives/C015FXXXXXX/p1707843500000000";

/**
 * Builds modal state values in the shape Slack submits them
 * @param fields The field values to submit
 * @param fields.title The title input value
 * @param fields.description The description input value
 * @param fields.type The selected type option value
 * @param fields.urgency The selected urgency option value
 * @param fields.neededBy The selected date
 * @param fields.subteam The selected subteam option value
 * @returns The modal state values
 */
function submittedValues(fields: {
  title?: string;
  description?: string;
  type?: string;
  urgency?: string;
  neededBy?: string;
  subteam?: string;
}): Record<string, Record<string, ViewStateValue>> {
  const select = (value?: string): ViewStateValue => ({
    type: "static_select",
    selected_option: value ? { text: { type: "plain_text", text: value }, value } : null,
  });

  return {
    title: { title_input: { type: "plain_text_input", value: fields.title ?? null } },
    description: { description_input: { type: "plain_text_input", value: fields.description ?? null } },
    type: { type_select: select(fields.type) },
    urgency: { urgency_select: select(fields.urgency) },
    needed_by: { needed_by_date: { type: "datepicker", selected_date: fields.neededBy ?? null } },
    subteam: { subteam_select: select(fields.subteam) },
  };
}

const validFields = {
  title: "  Omnibus crashes on empty CAN log  ",
  description: "  Open omnibus with an empty log and it crashes.  ",
  type: "bug",
  urgency: "high",
  subteam: "Propulsion",
};

describe("buildIssueRequestModal", () => {
  it("builds a modal routed to the submission handler", () => {
    const modal = buildIssueRequestModal(REPO);

    expect(modal.type).toEqual("modal");
    expect(modal.callback_id).toEqual(ISSUE_REQUEST_VIEW_ID);
  });

  it("warns that the issue will be public and names the repo", () => {
    const modal = buildIssueRequestModal(REPO);

    expect(JSON.stringify(modal.blocks[0])).toContain("*public*");
    expect(JSON.stringify(modal.blocks[0])).toContain(REPO);
  });

  it("round-trips the request source through the private metadata", () => {
    const source = { channelId: "C123", messageTs: "1707843500.000000", permalink: PERMALINK };
    const modal = buildIssueRequestModal(REPO, source);

    expect(parseIssueRequestSource(modal.private_metadata as string)).toEqual(source);
  });

  it("prefills the description, truncated to Slack's limit", () => {
    const modal = buildIssueRequestModal(REPO, {}, "x".repeat(5000));
    const description = modal.blocks.find((b) => b.block_id == "description");

    expect(JSON.stringify(description)).toContain(`"initial_value":"${"x".repeat(3000)}"`);
  });

  it("stays within Slack's Block Kit limits, which Slack enforces by rejecting views.open", () => {
    // https://api.slack.com/reference/surfaces/views and https://api.slack.com/reference/block-kit/composition-objects
    const modal = buildIssueRequestModal(REPO, { channelId: "C123", messageTs: "1.2", permalink: PERMALINK }, "x");

    expect(modal.title.text.length).toBeLessThanOrEqual(24);
    expect(modal.submit?.text.length).toBeLessThanOrEqual(24);
    expect(modal.close?.text.length).toBeLessThanOrEqual(24);
    expect((modal.private_metadata as string).length).toBeLessThanOrEqual(3000);
    expect(modal.blocks.length).toBeLessThanOrEqual(100);

    for (const block of modal.blocks) {
      if (block.type != "input") continue;
      expect(block.label.text.length).toBeLessThanOrEqual(2000);
      const element = block.element as {
        placeholder?: { text: string };
        max_length?: number;
        options?: { text: { text: string }; value: string }[];
      };
      expect((element.placeholder?.text ?? "").length).toBeLessThanOrEqual(150);
      expect(element.max_length ?? 0).toBeLessThanOrEqual(3000);
      expect((element.options ?? []).length).toBeLessThanOrEqual(100);
      for (const opt of element.options ?? []) {
        expect(opt.text.text.length).toBeLessThanOrEqual(75);
        expect(opt.value.length).toBeLessThanOrEqual(150);
      }
    }
  });

  it("only mentions the linked message when there is one", () => {
    expect(JSON.stringify(buildIssueRequestModal(REPO))).not.toContain("this Slack message");
    expect(JSON.stringify(buildIssueRequestModal(REPO, { permalink: PERMALINK }))).toContain(PERMALINK);
  });
});

describe("parseIssueRequestSource", () => {
  it("returns an empty source for empty or malformed metadata", () => {
    expect(parseIssueRequestSource("")).toEqual({});
    expect(parseIssueRequestSource("{not json")).toEqual({});
  });
});

describe("parseIssueRequestSubmission", () => {
  it("parses a valid submission and trims text", () => {
    const { request, errors } = parseIssueRequestSubmission(submittedValues(validFields), "sshingala", {});

    expect(errors).toBeUndefined();
    expect(request).toEqual({
      title: "Omnibus crashes on empty CAN log",
      description: "Open omnibus with an empty log and it crashes.",
      type: REQUEST_TYPES[0],
      urgency: URGENCIES[0],
      neededBy: undefined,
      subteam: "Propulsion",
      requesterName: "sshingala",
      source: {},
    });
  });

  it("includes the needed-by date when one is picked", () => {
    const { request } = parseIssueRequestSubmission(
      submittedValues({ ...validFields, neededBy: "2026-10-05" }),
      "sshingala",
      {},
    );

    expect(request?.neededBy).toEqual("2026-10-05");
  });

  it("returns an error for every missing field", () => {
    const { request, errors } = parseIssueRequestSubmission(submittedValues({}), "sshingala", {});

    expect(request).toBeUndefined();
    expect(Object.keys(errors ?? {}).sort()).toEqual(["description", "subteam", "title", "type", "urgency"]);
  });

  it("rejects a whitespace-only title", () => {
    const { errors } = parseIssueRequestSubmission(submittedValues({ ...validFields, title: "   " }), "a", {});

    expect(errors).toEqual({ title: "Please enter a title." });
  });

  it("rejects option values that aren't in the lists", () => {
    const { errors } = parseIssueRequestSubmission(
      submittedValues({ ...validFields, type: "nonsense", subteam: "Marketing" }),
      "a",
      {},
    );

    expect(Object.keys(errors ?? {}).sort()).toEqual(["subteam", "type"]);
  });
});

describe("issueRequestToGitHubIssue", () => {
  const request: IssueRequest = {
    title: "Omnibus crashes on empty CAN log",
    description: "It crashes.",
    type: REQUEST_TYPES[1],
    urgency: URGENCIES[2],
    subteam: "Recovery",
    requesterName: "shrey|s",
    source: {},
  };

  it("labels the issue with its origin, type and urgency", () => {
    expect(issueRequestToGitHubIssue(request).labels).toEqual([FROM_SLACK_LABEL, "enhancement", "priority: low"]);
  });

  it("puts the description and request details in the body", () => {
    const { title, body } = issueRequestToGitHubIssue(request);

    expect(title).toEqual(request.title);
    expect(body).toContain("### Description\n\nIt crashes.");
    expect(body).toContain("| **Subteam** | Recovery |");
    expect(body).toContain("| **Needed by** | - |");
  });

  it("escapes pipes so the details table isn't broken", () => {
    expect(issueRequestToGitHubIssue(request).body).toContain("| **Requested by** | shrey\\|s |");
  });

  it("links back to the Slack message only when there is one", () => {
    expect(issueRequestToGitHubIssue(request).body).not.toContain("Original message");
    expect(issueRequestToGitHubIssue({ ...request, source: { permalink: PERMALINK } }).body).toContain(
      `[Original message](${PERMALINK})`,
    );
  });
});

describe("extractMentionedUserIds", () => {
  it("finds unique user mentions", () => {
    expect(extractMentionedUserIds("<@U111> and <@U222|bob> and <@U111> again")).toEqual(["U111", "U222"]);
  });

  it("returns nothing when no users are mentioned", () => {
    expect(extractMentionedUserIds("<#C123|general> <!here>")).toEqual([]);
  });
});

describe("slackTextToMarkdown", () => {
  it("converts user mentions to names in code spans so they don't ping GitHub users", () => {
    expect(slackTextToMarkdown("hey <@U111> and <@U222|bob> and <@U333>", { U111: "alice" })).toEqual(
      "hey `@alice` and `@bob` and `@U333`",
    );
  });

  it("converts channel and special mentions", () => {
    expect(slackTextToMarkdown("<#C123|software> <#C456> <!here> <!subteam^S1|@leads>")).toEqual(
      "#software #C456 `@here` `@leads`",
    );
  });

  it("converts links", () => {
    expect(slackTextToMarkdown("see <https://example.com|the docs> or <https://example.com/raw>")).toEqual(
      "see [the docs](https://example.com) or https://example.com/raw",
    );
  });

  it("unescapes the characters Slack escapes", () => {
    expect(slackTextToMarkdown("a &lt; b &amp;&amp; c &gt; d")).toEqual("a < b && c > d");
  });
});
