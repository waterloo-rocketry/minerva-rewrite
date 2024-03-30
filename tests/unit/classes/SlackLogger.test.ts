import { SlackLogger } from "../../../src/classes/SlackLogger";

describe("classes/SlackLogger", () => {
  it("should be a singleton", () => {
    const logger1 = SlackLogger.getInstance();
    const logger2 = SlackLogger.getInstance();
    expect(logger1).toBe(logger2);
  });
});
