/**
 * Class representing a slack guest
 */
export default class SlackGuest {
  /**
   * The name of the guest
   */
  name: string;
  /**
   * The id of the guest
   */
  id: string;
  /**
   * The role of the guest
   */
  role: string;

  constructor(name: string, id: string, role: string) {
    this.name = name;
    this.id = id;
    this.role = role;
  }
}
