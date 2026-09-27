import { KnownBlock, View, ViewStateValue } from "@slack/bolt";
import { NewGitHubIssue } from "./github";

/**
 * The callback ID of the issue request modal, used to route its submissions
 */
export const ISSUE_REQUEST_VIEW_ID = "issue_request_submit";

/**
 * The label added to every issue filed from Slack, so they can be filtered on GitHub
 */
export const FROM_SLACK_LABEL = "from-slack";

// Slack limits multiline plain text inputs to 3000 characters
const MAX_DESCRIPTION_LENGTH = 3000;
const MAX_TITLE_LENGTH = 150;

type RequestOption = {
  value: string;
  label: string;
  githubLabel: string;
};

export const REQUEST_TYPES: RequestOption[] = [
  { value: "bug", label: "Bug - something is broken", githubLabel: "bug" },
  { value: "feature", label: "Feature / improvement", githubLabel: "enhancement" },
  { value: "question", label: "Question / need help", githubLabel: "question" },
];

export const URGENCIES: RequestOption[] = [
  { value: "high", label: "Blocking - needed ASAP", githubLabel: "priority: high" },
  { value: "medium", label: "Soon - within a couple of weeks", githubLabel: "priority: medium" },
  { value: "low", label: "Whenever", githubLabel: "priority: low" },
];

export const SUBTEAMS = [
  "Airframe",
  "Business",
  "Controls",
  "Electrical",
  "Flight Dynamics",
  "Infrastructure",
  "Payload",
  "Propulsion",
  "Recovery",
  "Software",
  "Other",
];

// Block and action IDs of the modal's inputs. Slack returns submitted values keyed by these
const BLOCKS = {
  title: { block: "title", action: "title_input" },
  description: { block: "description", action: "description_input" },
  type: { block: "type", action: "type_select" },
  urgency: { block: "urgency", action: "urgency_select" },
  neededBy: { block: "needed_by", action: "needed_by_date" },
  subteam: { block: "subteam", action: "subteam_select" },
};

/**
 * Where an issue request came from. Stored in the modal's private metadata between opening and submitting it
 */
export type IssueRequestSource = {
  /**
   * The channel of the message the request was created from, if created with the message shortcut
   */
  channelId?: string;
  /**
   * The timestamp of the message the request was created from, if created with the message shortcut
   */
  messageTs?: string;
  /**
   * A link to the message the request was created from, if created with the message shortcut
   */
  permalink?: string;
};

/**
 * A request for the software team, as submitted through the issue request modal
 */
export type IssueRequest = {
  title: string;
  description: string;
  type: RequestOption;
  urgency: RequestOption;
  /**
   * The date the request is needed by, in the form YYYY-MM-DD
   */
  neededBy?: string;
  subteam: string;
  requesterName: string;
  source: IssueRequestSource;
};

/**
 * Builds a Slack select option
 * @param text The text shown for the option
 * @param value The value submitted for the option
 * @returns The Slack option object
 */
function option(text: string, value: string): { text: { type: "plain_text"; text: string }; value: string } {
  return { text: { type: "plain_text", text }, value };
}

/**
 * Builds the modal that collects an issue request
 * @param repoFullName The repository issues are filed in, in the form "owner/repo"
 * @param source Where the request came from, if it was created from a message
 * @param initialDescription Text to prefill the description with
 * @returns The modal view
 */
