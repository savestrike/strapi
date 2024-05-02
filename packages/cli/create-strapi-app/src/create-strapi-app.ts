import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import commander from 'commander';
import { generateNewApp, Options } from '@strapi/generate-new';
import type { Program } from './types';

const packageJson = JSON.parse(readFileSync(resolve(__dirname, '../package.json'), 'utf8'));

const command = new commander.Command(packageJson.name);

command
  .version(packageJson.version)
  .arguments('[directory]')
  .option('--quick, --quickstart', 'Quickstart app creation')
  .option('--run', 'Do not start the application after it is created')

  // setup options
  .option('--ts, --typescript', 'Initialize the project with TypeScript (default)')
  .option('--js, --javascript', 'Initialize the project with Javascript')

  // Package manager options
  .option('--use-npm', 'Use npm as the project package manager')
  .option('--use-yarn', 'Use yarn as the project package manager')
  .option('--use-pnpm', 'Use pnpm as the project package manager')

  // Database options
  .option('--dbclient <dbclient>', 'Database client')
  .option('--dbhost <dbhost>', 'Database host')
  .option('--dbport <dbport>', 'Database port')
  .option('--dbname <dbname>', 'Database name')
  .option('--dbusername <dbusername>', 'Database username')
  .option('--dbpassword <dbpassword>', 'Database password')
  .option('--dbssl <dbssl>', 'Database SSL')
  .option('--dbfile <dbfile>', 'Database file path for sqlite')

  // templates
  .option('--template <templateurl>', 'Specify a Strapi template')
  .description('create a new application')
  .action((directory, programArgs) => {
    initProject(directory, programArgs);
  })
  .parse(process.argv);

function generateApp(options: Partial<Options>) {
  return generateNewApp(options)
    .then(() => {
      if (process.platform === 'win32') {
        process.exit(0);
      }
    })
    .catch((error) => {
      console.error(`Error: ${error.message}`);
      process.exit(1);
    });
}

async function initProject(directory: string, programArgs: Program) {
  const programFlags = command
    .createHelp()
    .visibleOptions(command)
    .reduce<Array<string | undefined>>((acc, { short, long }) => [...acc, short, long], [])
    .filter(Boolean);

  if (programArgs.template && programFlags.includes(programArgs.template)) {
    console.error(`${programArgs.template} is not a valid template`);
    process.exit(1);
  }

  return generateApp({
    ...programArgs,
    directory,
  });
}
