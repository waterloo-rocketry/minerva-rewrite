import { environment } from "../utils/env";

/**
 * The "default" slack channels for use in sending DM reminders to single-channel guests
 */
export const defaultSlackChannels =
  environment == "production"
    ? [
        "general",
        "airframe",
        "business",
        "controls",
        "electrical",
        "flight-dynamics",
        "infrastructure",
        "payload",
        "propulsion",
        "recovery",
        "software",
      ]
    : ["general", "random", "software", "test", "propulsion"]; // default channels for development
