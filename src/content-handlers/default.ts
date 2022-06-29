import { resolve } from 'path';
import { ensureDirSync, writeFileSync } from 'fs-extra';
import MonoContext from '@simplyhexagonal/mono-context';

import { ContentSourceHandler, ContentSourceHandlerOptions } from '../interfaces';

export const defaultContentHandler: ContentSourceHandler = async (
  {
    currentWorkingDirectory,
    directoryDefinition,
  }: ContentSourceHandlerOptions,
) => {
  const logger = MonoContext.getStateValue('logger') || console;

  const directoryPath = resolve(
    currentWorkingDirectory,
    directoryDefinition.name,
  );

  if (directoryDefinition.flags?.includes('must-skip')) {
    const message = `skipped directory: ${directoryPath}`;

    logger.debug(message);

    return {
      success: true,
      message,
    };
  }

  try {
    ensureDirSync(
      directoryPath,
    );

    if (directoryDefinition.flags?.includes('must-store')) {
      writeFileSync(
        resolve(
          directoryPath,
          '.keep',
        ),
        '',
      );
    }
  } catch (error) {
    logger.error(error);

    return {
      success: false,
      message: `failed to create directory: ${directoryPath}\n\n${error}`,
    };
  }

  return {
    success: true,
    message: `created directory: ${directoryPath}`,
  };
}
