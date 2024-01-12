import { WebClient } from "@slack/web-api";
import { OAuth2Client } from "google-auth-library";
import schedule from "node-schedule";
import checkForEvents from "./checkForEvents";

const scheduleTasks = (client: WebClient, googleAuth: OAuth2Client): void => {
  schedule.scheduleJob("*/5 * * * *", () => checkForEvents(client, googleAuth)); // Runs every five minutes
};

export default scheduleTasks;
