import { ContentSourceHandler, ContentSourceHandlerOptions } from '../interfaces';

export const customContentHandler: ContentSourceHandler = async (
  {
    currentWorkingDirectory,
    directoryDefinition,
  }: ContentSourceHandlerOptions,
) => {
  return {
    success: false,
    message: 'No content handler found for this directory.',
  };
}
