import {
  ensureDirSync,
  copyFileSync,
  copySync,
} from 'fs-extra';
import MonoContext from '@simplyhexagonal/mono-context';
import Logger from '@simplyhexagonal/logger';

import projectStructure from './fixtures/project-structure.json';

import { processDirectoryStructure } from './';
import { DirectoryStructure } from './interfaces';

beforeAll(() => {
  ensureDirSync('/tmp/make-dir-structure');
  copyFileSync('./package.json', '/tmp/make-dir-structure/package.json');
  copySync('./scripts', '/tmp/make-dir-structure/scripts');

  MonoContext.setState(
    {
      logger: new Logger({logLevel: 'debug'}),
    }
  );
});

describe('index', () => {
  it('should work', async () => {
    const result = await processDirectoryStructure(
      {
        rootWorkingDirectory: './testfiles',
        directoryStructure: projectStructure.directoryStructure as DirectoryStructure,
      }
    );

    console.log(result);

    expect(true).toBe(true);
  });
});
