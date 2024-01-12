import SlackChannel from "../../src/classes/SlackChannel";
import { defaultSlackChannels as defaultSlackChannelNames } from "../../src/common/constants";

export const slackChannels: SlackChannel[] = [
  new SlackChannel("admin", "C015DCM3JPN"),
  new SlackChannel("airframe", "C0155MGT7NW"),
  new SlackChannel("electrical", "C015BSR32E8"),
  new SlackChannel("general", "C014J93U4JZ"),
  new SlackChannel("minerva-log", "C015FSK7FQE"),
  new SlackChannel("payload", "C0155TL4KKM"),
  new SlackChannel("propulsion", "C0155MHAHB4"),
  new SlackChannel("random", "C014KSDM37V"),
  new SlackChannel("recovery", "C014QV0F9AB"),
  new SlackChannel("software", "C014YVDDLTG"),
  new SlackChannel("test", "C014RRJG8JG"),
];

export const defaultSlackChannels: SlackChannel[] = slackChannels.filter((channel) =>
  defaultSlackChannelNames.includes(channel.name),
);