export function buildIssueRequestModal(
  repoFullName: string,
  source: IssueRequestSource = {},
  initialDescription?: string,
): View {
  const blocks: KnownBlock[] = [
    {
      type: "context",
      elements: [
        {
          type: "mrkdwn",
          text: `:warning: This creates a *public* issue in <https://github.com/${repoFullName}|${repoFullName}>. Don't include passwords, personal info, or anything confidential.`,
        },
      ],
    },
    {
      type: "input",
      block_id: BLOCKS.title.block,
      label: { type: "plain_text", text: "Title" },
      element: {
        type: "plain_text_input",
        action_id: BLOCKS.title.action,
        max_length: MAX_TITLE_LENGTH,
        placeholder: { type: "plain_text", text: "e.g. Omnibus crashes when the CAN log is empty" },
      },
    },
    {
      type: "input",
      block_id: BLOCKS.description.block,
      label: { type: "plain_text", text: "Description" },
      element: {
        type: "plain_text_input",
        action_id: BLOCKS.description.action,
        multiline: true,
        max_length: MAX_DESCRIPTION_LENGTH,
        placeholder: { type: "plain_text", text: "What's happening, what you expected, and how to reproduce it" },
        ...(initialDescription ? { initial_value: initialDescription.slice(0, MAX_DESCRIPTION_LENGTH) } : {}),
      },
    },
    {
      type: "input",
      block_id: BLOCKS.type.block,
      label: { type: "plain_text", text: "Type" },
      element: {
        type: "static_select",
        action_id: BLOCKS.type.action,
        options: REQUEST_TYPES.map((t) => option(t.label, t.value)),
      },
    },
    {
      type: "input",
      block_id: BLOCKS.urgency.block,
      label: { type: "plain_text", text: "Urgency" },
      element: {
        type: "static_select",
        action_id: BLOCKS.urgency.action,
        options: URGENCIES.map((u) => option(u.label, u.value)),
      },
    },
    {
      type: "input",
      block_id: BLOCKS.neededBy.block,
      optional: true,
      label: { type: "plain_text", text: "Needed by" },
      element: { type: "datepicker", action_id: BLOCKS.neededBy.action },
    },
    {
      type: "input",
      block_id: BLOCKS.subteam.block,
      label: { type: "plain_text", text: "Your subteam" },
      element: {
        type: "static_select",
        action_id: BLOCKS.subteam.action,
        options: SUBTEAMS.map((s) => option(s, s)),
      },
    },
  ];

  if (source.permalink) {
    blocks.push({
      type: "context",
      elements: [{ type: "mrkdwn", text: `The issue will link back to <${source.permalink}|this Slack message>.` }],
    });
  }

  return {
    type: "modal",
    callback_id: ISSUE_REQUEST_VIEW_ID,
    title: { type: "plain_text", text: "Request from Software" },
    submit: { type: "plain_text", text: "Create issue" },
    close: { type: "plain_text", text: "Cancel" },
    private_metadata: JSON.stringify(source),
    blocks,
  };
}

/**
 * Parses the private metadata of the issue request modal
 * @param privateMetadata The modal's private metadata
 * @returns The source of the request
 */
export function parseIssueRequestSource(privateMetadata: string): IssueRequestSource {
  if (!privateMetadata) {
    return {};
  }

  try {
    return JSON.parse(privateMetadata) as IssueRequestSource;
  } catch {
    return {};
  }
}

/**
 * Parses the submitted values of the issue request modal
 * @param values The modal's state values, keyed by block ID and then action ID
 * @param requesterName The name of the Slack user who submitted the request
 * @param source Where the request came from
 * @returns Either the parsed request, or errors to show on the modal keyed by block ID
 */
export function parseIssueRequestSubmission(
  values: Record<string, Record<string, ViewStateValue>>,
  requesterName: string,
  source: IssueRequestSource,
): { request: IssueRequest; errors?: undefined } | { request?: undefined; errors: Record<string, string> } {
  const get = (field: { block: string; action: string }): ViewStateValue | undefined =>
    values[field.block]?.[field.action];

  const title = get(BLOCKS.title)?.value?.trim() ?? "";
  const description = get(BLOCKS.description)?.value?.trim() ?? "";
  const type = REQUEST_TYPES.find((t) => t.value == get(BLOCKS.type)?.selected_option?.value);
  const urgency = URGENCIES.find((u) => u.value == get(BLOCKS.urgency)?.selected_option?.value);
  const subteam = SUBTEAMS.find((s) => s == get(BLOCKS.subteam)?.selected_option?.value);
  const neededBy = get(BLOCKS.neededBy)?.selected_date ?? undefined;

  const errors: Record<string, string> = {};
  if (title == "") errors[BLOCKS.title.block] = "Please enter a title.";
  if (description == "") errors[BLOCKS.description.block] = "Please describe the request.";
  if (type == undefined) errors[BLOCKS.type.block] = "Please pick a type.";
  if (urgency == undefined) errors[BLOCKS.urgency.block] = "Please pick an urgency.";
  if (subteam == undefined) errors[BLOCKS.subteam.block] = "Please pick your subteam.";

  if (Object.keys(errors).length > 0 || type == undefined || urgency == undefined || subteam == undefined) {
    return { errors };
  }

  return { request: { title, description, type, urgency, neededBy, subteam, requesterName, source } };
}

