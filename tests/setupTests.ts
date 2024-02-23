import sinon from "sinon";
import { SlackLogger } from "../src/classes/SlackLogger";

beforeAll(() => {
  // Stub the SlackLogger class' log method so that it doesn't actually send messages to Slack
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  sinon.stub(SlackLogger.prototype, "log" as any).callsFake(async () => {});
});
