import { config } from 'dotenv';

config();

console.log(
  `
##############################################################################################
Application minerva-dev (re)started. Deployed commit: ${process.env.COMMIT_SHA}
##############################################################################################
`,
);

console.log('There is nothing here yet.');
console.error('This is an error.');
while (true) {}
