import sinon from "sinon";
import { SlackLogger } from "../src/classes/SlackLogger";

beforeAll(() => {
  // Stub the SlackLogger class' log method so that it doesn't actually send messages to Slack
  // Abusing type assertions (...as any) to access private methods and properties
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  sinon.stub(SlackLogger.prototype, "log" as any).callsFake(async () => {});
  // Initializing an instance of the SlackLogger class with no Slack client to use for testing
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  SlackLogger["instance"] = new (SlackLogger as any)(null);
});
