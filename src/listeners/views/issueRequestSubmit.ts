import { AllMiddlewareArgs, SlackViewMiddlewareArgs, ViewSubmitAction } from "@slack/bolt";
import { WebClient } from "@slack/web-api";
import { Octokit } from "@octokit/rest";

import {
  IssueRequest,
  issueRequestToGitHubIssue,
  parseIssueRequestSource,
  parseIssueRequestSubmission,
} from "../../utils/issueRequests";
import { CreatedGitHubIssue, createGitHubIssue, getGitHubClient } from "../../utils/github";
import { postMessage } from "../../utils/slack";
import { githubIssuesRepo } from "../../utils/env";
import { loggingChannel } from "../../common/constants";
import SlackUser, { UserType } from "../../classes/SlackUser";
import { SlackLogger } from "../../classes/SlackLogger";

/**
 * Handles submissions of the issue request modal
 * @param obj The arguments for the middleware
 * @param obj.ack The Bolt app's `ack()` function
 * @param obj.body The submission payload
 * @param obj.view The submitted view
 * @param obj.client The Bolt app client
 * @returns A promise of void
 */
export default async function issueRequestSubmitHandler({
  ack,
  body,
  view,
  client,
}: SlackViewMiddlewareArgs<ViewSubmitAction> & AllMiddlewareArgs): Promise<void> {
  const source = parseIssueRequestSource(view.private_metadata);
  const { request, errors } = parseIssueRequestSubmission(view.state.values, body.user.name, source);

  if (errors) {
    // Keeps the modal open and shows the errors next to their fields
    await ack({ response_action: "errors", errors });
    return;
  }

  // Close the modal right away; Slack requires an ack within 3 seconds and GitHub may be slower
  await ack();

  let githubClient: Octokit;
  try {
    githubClient = getGitHubClient();
  } catch (error) {
    SlackLogger.getInstance().error("Failed to create a GitHub issue from Slack", error);
    await notifyRequesterOfFailure(client, body.user.id, body.user.name, request);
    return;
  }

  await fileIssueRequest(client, githubClient, githubIssuesRepo, request, body.user.id);
}

/**
 * Creates the GitHub issue for a request, then tells the requester and the original thread about it
 * @param slackClient Slack Web API client
 * @param githubClient The authenticated Octokit client
 * @param repoFullName The repository to file the issue in, in the form "owner/repo"
 * @param request The issue request
 * @param requesterId The Slack ID of the user who made the request
 * @returns The created issue, or undefined if it could not be created
 */
export async function fileIssueRequest(
  slackClient: WebClient,
  githubClient: Octokit,
  repoFullName: string,
  request: IssueRequest,
  requesterId: string,
): Promise<CreatedGitHubIssue | undefined> {
  let issue: CreatedGitHubIssue;
  try {
    issue = await createGitHubIssue(githubClient, repoFullName, issueRequestToGitHubIssue(request));
  } catch (error) {
    SlackLogger.getInstance().error("Failed to create a GitHub issue from Slack", error);
    await notifyRequesterOfFailure(slackClient, requesterId, request.requesterName, request);
    return undefined;
  }

  const issueLink = `<${issue.url}|${repoFullName}#${issue.number}>`;
  SlackLogger.getInstance().info(`\`${request.requesterName}\` filed ${issueLink} from Slack`);

  try {
    await postMessage(
      slackClient,
      new SlackUser(request.requesterName, requesterId, UserType.FULL_MEMBER),
      `:white_check_mark: Created ${issueLink}: *${request.title}*. The software team will follow up on the issue.`,
    );
  } catch {
    // postMessage has already logged the failure; the issue itself was still created
  }

  const { channelId, messageTs } = request.source;
  if (channelId && messageTs) {
    try {
      await slackClient.chat.postMessage({
        channel: channelId,
        thread_ts: messageTs,
        text: `:ticket: <@${requesterId}> filed this as ${issueLink}`,
      });
    } catch (error) {
      // Expected when minerva isn't a member of the channel
      SlackLogger.getInstance().warning(`Couldn't reply in the thread of the message behind ${issueLink}`, error);
    }
  }

  return issue;
}

/**
 * Tells the requester their issue couldn't be created, and gives them back what they wrote
 * @param client Slack Web API client
 * @param requesterId The Slack ID of the requester
 * @param requesterName The Slack name of the requester
 * @param request The request that failed to be filed
 */
async function notifyRequesterOfFailure(
  client: WebClient,
  requesterId: string,
  requesterName: string,
  request: IssueRequest,
): Promise<void> {
  try {
    await postMessage(
      client,
      new SlackUser(requesterName, requesterId, UserType.FULL_MEMBER),
      `:x: Sorry, I couldn't create your issue *${request.title}*. The error was logged in <#${loggingChannel.id}>. Here's what you wrote so it isn't lost:\n\`\`\`${request.description}\`\`\``,
    );
  } catch {
    // postMessage has already logged the failure
  }
}
