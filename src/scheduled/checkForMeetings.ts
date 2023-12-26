import { App } from "@slack/bolt";

const checkForMeetings = async (app: App) => {
  console.log("This runs every 10 seconds!");
};

export default checkForMeetings;
