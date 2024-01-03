import { environment } from "../utils/env";

/**
 * The slack channels to use when the `default` channel is specified
 */
export const defaultSlackChannels =
  environment == "production"
    ? [
        "general",
        "airframe",
        "electrical",
        "business",
        "controls",
        "software",
        "propulsion",
        "payload",
        "flight-dynamics",
        "infrastructure",
        "recovery",
      ]
    : ["general", "random", "software", "test", "propulsion"];
