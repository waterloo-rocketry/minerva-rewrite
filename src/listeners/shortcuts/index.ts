import { App, MessageShortcut } from "@slack/bolt";
import createIssueShortcutHandler, { CREATE_ISSUE_SHORTCUT_ID } from "./createIssueShortcut";

const register = (app: App): void => {
  app.shortcut<MessageShortcut>(CREATE_ISSUE_SHORTCUT_ID, createIssueShortcutHandler);
};

export default { register };
