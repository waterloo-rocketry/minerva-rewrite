import { WebClient } from "@slack/web-api";
import { Octokit } from "@octokit/rest";
import { fileIssueRequest } from "../../../src/listeners/views/issueRequestSubmit";
import { IssueRequest, REQUEST_TYPES, URGENCIES } from "../../../src/utils/issueRequests";

const ISSUE_URL = "https://github.com/a/b/issues/14";

const request: IssueRequest = {
  title: "Omnibus crashes on empty CAN log",
  description: "It crashes.",
  type: REQUEST_TYPES[0],
  urgency: URGENCIES[0],
  subteam: "Propulsion",
  requesterName: "sshingala",
  source: {},
};

/**
 * Creates fake Slack and GitHub clients
 * @param createIssue The fake implementation of GitHub's create issue call
 * @returns The fake clients and their mocked methods
 */
function fakeClients(createIssue: jest.Mock): {
  slack: WebClient;
  github: Octokit;
  postMessage: jest.Mock;
} {
  const postMessage = jest.fn().mockResolvedValue({ ok: true });
  return {
    slack: { chat: { postMessage } } as unknown as WebClient,
    github: { rest: { issues: { create: createIssue } } } as unknown as Octokit,
    postMessage,
  };
}

describe("fileIssueRequest", () => {
  const created = (): jest.Mock => jest.fn().mockResolvedValue({ data: { number: 14, html_url: ISSUE_URL } });

  it("creates the issue and DMs the requester a link", async () => {
    const { slack, github, postMessage } = fakeClients(created());

    const issue = await fileIssueRequest(slack, github, "a/b", request, "U999");

    expect(issue).toEqual({ number: 14, url: ISSUE_URL });
    expect(postMessage).toHaveBeenCalledTimes(1);
    expect(postMessage.mock.calls[0][0].channel).toEqual("U999");
    expect(postMessage.mock.calls[0][0].text).toContain(`<${ISSUE_URL}|a/b#14>`);
  });

  it("also replies in the original message's thread when created from a message", async () => {
    const { slack, github, postMessage } = fakeClients(created());

    await fileIssueRequest(
      slack,
      github,
      "a/b",
      { ...request, source: { channelId: "C123", messageTs: "1707843500.000000" } },
      "U999",
    );

    expect(postMessage).toHaveBeenCalledTimes(2);
    expect(postMessage.mock.calls[1][0]).toEqual({
      channel: "C123",
      thread_ts: "1707843500.000000",
      text: `:ticket: <@U999> filed this as <${ISSUE_URL}|a/b#14>`,
    });
  });

  it("still succeeds when minerva can't reply in the thread", async () => {
    const { slack, github, postMessage } = fakeClients(created());
    postMessage.mockResolvedValueOnce({ ok: true }).mockRejectedValueOnce(new Error("not_in_channel"));

    const issue = await fileIssueRequest(
      slack,
      github,
      "a/b",
      { ...request, source: { channelId: "C123", messageTs: "1707843500.000000" } },
      "U999",
    );

    expect(issue).toEqual({ number: 14, url: ISSUE_URL });
  });

  it("DMs the requester their description back when GitHub fails", async () => {
    const { slack, github, postMessage } = fakeClients(jest.fn().mockRejectedValue(new Error("Bad credentials")));

    const issue = await fileIssueRequest(slack, github, "a/b", request, "U999");

    expect(issue).toBeUndefined();
    expect(postMessage).toHaveBeenCalledTimes(1);
    expect(postMessage.mock.calls[0][0].channel).toEqual("U999");
    expect(postMessage.mock.calls[0][0].text).toContain("couldn't create your issue");
    expect(postMessage.mock.calls[0][0].text).toContain("It crashes.");
  });
});
