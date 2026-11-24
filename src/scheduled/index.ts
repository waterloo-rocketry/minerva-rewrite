import { WebClient } from "@slack/web-api";
import { OAuth2Client } from "google-auth-library";
import schedule from "node-schedule";
import checkForEvents from "./checkForEvents";
import { MeetingLinkProvider } from "../utils/meetingLinks";

const scheduleTasks = (client: WebClient, googleAuth: OAuth2Client, getMeetingLink: MeetingLinkProvider): void => {
  schedule.scheduleJob("*/5 * * * *", () => checkForEvents(client, googleAuth, getMeetingLink)); // Runs every five minutes
};

export default scheduleTasks;
