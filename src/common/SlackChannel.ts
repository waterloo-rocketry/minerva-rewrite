export default class SlackChannel {
  name: string;
  id: string;

  constructor(name: string, id: string) {
    this.name = name;
    this.id = id;
  }

  equals(other: SlackChannel): boolean {
    return this.name === other.name && this.id === other.id;
  }
}
