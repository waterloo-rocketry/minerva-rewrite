import { OAuth2Client } from 'google-auth-library';
import { google } from 'googleapis';
const calendar = google.calendar('v3');
import { config } from 'dotenv';

config();

// Set up OAuth2 client
const auth = new OAuth2Client({
  clientId: process.env.GOOGLE_ACCOUNT_CLIENT,
  clientSecret: process.env.GOOGLE_ACCOUNT_SECRET,
  redirectUri: 'https://developers.google.com/oauthplayground',
});

auth.setCredentials({
  refresh_token: process.env.GOOGLE_ACCOUNT_TOKEN,
});

(async () => {
  const result = await calendar.events.list({
    auth: auth,
    calendarId: 'primary',
    timeMin: new Date().toISOString(),
    maxResults: 1,
    singleEvents: true,
    orderBy: 'startTime',
  });
  console.log(result);
})();

console.log('Done!');
while (true) {}
