export class RunsQueue {
  private static queue: string[] = []

  public static push(confFile: string) {
    this.queue.push(confFile)
  }

  public static pop() {
    return this.queue.shift()
  }

  public static getLength() {
    return this.queue.length
  }
}
