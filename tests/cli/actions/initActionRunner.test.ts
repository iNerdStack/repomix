import * as fs from 'node:fs/promises';
import path from 'node:path';
import { expect, describe, it, vi, beforeEach, afterEach } from 'vitest';
import * as prompts from '@clack/prompts';
import { runInitAction } from '../../../src/cli/actions/initActionRunner.js';
import { logger } from '../../../src/shared/logger.js';

vi.mock('node:fs/promises');
vi.mock('@clack/prompts');

describe('initActionRunner', () => {
  beforeEach(() => {
    vi.resetAllMocks();
  });

  afterEach(() => {
    vi.resetAllMocks();
  });

  it('should create a new config file when one does not exist', async () => {
    vi.mocked(fs.access).mockRejectedValue(new Error('File does not exist'));
    vi.mocked(prompts.group).mockResolvedValue({
      outputFilePath: 'custom-output.txt',
      outputStyle: 'xml',
    });

    await runInitAction('/test/dir');

    const configPath = path.resolve('/test/dir/repopack.config.json');

    expect(fs.writeFile).toHaveBeenCalledWith(configPath, expect.stringContaining('"filePath": "custom-output.txt"'));
    expect(fs.writeFile).toHaveBeenCalledWith(configPath, expect.stringContaining('"style": "xml"'));
  });

  it('should not create a new config file when one already exists', async () => {
    vi.mocked(fs.access).mockResolvedValue(undefined);

    const loggerSpy = vi.spyOn(logger, 'warn').mockImplementation(vi.fn());
    await runInitAction('/test/dir');

    expect(fs.writeFile).not.toHaveBeenCalled();
    expect(loggerSpy).toHaveBeenCalledWith(expect.stringContaining('already exists'));
  });

  it('should handle user cancellation', async () => {
    vi.mocked(fs.access).mockRejectedValue(new Error('File does not exist'));
    vi.mocked(prompts.group).mockImplementation(() => {
      throw new Error('User cancelled');
    });

    const loggerSpy = vi.spyOn(logger, 'error').mockImplementation(vi.fn());

    await runInitAction('/test/dir');

    expect(fs.writeFile).not.toHaveBeenCalled();

    expect(loggerSpy).toHaveBeenCalledWith('Failed to create repopack.config.json:', new Error('User cancelled'));
  });

  it('should handle errors when writing the config file', async () => {
    vi.mocked(fs.access).mockRejectedValue(new Error('File does not exist'));
    vi.mocked(prompts.group).mockResolvedValue({
      outputFilePath: 'custom-output.txt',
      outputStyle: 'plain',
    });
    vi.mocked(fs.writeFile).mockRejectedValue(new Error('Write error'));

    await runInitAction('/test/dir');
  });
});