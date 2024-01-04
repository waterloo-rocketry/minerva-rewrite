import { App } from "@slack/bolt";
import buttonClickCallback from "./buttonClick";

<<<<<<< HEAD
const register = (app: App) => {
=======
const register = (app: App): void => {
>>>>>>> 876a8abb602728144021a28928219c8a3d994356
  app.action("button_click", buttonClickCallback);
};

export default { register };
