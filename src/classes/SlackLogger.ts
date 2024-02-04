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

  private async log(level: LogLevel, message: string, logToConsole = true): Promise<void> {
    const formattedMessage = this.formatMessage(level, message);

    if (logToConsole) {
      if (level === LogLevel.ERROR) {
        console.error(formattedMessage);
      } else {
        console.log(formattedMessage);
      }
    }

    await postMessage(this.slackClient, loggingChannel, formattedMessage);
  }

  async info(message: string, logToConsole = true): Promise<void> {
    await this.log(LogLevel.INFO, message, logToConsole);
  }

  async warning(message: string, logToConsole = true): Promise<void> {
    await this.log(LogLevel.WARNING, message, logToConsole);
  }

  async error(message: string, logToConsole = true): Promise<void> {
    await this.log(LogLevel.ERROR, message, logToConsole);
  }

  private formatMessage(level: LogLevel, message: string): string {
    const timeStamp = new Date().toISOString();
    return `[${timeStamp}] [${level}] ${message}`;
  }
}
