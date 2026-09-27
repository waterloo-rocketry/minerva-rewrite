import { App } from "@slack/bolt";
import issueRequestSubmitHandler from "./issueRequestSubmit";
import { ISSUE_REQUEST_VIEW_ID } from "../../utils/issueRequests";

const register = (app: App): void => {
  app.view(ISSUE_REQUEST_VIEW_ID, issueRequestSubmitHandler);
};

export default { register };
