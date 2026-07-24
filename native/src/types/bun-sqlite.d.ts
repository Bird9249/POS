declare module "bun:sqlite" {
  export class Database {
    constructor(path?: string);
    exec(sql: string): void;
    prepare(sql: string): {
      run(...params: unknown[]): { changes?: number };
      all(...params: unknown[]): unknown[];
    };
    close(): void;
  }
}
