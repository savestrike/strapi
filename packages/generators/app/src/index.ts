import { join, resolve, basename } from 'node:path';
import { readFileSync } from 'node:fs';
import os from 'node:os';
import readline from 'node:readline';
import crypto from 'crypto';
import * as sentry from '@sentry/node';
import inquirer from 'inquirer';
import { merge } from 'lodash';

import checkRequirements from './utils/check-requirements';
import { trackError, captureException, trackUsage } from './utils/usage';
import parseDatabaseArguments from './utils/parse-db-arguments';
import machineID from './utils/machine-id';
import { detectPackageManager } from './utils/package-manager';
import type { Scope, NewOptions } from './types';

import checkInstallPath from './utils/check-install-path';
import createProject from './create-project';

export type Options = NewOptions;

const packageJson = JSON.parse(readFileSync(resolve(__dirname, '../package.json'), 'utf8'));

const getPackageManager = (options: Partial<NewOptions>) => {
  switch (true) {
    case options.useNpm === true:
      return 'npm';
    case options.usePnpm === true:
      return 'pnpm';
    case options.useYarn === true:
      return 'yarn';
    default:
      return detectPackageManager();
  }
};

interface Answers {
  directory: string;
}

async function promptTypescript(options: Partial<NewOptions>) {
  if (options.javascript) {
    return false;
  }

  if (options.typescript || options.quickstart) {
    return true;
  }

  const { useTypescript } = await inquirer.prompt([
    {
      type: 'confirm',
      name: 'useTypescript',
      message: 'Do you want to use Typescript ?',
      default: true,
    },
  ]);

  return useTypescript;
}

const namePrompt = async (options: Partial<NewOptions>) => {
  const answers = await inquirer.prompt<Answers>(
    [
      {
        type: 'input',
        default: 'my-strapi-project',
        name: 'directory',
        message: 'What is the name of your project?',
      },
    ],
    {
      directory: options.directory,
    }
  );

  return answers;
};

export const generateNewApp = async (options: Partial<NewOptions>) => {
  sentry.init({
    dsn: 'https://841d2b2c9b4d4b43a4cde92794cb705a@sentry.io/1762059',
  });

  checkRequirements();

  const answers = await namePrompt(options);

  const rootPath = await checkInstallPath(answers.directory);

  const tmpPath = join(os.tmpdir(), `strapi${crypto.randomBytes(6).toString('hex')}`);

  const scope: Scope = {
    rootPath,
    name: basename(rootPath),
    // disable quickstart run app after creation
    runApp: (options.run || options.quickstart) ?? false,
    // use pacakge version as strapiVersion (all packages have the same version);
    strapiVersion: packageJson.version,
    quick: options.quickstart,
    template: options.template,
    packageJsonStrapi: {
      template: options.template,
      starter: options.starter,
    },
    uuid: (process.env.STRAPI_UUID_PREFIX || '') + crypto.randomUUID(),
    docker: process.env.DOCKER === 'true',
    deviceId: machineID(),
    tmpPath,
    packageManager: getPackageManager(options),
    installDependencies: true,
    devDependencies: {},
    dependencies: {
      '@strapi/strapi': packageJson.version,
      // '@strapi/plugin-users-permissions': packageJson.version,
      '@strapi/plugin-cloud': packageJson.version,
      // third party
      react: '^18',
      'react-dom': '^18',
      'react-router-dom': '^6',
      'styled-components': '^5.3',
    },
    useTypescript: await promptTypescript(options),
  };

  if (scope.useTypescript) {
    scope.devDependencies = {
      ...scope.devDependencies,
      typescript: '^5',
      '@types/node': '^20',
      '@types/react': '^18',
      '@types/react-dom': '^18',
    };
  }

  sentry.configureScope(function configureScope(sentryScope) {
    const tags = {
      os: os.type(),
      osPlatform: os.platform(),
      osArch: os.arch(),
      osRelease: os.release(),
      version: scope.strapiVersion,
      nodeVersion: process.versions.node,
      docker: scope.docker,
    };

    (Object.keys(tags) as Array<keyof typeof tags>).forEach((tag) => {
      sentryScope.setTag(tag, tags[tag]);
    });
  });

  initCancelCatcher();

  try {
    await trackUsage({ event: 'willCreateProject', scope });

    const scopeExtension = await parseDatabaseArguments(options);
    merge(scope, scopeExtension);

    // create a project with full list of questions
    return await createProject(scope);
  } catch (error) {
    if (!(error instanceof Error)) {
      throw error;
    }

    return captureException(error).then(() => {
      return trackError({ scope, error }).then(() => {
        process.exit(1);
      });
    });
  }
};

function initCancelCatcher() {
  // Create interface for windows user to let them quit the program.
  if (process.platform === 'win32') {
    const rl = readline.createInterface({
      input: process.stdin,
      output: process.stdout,
    });

    rl.on('SIGINT', function sigint() {
      process.emit('SIGINT');
    });
  }

  process.on('SIGINT', () => {
    process.exit(1);
  });
}
