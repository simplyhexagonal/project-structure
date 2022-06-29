import { resolve } from 'path';
import exec from '@simplyhexagonal/exec';
import MonoContext from '@simplyhexagonal/mono-context';

import {
  ContentSource,
  ContentSourceHandler,
  ContentSourceHandlerOptions,
} from '../interfaces';

export const tgzContentHandler: ContentSourceHandler = async (
  {
    currentWorkingDirectory,
    directoryDefinition,
    contentSource,
  }: ContentSourceHandlerOptions,
) => {
  const logger = MonoContext.getStateValue('logger') || console;

  let from;
  let to: string = '';

  try {
    const directoryPath = resolve(
      currentWorkingDirectory,
      directoryDefinition.name,
    );

    const {
      sourcePath,
    } = contentSource as ContentSource;

    if (directoryDefinition.flags?.includes('must-skip')) {
      const message = `skipped directory: ${directoryPath}`;

      logger.debug(message);

      return {
        success: true,
        message,
      };
    }

    from = sourcePath;

    if ((/\.\//).test(from)) {
      from = resolve(currentWorkingDirectory, from);
    }

    to = directoryPath.replace(/\/$/, '');

    const {
      execPromise,
    } = exec(
      `tar -xzf ${from} --directory ${to}`,
    );

    const {
      exitCode,
      stderrOutput,
      stdoutOutput,
    } = await execPromise;

    if (exitCode !== 0) {
      throw new Error(stderrOutput || stdoutOutput);
    }
  } catch (error) {
    logger.error(error);

    return {
      success: false,
      message: `failed to extract tar/gunzip content from ${from} to ${to}`,
    };
  }

  return {
    success: true,
    message: `extracted tar/gunzip content from ${from} to ${to}`,
  };
}