/**
 * Escapes text for use inside a Markdown table cell
 * @param text The text to escape
 * @returns The escaped text
 */
function escapeTableCell(text: string): string {
  return text.replace(/\|/g, "\\|").replace(/\n/g, " ");
}

/**
 * Converts an issue request into the GitHub issue to create
 * @param request The issue request
 * @returns The GitHub issue's title, body and labels
 */
export function issueRequestToGitHubIssue(request: IssueRequest): NewGitHubIssue {
  const details: [string, string][] = [
    ["Requested by", escapeTableCell(request.requesterName)],
    ["Subteam", request.subteam],
    ["Type", request.type.label],
    ["Urgency", request.urgency.label],
    ["Needed by", request.neededBy ?? "-"],
  ];
  if (request.source.permalink) {
    details.push(["Slack", `[Original message](${request.source.permalink})`]);
  }

  const body = [
    "### Description",
    "",
    request.description,
    "",
    "### Request details",
    "",
    "| | |",
    "|---|---|",
    ...details.map(([key, value]) => `| **${key}** | ${value} |`),
    "",
    "<sub>Filed from Slack with Minerva.</sub>",
  ].join("\n");

  return {
    title: request.title,
    body,
    labels: [FROM_SLACK_LABEL, request.type.githubLabel, request.urgency.githubLabel],
  };
}

/**
 * Finds the IDs of all users mentioned in Slack message text
 * @param text The Slack message text
 * @returns The unique user IDs mentioned
 */
export function extractMentionedUserIds(text: string): string[] {
  const ids = [...text.matchAll(/<@([UW]\w+)(?:\|[^>]*)?>/g)].map((m) => m[1]);
  return [...new Set(ids)];
}

/**
 * Converts Slack message text into GitHub Markdown. Mentions are wrapped in code spans so they
 * don't ping unrelated GitHub users in the public issue.
 * @param text The Slack message text
 * @param userNames The display names of mentioned users, keyed by user ID
 * @returns The GitHub Markdown text
 */
export function slackTextToMarkdown(text: string, userNames: Record<string, string> = {}): string {
  return (
    text
      // User mentions: <@U123> or <@U123|name>
      .replace(/<@([UW]\w+)(?:\|([^>]*))?>/g, (_, id, name) => `\`@${userNames[id] ?? name ?? id}\``)
      // Channel mentions: <#C123|name> or <#C123>
      .replace(/<#(C\w+)(?:\|([^>]*))?>/g, (_, id, name) => `#${name || id}`)
      // Special mentions: <!here>, <!channel>, <!subteam^S123|@group>
      .replace(/<!subteam\^\w+\|@?([^>]*)>/g, (_, name) => `\`@${name}\``)
      .replace(/<!(\w+)(?:\|[^>]*)?>/g, (_, name) => `\`@${name}\``)
      // Links: <url|label> or <url>
      .replace(/<((?:https?|mailto):[^|>]+)\|([^>]+)>/g, (_, url, label) => `[${label}](${url})`)
      .replace(/<((?:https?|mailto):[^>]+)>/g, (_, url) => url)
      // Slack escapes these three characters in message text
      .replace(/&lt;/g, "<")
      .replace(/&gt;/g, ">")
      .replace(/&amp;/g, "&")
  );
}
