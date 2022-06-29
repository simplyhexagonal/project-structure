import { resolve } from 'path';
import exec from '@simplyhexagonal/exec';
import MonoContext from '@simplyhexagonal/mono-context';

import {
  ContentSource,
  ContentSourceHandler,
  ContentSourceHandlerOptions,
} from '../interfaces';

export const gitContentHandler: ContentSourceHandler = async (
  {
    currentWorkingDirectory,
    directoryDefinition,
    contentSource,
  }: ContentSourceHandlerOptions,
) => {
  const logger = MonoContext.getStateValue('logger') || console;

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

  const {
    execPromise,
  } = exec(
    `git clone ${sourcePath} ${directoryPath.replace(/([^\/])$/, '$1/')}`,
  );

  await execPromise;

  return {
    success: true,
    message: `cloned git content from ${sourcePath} to ${directoryPath}`,
  };
}
