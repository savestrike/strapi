export interface Program {
  noRun?: boolean;
  useNpm?: boolean;
  debug?: boolean;
  quickstart?: boolean;
  dbclient?: 'mysql' | 'postgres' | 'sqlite';
  dbhost?: string;
  dbport?: string;
  dbname?: string;
  dbusername?: string;
  dbpassword?: string;
  dbssl?: string;
  dbfile?: string;
  template?: string;
  typescript?: boolean;
}
