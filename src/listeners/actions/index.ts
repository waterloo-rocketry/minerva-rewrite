import { App } from "@slack/bolt";
import buttonClickCallback from "./buttonClick";

const register = (app: App): void => {
  app.action("button_click", buttonClickCallback);
};

export default { register };
