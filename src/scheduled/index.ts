import schedule from "node-schedule";
import checkForEvents from "./checkForEvents";
import { App } from "@slack/bolt";
import { OAuth2Client } from "google-auth-library";

const scheduleTasks = (app: App, googleAuth: OAuth2Client): void => {
  // Runs every five minutes
  schedule.scheduleJob("*/5 * * *", () => checkForEvents(app, googleAuth));
};

export default scheduleTasks;
