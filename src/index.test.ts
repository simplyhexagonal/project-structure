import {
  ensureDirSync,
  copyFileSync,
  copySync,
} from 'fs-extra';
import MonoContext from '@simplyhexagonal/mono-context';
import Logger from '@simplyhexagonal/logger';

import projectStructure from './fixtures/project-structure.json';

import { processDirectoryStructure } from './';
import { DirectoryStructure, ContentSource } from './interfaces';

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

  it('creates a single /empty-dir inside /testfiles', async () => {
    // ARRANGE
    const emptyDirStructure = projectStructure.directoryStructure.filter((directory) => directory["name"] === "empty-dir") as DirectoryStructure
    // const emptyDirStructure = projectStructure.directoryStructure.filter((directory) => directory["directories"] === undefined || directory["directories"] === []) as DirectoryStructure
    
    // ACT
    const result = await processDirectoryStructure(
      {
        rootWorkingDirectory: './testfiles',
        directoryStructure: emptyDirStructure,
      }
    );
    
    // ASSERT
    console.log(result);
    expect(result[0].success).toBe(true);
  });
  
  it('creates /testfiles/content-dir/content-from-ftp and downloads its content', async () => {
    // ARRANGE
    const contentDirStructure = projectStructure.directoryStructure.filter((directory) => directory["name"] === "content-dir") as DirectoryStructure
    const contentFromFTPDirStructure = contentDirStructure[0]["directories"]!.filter((subdirectory) => subdirectory["name"] === "content-from-ftp") as DirectoryStructure    
    const contentSources = contentFromFTPDirStructure[0]["contentSources"]![0] as ContentSource

    // ACT
    const result = await processDirectoryStructure(
      {
        rootWorkingDirectory: './testfiles/content-dir',
        directoryStructure: contentFromFTPDirStructure,
      }
    );
      
    // ASSERT
    console.log(result);
    result.map(item => expect(item.success).toBe(true));
    expect(contentSources["sourceType"]).toBe("ftp")
  });
});
