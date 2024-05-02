import { merge } from 'lodash';
import chalk from 'chalk';
import inquirer from 'inquirer';

import defaultConfigs from './db-configs';
import clientDependencies from './db-client-dependencies';
import stopProcess from './stop-process';

import type { ClientName, DatabaseInfo, NewOptions, Scope } from '../types';
import dbQuestions from './db-questions';

const DB_ARGS = ['dbclient', 'dbhost', 'dbport', 'dbname', 'dbusername', 'dbpassword'];

const VALID_CLIENTS = ['sqlite', 'mysql', 'postgres'] as const;

const DEFAULT_CONFIG: Partial<Scope> = {
  database: {
    client: 'sqlite',
    ...defaultConfigs.sqlite,
  },
  dependencies: clientDependencies({ client: 'sqlite' }),
};

async function askDatabaseInfos(options: Partial<NewOptions>): Promise<Partial<Scope>> {
  if (options.quickstart) {
    return DEFAULT_CONFIG;
  }

  const { useDefault } = await inquirer.prompt<{ useDefault: boolean }>([
    {
      type: 'confirm',
      name: 'useDefault',
      message: 'Use the default database (sqlite) ?',
      default: true,
    },
  ]);

  if (useDefault) {
    return DEFAULT_CONFIG;
  }

  const { client } = await inquirer.prompt<{ client: ClientName }>([
    {
      type: 'list',
      name: 'client',
      message: 'Choose your default database client',
      choices: ['sqlite', 'postgres', 'mysql'],
      default: 'sqlite',
    },
  ]);

  const questions = dbQuestions[client].map((q) => q({ client }));

  const responses = await inquirer.prompt(questions);

  return {
    database: merge({}, defaultConfigs[client], {
      client,
      connection: responses,
    }),
    dependencies: clientDependencies({ client }),
  };
}

export default async (options: Partial<NewOptions>): Promise<Partial<Scope>> => {
  const argKeys = Object.keys(options);
  const matchingArgs = DB_ARGS.filter((key) => argKeys.includes(key));
  const missingArgs = DB_ARGS.filter((key) => !argKeys.includes(key));

  if (matchingArgs.length === 0) {
    return askDatabaseInfos(options);
  }

  if (matchingArgs.length !== DB_ARGS.length && options.dbclient !== 'sqlite') {
    return stopProcess(`Required database arguments are missing: ${missingArgs.join(', ')}.`);
  }

  if (!options.dbclient || !VALID_CLIENTS.includes(options.dbclient)) {
    return stopProcess(
      `Invalid client ${chalk.yellow(options.dbclient)}. Possible choices: ${VALID_CLIENTS.join(
        ', '
      )}.`
    );
  }

  const database: DatabaseInfo = {
    client: options.dbclient,
    connection: merge({}, defaultConfigs[options.dbclient], {
      client: options.dbclient,
      host: options.dbhost,
      port: options.dbport,
      database: options.dbname,
      username: options.dbusername,
      password: options.dbpassword,
      filename: options.dbfile,
    }),
  };

  if (options.dbssl !== undefined) {
    database.connection.ssl = options.dbssl === 'true';
  }

  return {
    database,
    dependencies: clientDependencies({ client: options.dbclient }),
  };
};
