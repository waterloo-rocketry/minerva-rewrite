import { config } from "dotenv";

config();

export const environment = process.env.NODE_ENV;
export const slackBotToken = process.env.SLACK_OAUTH_TOKEN;
export const slackSigningSecret = process.env.SLACK_SIGNING_SECRET;
export const slackAppToken = process.env.SLACK_APP_TOKEN;
export const googleAccountClient = process.env.GOOGLE_ACCOUNT_CLIENT;
export const googleAccountSecret = process.env.GOOGLE_ACCOUNT_SECRET;
export const googleAccountToken = process.env.GOOGLE_ACCOUNT_TOKEN;
export const googleAccountOauthRedirect = process.env.GOOGLE_ACCOUNT_OAUTH_REDIRECT;
export const deploymentCommitHash = process.env.DEPLOY_COMMIT_SHA;
export const githubAppId = process.env.GH_APP_ID;
// Base64-encoded so the multi-line PEM key survives being echoed into .env by the deploy workflows
export const githubAppPrivateKeyBase64 = process.env.GH_APP_PRIVATE_KEY_BASE64;
export const githubAppInstallationId = process.env.GH_APP_INSTALLATION_ID;
// The "owner/repo" that issue requests from Slack are filed in. Changes every design cycle.
// `||` rather than `??` because the deploy workflows write an empty value when the variable is unset
export const githubIssuesRepo = process.env.GH_ISSUES_REPO || "waterloo-rocketry/2026-2027-software-issues";
