import { resolve } from 'path';
import exec from '@simplyhexagonal/exec';
import MonoContext from '@simplyhexagonal/mono-context';

import {
  ContentSource,
  ContentSourceHandler,
  ContentSourceHandlerOptions,
} from '../interfaces';

export const s3ContentHandler: ContentSourceHandler = async (
  {
    currentWorkingDirectory,
    directoryDefinition,
    contentSource,
  }: ContentSourceHandlerOptions,
) => {
  const logger = MonoContext.getStateValue('logger') || console;

  let sourcePath;
  let directoryPath: string = '';

  try {
    directoryPath = resolve(
      currentWorkingDirectory,
      directoryDefinition.name,
    );

    sourcePath = (contentSource as ContentSource).sourcePath;

    if (directoryDefinition.flags?.includes('must-skip')) {
      const message = `skipped directory: ${directoryPath}`;

      logger.debug(message);

      return {
        success: true,
        message,
      };
    }

    const {
      execPromise,
    } = exec(
      `aws s3 sync ${sourcePath.replace(/([^\/])$/, '$1/')} ${directoryPath.replace(/([^\/])$/, '$1/')}`,
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
      message: `failed to sync content from s3 bucket path ${sourcePath} to ${directoryPath}`,
    };
  }

  return {
    success: true,
    message: `sync content from s3 bucket path ${sourcePath} to ${directoryPath}`,
  };
}
