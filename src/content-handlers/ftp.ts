import { resolve as resolvePath, join as joinPath } from 'path';
import { ensureDirSync, createWriteStream } from 'fs-extra';
import { parse } from 'url';
import PromiseFtp from 'promise-ftp';
import MonoContext from '@simplyhexagonal/mono-context';

import {
  ContentSource,
  ContentSourceHandler,
  ContentSourceHandlerOptions,
} from '../interfaces';

export const downloadList = async (
  contentDirectoryPath: string,
  ftp: PromiseFtp,
  remoteContentRoot: string,
  remoteContentPath: string,
  list: PromiseFtp.ListingElement[],
) => {
  const logger = MonoContext.getStateValue('logger') || console;

  const files = list.filter(item => item.type !== 'd');
  const directories = list.filter(item => item.type === 'd');

  await files.reduce(
    async (a, file) => {
      await a;

      const remoteFilePath = joinPath(
        remoteContentPath,
        file.name,
      ).replace(/^\//, '');
      
      const localFilePath = resolvePath(
        contentDirectoryPath,
        remoteFilePath.slice(remoteContentRoot.length),
      );

      await ftp.get(remoteFilePath).then((stream) => {
        return new Promise((resolve, reject) => {
          stream.once('close', resolve);
          stream.once('error', reject);

          ensureDirSync(
            resolvePath(contentDirectoryPath, remoteContentPath.slice(remoteContentRoot.length).replace(/^\//, ''))
          );

          logger.debug(`saving file: ${localFilePath}`);

          stream.pipe(
            createWriteStream(localFilePath)
          );
        });
      });
    },
    Promise.resolve(),
  );

  await directories.reduce(
    async (a, directory) => {
      await a;

      const directoryPath = resolvePath(remoteContentPath, directory.name).replace(/^\//, '');

      await ftp.list(directoryPath).then((list) => {
        // logger.debug(list);

        return downloadList(
          contentDirectoryPath,
          ftp,
          remoteContentRoot,
          directoryPath,
          list as PromiseFtp.ListingElement[]
        );
      });

      return Promise.resolve();
    },
    Promise.resolve(),
  );
}

export const ftpContentHandler: ContentSourceHandler = async (
  {
    currentWorkingDirectory,
    directoryDefinition,
    contentSource,
  }: ContentSourceHandlerOptions,
) => {
  const logger = MonoContext.getStateValue('logger') || console;

  let sourcePath;
  let contentDirectoryPath: string = '';

  try {
    const ftp = new PromiseFtp();

    sourcePath = (contentSource as ContentSource).sourcePath;

    const {
      host,
      port,
      auth,
      pathname,
    } = parse(sourcePath);

    const user = (auth || 'anonymous').split(':')[0];
    const password = (auth || '').split(':')[1];

    const remoteContentPath = pathname || '/';

    contentDirectoryPath = resolvePath(
      currentWorkingDirectory,
      directoryDefinition.name,
    );

    if (directoryDefinition.flags?.includes('must-skip')) {
      const message = `skipped directory: ${contentDirectoryPath}`;

      logger.debug(message);

      return {
        success: true,
        message,
      };
    }

    await ftp.connect({
      host: host || 'localhost',
      port: parseInt(port || '21', 10),
      user,
      password,
    }).then((serverMessage) => {
      return ftp.list(remoteContentPath);
    }).then((list) => {
      // logger.debug(list);

      return downloadList(
        contentDirectoryPath,
        ftp,
        remoteContentPath,
        remoteContentPath,
        list as PromiseFtp.ListingElement[],
      );
    }).then(
      () => ftp.end()
    ).catch(
      (e) => {
        throw e;
      }
    );
  } catch (error) {
    logger.error(error);

    return {
      success: false,
      message: `failed to downloaded ftp content from ${sourcePath} to ${contentDirectoryPath}`,
    };
  }

  return {
    success: true,
    message: `downloaded ftp content from ${sourcePath} to ${contentDirectoryPath}`,
  };
}
