import { resolve } from 'path';
import { hideBin } from 'yargs/helpers';
import MonoContext from '@simplyhexagonal/mono-context';import yargs from 'yargs';
import Logger from '@simplyhexagonal/logger';

import { commands } from './commands';

import { version } from '../package.json';

import {
  defaultContentHandler,
  directoryContentHandler,
  symlinkContentHandler,
  ftpContentHandler,
  gitContentHandler,
  s3ContentHandler,
  tarContentHandler,
  tgzContentHandler,
  zipContentHandler,
  customContentHandler,
} from './content-handlers';

import {
  ContentSourceEnum,
  ContentSourceHandlerResult,
  DirectoryHandlerOptions,
  DirectoryHandlerResult,
  DirectoryStructure,
  DirectoryStructureHandler,
  DirectoryStructureHandlerOptions,
} from './interfaces';

export const ContentSources = {...ContentSourceEnum};

const contentHandlers = {
  [`${ContentSources.DIRECTORY}`]: directoryContentHandler,
  [`${ContentSources.SYMLINK}`]: symlinkContentHandler,
  [`${ContentSources.FTP}`]: ftpContentHandler,
  [`${ContentSources.GIT}`]: gitContentHandler,
  [`${ContentSources.S3}`]: s3ContentHandler,
  [`${ContentSources.TAR}`]: tarContentHandler,
  [`${ContentSources.TGZ}`]: tgzContentHandler,
  [`${ContentSources.ZIP}`]: zipContentHandler,
  [`${ContentSources.CUSTOM}`]: customContentHandler,
};

// Flatten the directory structure into a flat array of directory definitions
export const structureToDirectoryHandlerOptions = (
  currentWorkingDirectory: string,
  directoryStructure: DirectoryStructure,
  recursionFlags: DirectoryStructureHandlerOptions['recursionFlags'] = [],
) => {
  const logger = MonoContext.getStateValue('logger') || console;

  const processQueue: DirectoryHandlerOptions[] = [];

  directoryStructure.forEach(
    (directoryDefinition) => {
      const { flags } = directoryDefinition;

      if (
        !(recursionFlags.includes('skip-sensitive') && flags && flags.includes('is-sensitive')) &&
        !(recursionFlags.includes('skip-optional') && flags && flags.includes('is-optional')) &&
        !(flags && flags.includes('must-skip'))
      ) {
        processQueue.push(
          {
            currentWorkingDirectory: resolve(currentWorkingDirectory),
            directoryDefinition,
          }
        );

        if (directoryDefinition.directories) {
          processQueue.push(
            ...structureToDirectoryHandlerOptions(
              resolve(currentWorkingDirectory, directoryDefinition.name),
              directoryDefinition.directories,
            )
          );
        }
      } else {
        logger.debug(`skipped directory: ${directoryDefinition.name}`);
      }
    }
  );

  return processQueue;
};

// Recursively process the directory structure
export const processDirectoryStructure: DirectoryStructureHandler = async (
  {
    rootWorkingDirectory,
    directoryStructure,
    recursionFlags,
  }
) => {
  const logger = MonoContext.getStateValue('logger') || console;

  const structureOptions = structureToDirectoryHandlerOptions(
    rootWorkingDirectory,
    directoryStructure,
    recursionFlags,
  );

  // For every directory in the structure
  return await structureOptions.reduce(
    async (a, b) => {
      const results = await a;

      const {
        currentWorkingDirectory,
        directoryDefinition
      } = b;

      const destinationPath = resolve(currentWorkingDirectory, directoryDefinition.name);

      logger.debug(`creating directory: ${destinationPath}`);

      MonoContext.setState(
        {
          currently: `Creating: ${directoryDefinition.name}`,
        }
      );

      // Run the default handler to create the directory
      results.push(await await defaultContentHandler(b));

      const {
        contentSources
      } = directoryDefinition;

      // If directory definition has content sources
      if (contentSources && contentSources.length > 0) {
        await contentSources.reduce(
          async (a, contentSource) => {
            await a;

            logger.debug(`content source defined:\n\n\ttype: ${contentSource.sourceType}\n\tsource: ${contentSource.sourcePath}\n\tdestination: ${destinationPath}`);

            MonoContext.setState(
              {
                currently: `Fetching from ${contentSource.sourceType}: ${contentSource.sourcePath}`,
              }
            );

            // Run the appropriate content handler(s) for the directory
            const contentHandler = contentHandlers[contentSource.sourceType];
            results.push(
              await contentHandler({
                currentWorkingDirectory,
                directoryDefinition,
                contentSource,
              })
            );

            return Promise.resolve(results);
          },
          Promise.resolve(results) as Promise<ContentSourceHandlerResult[]>,
        );
      }

      return Promise.resolve(results);
    },
    Promise.resolve([]) as Promise<DirectoryHandlerResult[]>,
  );
};

export const main = () => {
  MonoContext.setState(
    {
      logger: new Logger(
        {
          logLevel: (process.argv.includes('--verbose')) ? 'debug' : 'info',
        }
      ),
    }
  );

  const yargsInstance = yargs(hideBin(process.argv));

  yargsInstance.option('verbose', {
    describe: 'show debug logs',
    type: 'boolean',
    default: false,
  });

  yargsInstance.version(false).alias('help', 'h');

  commands.forEach(
    (command) => {
      yargsInstance.command(
        command.command,
        command.description,
        command.builder || (() => {}),
        command.handler
      );
    }
  );

  yargsInstance.parse();

  const argv: any = yargsInstance.argv;

  if (argv.version || argv.v) {
    console.log(version);
  }
}
