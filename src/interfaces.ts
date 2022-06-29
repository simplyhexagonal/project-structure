import yargs from 'yargs';

export enum ContentSourceEnum {
  DIRECTORY = 'directory', // exec (rsync)
  SYMLINK = 'symlink', // exec (ln -s)
  FTP = 'ftp', // promise-ftp
  GIT = 'git', // exec (git)
  S3 = 's3', // exec (aws s3)
  TAR = 'tar', // exec (tar)
  TGZ = 'tgz', // exec (tar -z)
  ZIP = 'zip', // exec (unzip)
  CUSTOM = 'custom',
}

export interface ContentSourceHandlerResult {
  success: boolean;
  message: string;
  error?: any;
}

export interface ContentSource {
  sourcePath: string;
  sourceType: ContentSourceEnum;
  customHandlerPath?: string;
}

export interface ContentSourceHandlerOptions {
  currentWorkingDirectory: string;
  directoryDefinition: DirectoryDefinition;
  contentSource?: ContentSource;
}

export type ContentSourceHandler = (contentSourceHandlerOptions: ContentSourceHandlerOptions) => Promise<ContentSourceHandlerResult>;

export type DirectoryFlags = 'must-store' | 'must-skip' | 'is-optional' | 'is-sensitive';

export interface DirectoryDefinition {
  name: string;
  flags?: DirectoryFlags[];
  customFlags?: string[];
  directories?: DirectoryDefinition[];
  contentSources?: ContentSource[];
}

export type DirectoryStructure = DirectoryDefinition[];

export interface DirectoryHandlerOptions {
  currentWorkingDirectory: string;
  directoryDefinition: DirectoryDefinition;
}

export interface DirectoryHandlerResult {
  success: boolean;
  message: string;
  error?: any;
}

export type DirectoryHandler = (directoryHandlerOptions: DirectoryHandlerOptions) => Promise<DirectoryHandlerResult>;

export interface DirectoryStructureHandlerOptions {
  rootWorkingDirectory: string;
  directoryStructure: DirectoryStructure;
  recursionFlags?: ('skip-sensitive' | 'skip-optional')[];
}

export type DirectoryStructureHandler = (directoryHandlerOptions: DirectoryStructureHandlerOptions) => Promise<DirectoryHandlerResult[]>;

export interface CommandDefinition<T = any> {
  command: string | string[];
  description: string;
  builder?: (yargsInstance: yargs.Argv<T>) => void;
  handler: (yargsArguments: yargs.Arguments<T>) => void | Promise<void>;
};
