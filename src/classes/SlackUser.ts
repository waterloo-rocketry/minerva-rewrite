/**
 * Enum representing user types
 */
export enum UserType {
  OWNER = "owner",
  ADMIN = "admin",
  BOT = "bot",
  RESTRICTED = "restricted",
  ULTRA_RESTRICTED = "ultra_restricted",
  FULL_MEMBER = "full_member",
}

/**
 * Class representing a slack user
 */
export default class SlackUser {
  /**
   * The name of the user
   */
  name: string;
  /**
   * The id of the user
   */
  id: string;
  /**
   * The type of the user e.g. admin, owner, bot, restricted (multi-channel guest), ultra_restricted (single-channel guest)
   */
  userType: UserType;

  constructor(name: string, id: string, userType: UserType) {
    this.name = name;
    this.id = id;
    this.userType = userType;
  }
  equals(other: SlackUser): boolean {
    return this.id === other.id;
  }
}
