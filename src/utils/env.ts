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
