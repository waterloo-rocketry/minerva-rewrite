import { OAuth2Client } from 'google-auth-library';
import { google } from 'googleapis';
const calendar = google.calendar('v3');
import { config } from 'dotenv';

config();

async function main(eventId: string, updatedFields: object) {
  // Set up OAuth2 client
  const auth = new OAuth2Client({
    clientId: process.env.GOOGLE_ACCOUNT_CLIENT,
    clientSecret: process.env.GOOGLE_ACCOUNT_SECRET,
    redirectUri: 'https://developers.google.com/oauthplayground',
  });

  auth.setCredentials({
    refresh_token: process.env.GOOGLE_ACCOUNT_TOKEN,
  });

  // Returns next 10 events. Commonly used data in result.data.items
  const getNextEvents = await calendar.events.list({
    auth: auth,
    calendarId: 'primary',
    timeMin: new Date().toISOString(),
    maxResults: 10,
    singleEvents: true,
    orderBy: 'startTime',
  });

  const getEventById = await calendar.events.get({
    auth: auth,
    calendarId: 'primary',
    eventId: eventId,
  });

  const updateEventById = await calendar.events.patch({
    auth: auth,
    calendarId: 'primary',
    eventId: eventId,
    requestBody: updatedFields,
  });

  console.log(getNextEvents.data.items);
  console.log(getEventById.data);
  console.log(updateEventById.data);
  console.log('Done!');

  while (true) {}
}

main();
