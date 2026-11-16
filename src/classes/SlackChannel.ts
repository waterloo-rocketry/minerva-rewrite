/**
 * Class representing a slack channel
 */
export default class SlackChannel {
  /**
   * The name of the channel
   */
  name: string;
  /**
   * The id of the channel
   */
  id: string;
  /**
   * Whether the channel is private. Minerva can only see private channels it has been invited to
   */
  isPrivate: boolean;

  constructor(name: string, id: string, isPrivate = false) {
    this.name = name;
    this.id = id;
    this.isPrivate = isPrivate;
  }

  equals(other: SlackChannel): boolean {
    return this.name === other.name && this.id === other.id;
  }
}
