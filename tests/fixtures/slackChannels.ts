import SlackChannel from '../../src/classes/SlackChannel';

const slackChannels = [
  new SlackChannel('general', 'C014J93U4JZ'),
  new SlackChannel('random', 'C014KSDM37V'),
  new SlackChannel('recovery', 'C014QV0F9AB'),
  new SlackChannel('test', 'C014RRJG8JG'),
  new SlackChannel('software', 'C014YVDDLTG'),
  new SlackChannel('airframe', 'C0155MGT7NW'),
  new SlackChannel('propulsion', 'C0155MHAHB4'),
  new SlackChannel('payload', 'C0155TL4KKM'),
  new SlackChannel('electrical', 'C015BSR32E8'),
  new SlackChannel('admin', 'C015DCM3JPN'),
  new SlackChannel('minerva-log', 'C015FSK7FQE'),
];

export default slackChannels;
