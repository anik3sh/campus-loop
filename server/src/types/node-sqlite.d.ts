// Type declarations for node:sqlite (available since Node 22.5 / 26+)
declare module 'node:sqlite' {
  interface StatementResultingChanges {
    changes: number;
    lastInsertRowid: number | bigint;
  }

  interface StatementSync {
    run(...params: any[]): StatementResultingChanges;
    get(...params: any[]): any;
    all(...params: any[]): any[];
    iterate(...params: any[]): IterableIterator<any>;
    setAllowBareNamedParameters(allow: boolean): void;
    setReadBigInts(readBigInts: boolean): void;
    expandedSQL: string;
    sourceSQL: string;
  }

  interface DatabaseSync {
    exec(sql: string): void;
    prepare(sql: string): StatementSync;
    close(): void;
    open(): void;
    isOpen: boolean;
  }

  interface DatabaseSyncOptions {
    open?: boolean;
    readOnly?: boolean;
    enableForeignKeyConstraints?: boolean;
    enableLoadExtension?: boolean;
  }

  class DatabaseSync {
    constructor(location: string, options?: DatabaseSyncOptions);
    exec(sql: string): void;
    prepare(sql: string): StatementSync;
    close(): void;
    open(): void;
    isOpen: boolean;
  }

  function DatabaseSync(location: string, options?: DatabaseSyncOptions): DatabaseSync;
}
