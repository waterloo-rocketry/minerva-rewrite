import { WebClient } from "@slack/web-api";
import { postMessage } from "../utils/slack";
import * as environment from "../utils/env";
import { loggingChannel } from "../common/constants";
import { App } from "@slack/bolt";

/**
 * The levels of logging that can be used
 */
export enum LogLevel {
  INFO = "INFO",
  WARNING = "WARN",
  ERROR = "ERROR",
}

/**
 * A class to handle logging to Slack
 */
export class SlackLogger {
  private static instance: SlackLogger;
  slackClient: WebClient;

  /**
   * Singleton constructor for SlackLogger
   * @param slackClient The Slack Web API client to use for logging
   */
  private constructor(slackClient: WebClient) {
    this.slackClient = slackClient;
  }

  /**
   * Get the singleton instance of SlackLogger
   * @returns The singleton instance of SlackLogger
   */
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

  /**
   * Log a message to the minerva logging channel in Slack
   * @param level The level of the log
   * @param message The message to log
   * @param codeBlockContent The content of the code block to log after the message, if any.
   * @param logToConsole Whether to log the message to the console in addition to Slack
   */
  private async log(
    level: LogLevel,
    message: string,
    codeBlockContent: unknown = "",
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

  /**
   * Log an info message to Slack
   * @param message The message to log
   * @param codeBlockContent The content of the code block to log after the message, if any.
   * @param logToConsole Whether to log the message to the console in addition to Slack
   */
  async info(message: string, codeBlockContent: unknown = "", logToConsole = true): Promise<void> {
    await this.log(LogLevel.INFO, message, codeBlockContent, logToConsole);
  }
  /**
   * Log a warning message to Slack
   * @param message The message to log
   * @param codeBlockContent The content of the code block to log after the message, if any.
   * @param logToConsole Whether to log the message to the console in addition to Slack
   */
  async warning(message: string, codeBlockContent: unknown = "", logToConsole = true): Promise<void> {
    await this.log(LogLevel.WARNING, message, codeBlockContent, logToConsole);
  }

  /**
   * Log an error message to Slack
   * @param message The message to log
   * @param codeBlockContent The content of the code block to log after the message, if any. Can be used to log the error content
   * @param logToConsole Whether to log the message to the console in addition to Slack
   */
  async error(message: string, codeBlockContent: unknown = "", logToConsole = true): Promise<void> {
    await this.log(LogLevel.ERROR, message, codeBlockContent, logToConsole);
  }

  /**
   * Formats the message into a log line
   * @param level The message level
   * @param message The message to log
   * @returns The formatted log line
   */
  private formatMessage(level: LogLevel, message: string): string {
    const timeStamp = new Date().toISOString();
    return `[${timeStamp}] [${level}] ${message}`;
  }

  /**
   * Formats code block content for Slack
   * @param codeBlockContent The content of the code block
   * @returns The formatted code block content
   */
  private formatcodeBlockContent(codeBlockContent: unknown): string {
    if (codeBlockContent instanceof Error) {
      return `\`\`\`${codeBlockContent.message}\`\`\``;
    } else {
      return `\`\`\`${codeBlockContent}\`\`\``;
    }
  }
}
