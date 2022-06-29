import { CommandDefinition } from '../interfaces';

import { applyProjectStructure } from './apply';

export const commands = [
  applyProjectStructure
] as CommandDefinition<any>[];
