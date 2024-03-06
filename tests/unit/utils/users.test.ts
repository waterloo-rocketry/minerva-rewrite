import { determineUserType } from "../../../src/utils/users";
import { UserType } from "../../../src/classes/SlackUser";
import { Member } from "@slack/web-api/dist/response/UsersListResponse";

import slackMember from "../../fixtures/slackMember";

describe("determineUserType", () => {
  beforeEach(() => {
    slackMember.is_owner = false;
    slackMember.is_bot = false;
    slackMember.is_admin = false;
    slackMember.is_ultra_restricted = false;
    slackMember.is_restricted = false;
  });

  it("should return the user type: owner", () => {
    const member: Member = slackMember;

    member.is_owner = true;

    const result = determineUserType(member);

    expect(result).toBe(UserType.OWNER);
  });

  it("should return the user type: bot", () => {
    const member: Member = slackMember;

    member.is_bot = true;

    const result = determineUserType(member);

    expect(result).toBe(UserType.BOT);
  });

  it("should return the user type: admin", () => {
    const member: Member = slackMember;

    member.is_admin = true;

    const result = determineUserType(member);

    expect(result).toBe(UserType.ADMIN);
  });

  it("should return the user type: ultra_restricted", () => {
    const member: Member = slackMember;

    member.is_restricted = true;
    member.is_ultra_restricted = true;

    const result = determineUserType(member);

    expect(result).toBe(UserType.ULTRA_RESTRICTED);
  });

  it("should return the user type: restricted", () => {
    const member: Member = slackMember;

    member.is_restricted = true;

    const result = determineUserType(member);

    expect(result).toBe(UserType.RESTRICTED);
  });

  it("should return the user type: full_member", () => {
    const member: Member = slackMember;

    const result = determineUserType(member);

    expect(result).toBe(UserType.FULL_MEMBER);
  });
});
