import { WebClient } from "@slack/web-api";
import { postMessage } from "../utils/slack";
import * as environment from "../utils/env";
import { loggingChannel } from "../common/constants";
import { App } from "@slack/bolt";

export enum LogLevel {
  INFO = "INFO",
  WARNING = "WARN",
  ERROR = "ERROR",
}

export class SlackLogger {
  private static instance: SlackLogger;
  slackClient: WebClient;

  private constructor(slackClient: WebClient) {
    this.slackClient = slackClient;
  }

  static getInstance(): SlackLogger {
    if (!SlackLogger.instance) {
      const app = new App({
        token: environment.slackBotToken,
        signingSecret: environment.slackSigningSecret,
        socketMode: true,
        appToken: environment.slackAppToken,
      });
      SlackLogger.instance = new SlackLogger(app.client);
    }
    return SlackLogger.instance;
  }

  private async log(
    level: LogLevel,
    message: string,
    codeBlockContent: string = "",
    logToConsole = true,
  ): Promise<void> {
    const formattedMessage = this.formatMessage(level, message);

    if (logToConsole) {
      if (level === LogLevel.ERROR) {
        console.error(formattedMessage);
        console.error(codeBlockContent);
      } else {
        console.log(formattedMessage);
        console.log(codeBlockContent);
      }
    }

    let formattedSlackMessage = formattedMessage;

    if (codeBlockContent) {
      formattedSlackMessage += "\n" + this.formatcodeBlockContent(codeBlockContent);
    }

    await postMessage(this.slackClient, loggingChannel, formattedSlackMessage);
  }

  async info(message: string, codeBlockContent: string = "", logToConsole = true): Promise<void> {
    await this.log(LogLevel.INFO, message, codeBlockContent, logToConsole);
  }

  async warning(message: string, codeBlockContent: string = "", logToConsole = true): Promise<void> {
    await this.log(LogLevel.WARNING, message, codeBlockContent, logToConsole);
  }

  async error(message: string, codeBlockContent: string = "", logToConsole = true): Promise<void> {
    await this.log(LogLevel.ERROR, message, codeBlockContent, logToConsole);
  }

  private formatMessage(level: LogLevel, message: string): string {
    const timeStamp = new Date().toISOString();
    return `[${timeStamp}] [${level}] ${message}`;
  }

  private formatcodeBlockContent(codeBlockContent: string): string {
    return `\`\`\`${codeBlockContent}\`\`\``;
  }
}
