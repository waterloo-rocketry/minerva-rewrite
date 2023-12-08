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

  constructor(name: string, id: string) {
    this.name = name;
    this.id = id;
  }

  equals(other: SlackChannel): boolean {
    return this.name === other.name && this.id === other.id;
  }
}
