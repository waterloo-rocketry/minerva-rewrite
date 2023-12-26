import schedule from "node-schedule";
import runEveryMinute from "./runEveryMinute";
import checkForMeetings from "./checkForMeetings";
import { App } from "@slack/bolt";

const scheduleTasks = (app: App) => {
  schedule.scheduleJob("*/10 * * * * *", () => runEveryMinute());
  // Runs every five minutes
  schedule.scheduleJob("*/10 * * * * *", () => checkForMeetings(app));
};

export default scheduleTasks;
