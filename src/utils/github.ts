import { Octokit } from "@octokit/rest";
import { createAppAuth } from "@octokit/auth-app";
import * as environment from "./env";

/**
 * The fields needed to create a GitHub issue
 */
export type NewGitHubIssue = {
  title: string;
  body: string;
  labels: string[];
};

/**
 * A GitHub issue that has been created
 */
export type CreatedGitHubIssue = {
  number: number;
  url: string;
};

/**
 * The credentials of the GitHub App that minerva uses to act on GitHub
 */
export type GitHubAppCredentials = {
  appId: string;
  privateKey: string;
  installationId: string;
  /**
   * Overrides the GitHub API URL. Only used for testing against a local fake API
   */
  baseUrl?: string;
};

let githubClient: Octokit | undefined;

/**
 * Creates an Octokit client that authenticates as an installation of a GitHub App.
 * Installation tokens are fetched and refreshed automatically.
 * @param credentials The GitHub App credentials
 * @returns The authenticated Octokit client
 */
export function createGitHubAppClient(credentials: GitHubAppCredentials): Octokit {
  return new Octokit({
    authStrategy: createAppAuth,
    auth: {
      appId: credentials.appId,
      privateKey: credentials.privateKey,
      installationId: credentials.installationId,
    },
    ...(credentials.baseUrl ? { baseUrl: credentials.baseUrl } : {}),
  });
}

/**
 * Gets the GitHub client configured from the environment, creating it on first use
 * @returns The authenticated Octokit client
 * @throws Error if the GitHub App environment variables are not set
 */
export function getGitHubClient(): Octokit {
  if (githubClient) {
    return githubClient;
  }

  const { githubAppId, githubAppPrivateKeyBase64, githubAppInstallationId } = environment;
  if (!githubAppId || !githubAppPrivateKeyBase64 || !githubAppInstallationId) {
    throw new Error(
      "GitHub integration is not configured. Set GH_APP_ID, GH_APP_PRIVATE_KEY_BASE64 and GH_APP_INSTALLATION_ID.",
    );
  }

  githubClient = createGitHubAppClient({
    appId: githubAppId,
    privateKey: Buffer.from(githubAppPrivateKeyBase64, "base64").toString("utf8"),
    installationId: githubAppInstallationId,
  });
  return githubClient;
}

/**
 * Splits an "owner/repo" string into its parts
 * @param fullName The repository in the form "owner/repo"
 * @returns The owner and repo
 * @throws Error if the string is not in the form "owner/repo"
 */
export function parseRepoFullName(fullName: string): { owner: string; repo: string } {
  const match = fullName.trim().match(/^([\w.-]+)\/([\w.-]+)$/);
  if (match == null) {
    throw new Error(`\`${fullName}\` is not a valid repository name. Expected the form \`owner/repo\``);
  }

  return { owner: match[1], repo: match[2] };
}

/**
 * Creates an issue in a GitHub repository
 * @param client The authenticated Octokit client
 * @param repoFullName The repository to create the issue in, in the form "owner/repo"
 * @param issue The issue to create
 * @returns The number and URL of the created issue
 */
export async function createGitHubIssue(
  client: Octokit,
  repoFullName: string,
  issue: NewGitHubIssue,
): Promise<CreatedGitHubIssue> {
  const { owner, repo } = parseRepoFullName(repoFullName);

  try {
    const res = await client.rest.issues.create({
      owner,
      repo,
      title: issue.title,
      body: issue.body,
      labels: issue.labels,
    });

    return { number: res.data.number, url: res.data.html_url };
  } catch (error) {
    throw Error(`Failed to create GitHub issue in \`${repoFullName}\``, { cause: error });
  }
}
