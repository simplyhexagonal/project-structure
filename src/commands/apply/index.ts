import { resolve } from 'path';
import ora from 'ora';
import MonoContext from '@simplyhexagonal/mono-context';

import {
  CommandDefinition,
  DirectoryStructure,
  DirectoryStructureHandlerOptions,
} from '../../interfaces';

import { processDirectoryStructure } from '../..';
import Logger from '@simplyhexagonal/logger';

export const applyProjectStructure: CommandDefinition = {
  command: 'apply',
  description: 'Process the given project-structure.json file.',
  builder: (yargsInstance) => {
    yargsInstance.option('file', {
      describe: 'path to project-structure.json file',
      type: 'string',
      default: `${process.cwd()}/project-structure.json`,
    });
    yargsInstance.option('skip-optional', {
      describe: 'skip directories flagged with "is-optional"',
      type: 'boolean',
      default: false,
    });
    yargsInstance.option('skip-sensitive', {
      describe: 'skip directories flagged with "is-sensitive"',
      type: 'boolean',
      default: false,
    });
    yargsInstance.option('results-json', {
      describe: 'output results as JSON to stdout',
      type: 'boolean',
      default: false,
    });
  },
  handler: async (yargsArguments) => {
    const {
      file,
      skipOptional,
      skipSensitive,
      resultsJson
    } = yargsArguments;

    if (resultsJson) {
      MonoContext.resetState();
      MonoContext.setState(
        {
          logger: new Logger(
            {
              logLevel: 'fatal',
              singleton: false,
            }
          ),
        }
      );
    }

    const logger = MonoContext.getStateValue('logger') || console;

    const spinner = ora(
      {
        text: 'Creating directories and fetching content...',
        color: 'green',
      },
    ).start();

    const oraInterval = setInterval(
      () => {
        spinner.text = MonoContext.getStateValue('currently');
        spinner.color = 'green';
      },
      250,
    );

    const recursionFlags: DirectoryStructureHandlerOptions['recursionFlags'] = [];

    if (skipOptional) {
      recursionFlags.push('skip-optional');
    }

    if (skipSensitive) {
      recursionFlags.push('skip-sensitive');
    }

    const results = await processDirectoryStructure(
      {
        rootWorkingDirectory: process.cwd(),
        directoryStructure: require(resolve(file)).directoryStructure as DirectoryStructure,
        recursionFlags,
      }
    );

    clearInterval(oraInterval);

    spinner.stop();

    if (resultsJson) {
      await logger.raw(results);
    } else {
      await logger.info('Successfully applied project structure!');
    }

    process.exit(0);
  },
};
