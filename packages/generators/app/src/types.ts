import type { PackageManager } from './utils/package-manager';

export interface Scope {
  name?: string;
  rootPath: string;
  template?: string;
  strapiVersion: string;
  installDependencies?: boolean;
  devDependencies: Record<string, string>;
  dependencies: Record<string, string>;
  docker: boolean;
  packageManager: PackageManager;
  runApp: boolean;
  quick?: boolean;
  uuid?: string;
  deviceId?: string;
  database?: DatabaseInfo;
  tmpPath: string;
  packageJsonStrapi: Record<string, unknown>;
  useTypescript: boolean;
}

export interface NewOptions {
  directory: string;

  useNpm: boolean;
  useYarn: boolean;
  usePnpm: boolean;

  run: boolean;
  quickstart: boolean;
  template: string;
  starter: string;

  typescript: boolean;
  javascript: boolean;

  dbssl: string;
  dbclient: ClientName;
  dbhost: string;
  dbport: string;
  dbname: string;
  dbusername: string;
  dbpassword: string;
  dbfile: string;
}

export type ClientName = 'mysql' | 'postgres' | 'sqlite';

export interface DatabaseInfo {
  client?: ClientName;
  connection: {
    host?: string;
    port?: string;
    database?: string;
    username?: string;
    password?: string;
    filename?: string;
    ssl?: boolean;
  };
  useNullAsDefault?: boolean;
}

export interface PackageInfo {
  name: string;
  version: string;
}

export interface TemplateConfig {
  package: Record<string, unknown>;
}

export interface StderrError extends Error {
  stderr: string;
}

export function isStderrError(error: unknown): error is StderrError {
  return (
    typeof error === 'object' &&
    error !== null &&
    'stderr' in error &&
    typeof error.stderr === 'string'
  );
}
