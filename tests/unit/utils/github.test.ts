import { Octokit } from "@octokit/rest";
import { createGitHubIssue, parseRepoFullName } from "../../../src/utils/github";

describe("parseRepoFullName", () => {
  it("splits owner and repo", () => {
    expect(parseRepoFullName("waterloo-rocketry/2026-2027-software-issues")).toEqual({
      owner: "waterloo-rocketry",
      repo: "2026-2027-software-issues",
    });
  });

  it.each(["", "no-slash", "a/b/c", "https://github.com/a/b"])("rejects %p", (name) => {
    expect(() => parseRepoFullName(name)).toThrow("not a valid repository name");
  });
});

describe("createGitHubIssue", () => {
  it("creates the issue and returns its number and URL", async () => {
    const create = jest.fn().mockResolvedValue({ data: { number: 14, html_url: "https://github.com/a/b/issues/14" } });
    const client = { rest: { issues: { create } } } as unknown as Octokit;

    const issue = await createGitHubIssue(client, "a/b", { title: "T", body: "B", labels: ["bug"] });

    expect(issue).toEqual({ number: 14, url: "https://github.com/a/b/issues/14" });
    expect(create).toHaveBeenCalledWith({ owner: "a", repo: "b", title: "T", body: "B", labels: ["bug"] });
  });

  it("wraps API errors with the repo name", async () => {
    const create = jest.fn().mockRejectedValue(new Error("Bad credentials"));
    const client = { rest: { issues: { create } } } as unknown as Octokit;

    await expect(createGitHubIssue(client, "a/b", { title: "T", body: "B", labels: [] })).rejects.toThrow(
      "Failed to create GitHub issue in `a/b`",
    );
  });
});
