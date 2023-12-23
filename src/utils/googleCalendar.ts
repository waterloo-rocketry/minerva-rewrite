import { OAuth2Client } from "google-auth-library";
import { google } from "googleapis";
import CalendarEvent from "../classes/CalendarEvent";
import SlackChannel from "../classes/SlackChannel";

const calendar = google.calendar("v3");

// Set up Google OAuth2 client
const auth = new OAuth2Client({
  clientId: process.env.GOOGLE_ACCOUNT_CLIENT,
  clientSecret: process.env.GOOGLE_ACCOUNT_SECRET,
  redirectUri: process.env.GOOGLE_ACCOUNT_OAUTH_REDIRECT,
});

// Set up OAuth2 credentials
auth.setCredentials({
  refresh_token: process.env.GOOGLE_ACCOUNT_TOKEN,
});

// Function to fetch all events in the next 24 hours
export async function getEvents() {
  const currentTime = new Date();
  const next24Hours = new Date(currentTime.getTime() + 24 * 60 * 60 * 1000);

  const getNextEvents = await calendar.events.list({
    auth: auth,
    calendarId: "primary",
    timeMin: currentTime.toISOString(),
    timeMax: next24Hours.toISOString(),
    singleEvents: true,
    orderBy: "startTime",
  });

  return getNextEvents.data;
}

// Parsing all events from all channels in the next 24 hours into a list of CalendarEvents
export async function parseEvents(nextEvents, channels: SlackChannel[]) {
  const events: CalendarEvent[] = [];
  if (nextEvents.items) {
    nextEvents.items.forEach((event) => {
      const calendarEvent = new CalendarEvent(event, channels);
      events.push(calendarEvent);
    });
  } else {
    return "No events found.";
  }
  return events;
}

// // Parsing all events from specific channels in the next 24 hours into a list of CalendarEvents
// export async function parseEventsOfChannels(channelNames: string[], channels: SlackChannel[]) {
//   const filteredChannels = filterSlackChannelsFromNames(channelNames, channels);
//   const events: CalendarEvent[] = [];
//   if (nextEvents.items) {
//     nextEvents.items.forEach((event) => {
//       const calendarEvent = new CalendarEvent(event, filteredChannels);
//       events.push(calendarEvent);
//     });
//   } else {
//     return "No events found.";
//   }
//   return events;
// }
