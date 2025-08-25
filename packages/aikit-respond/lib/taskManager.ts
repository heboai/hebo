type Task = () => Promise<void>;

class TaskManager {
  private queue: Task[] = [];
  private runningTasks = 0;
  private readonly concurrency: number;

  constructor(concurrency = 5) {
    this.concurrency = concurrency;
    console.log(
      `TaskManager initialized with concurrency: ${this.concurrency}`,
    );
  }

  addTask(task: Task) {
    this.queue.push(task);
    this.processQueue();
  }

  private processQueue() {
    while (this.queue.length > 0 && this.runningTasks < this.concurrency) {
      const task = this.queue.shift();
      if (task) {
        this.runningTasks++;
        console.log(
          `Starting task. Running: ${this.runningTasks}, Queued: ${this.queue.length}`,
        );

        task()
          .catch((error) => {
            console.error("Task failed with error:", error);
          })
          .finally(() => {
            this.runningTasks--;
            console.log(
              `Finished task. Running: ${this.runningTasks}, Queued: ${this.queue.length}`,
            );
            this.processQueue();
          });
      }
    }
  }

  getActiveTasks(): number {
    return this.runningTasks + this.queue.length;
  }

  getRunningTasks(): number {
    return this.runningTasks;
  }

  getQueuedTasks(): number {
    return this.queue.length;
  }

  getConcurrency(): number {
    return this.concurrency;
  }
}

export const taskManager = new TaskManager(5); // Set concurrency to 5
