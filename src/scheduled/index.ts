import schedule from "node-schedule";
import checkForEvents from "./checkForEvents";
import { App } from "@slack/bolt";
import { OAuth2Client } from "google-auth-library";

const scheduleTasks = (app: App, googleAuth: OAuth2Client): void => {
  schedule.scheduleJob("*/5 * * * *", () => checkForEvents(app, googleAuth)); // Runs every five minutes
};

export default scheduleTasks;
