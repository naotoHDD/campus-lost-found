import { mkdtemp, rm, writeFile } from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import { jest } from '@jest/globals';
import { BadRequestException } from '@nestjs/common';
import { claimFileFilter, getPrivateUploadDirectory, getPublicUploadDirectory, imageFileFilter, MAX_UPLOAD_SIZE_BYTES, validateStoredUpload } from './upload.util.js';

describe('validateStoredUpload', () => {
  let directory: string;

  beforeEach(async () => {
    directory = await mkdtemp(path.join(os.tmpdir(), 'lost-found-upload-'));
  });

  afterEach(async () => {
    await rm(directory, { recursive: true, force: true });
  });

  it('accepts file contents whose signature matches an allowed type', async () => {
    const filePath = path.join(directory, 'valid.pdf');
    await writeFile(filePath, Buffer.from('%PDF-1.7\n'));

    await expect(validateStoredUpload({ path: filePath, filename: 'valid.pdf' } as Express.Multer.File, ['application/pdf']))
      .resolves.toBe('valid.pdf');
  });

  it('rejects and removes content whose signature is not allowed', async () => {
    const filePath = path.join(directory, 'spoofed.png');
    await writeFile(filePath, Buffer.from('not an image'));

    await expect(validateStoredUpload({ path: filePath, filename: 'spoofed.png' } as Express.Multer.File, ['image/png']))
      .rejects.toBeInstanceOf(BadRequestException);
    await expect(rm(filePath)).rejects.toMatchObject({ code: 'ENOENT' });
  });
});

describe('imageFileFilter', () => {
  it.each(['image/jpeg', 'image/png'])('accepts %s item photos', (mimetype) => {
    const callback = jest.fn();

    imageFileFilter(undefined, { mimetype } as Express.Multer.File, callback);

    expect(callback).toHaveBeenCalledWith(null, true);
  });

  it('rejects unsupported image formats', () => {
    const callback = jest.fn();

    imageFileFilter(undefined, { mimetype: 'image/svg+xml' } as Express.Multer.File, callback);

    expect(callback).toHaveBeenCalledWith(expect.any(Error), false);
  });

  it('sets a 5 MiB upload limit', () => {
    expect(MAX_UPLOAD_SIZE_BYTES).toBe(5 * 1024 * 1024);
  });

  it('resolves public and private directories from UPLOAD_DIR at runtime', () => {
    const previousUploadDir = process.env.UPLOAD_DIR;
    process.env.UPLOAD_DIR = 'test-storage';

    expect(getPublicUploadDirectory()).toContain('test-storage');
    expect(getPublicUploadDirectory()).toContain('public');
    expect(getPrivateUploadDirectory()).toContain('test-storage');
    expect(getPrivateUploadDirectory()).toContain('private');

    if (previousUploadDir === undefined) {
      delete process.env.UPLOAD_DIR;
    } else {
      process.env.UPLOAD_DIR = previousUploadDir;
    }
  });
});

describe('claimFileFilter', () => {
  it.each(['image/jpeg', 'image/png', 'application/pdf'])('accepts %s attachments', (mimetype) => {
    const callback = jest.fn();

    claimFileFilter(undefined, { mimetype } as Express.Multer.File, callback);

    expect(callback).toHaveBeenCalledWith(null, true);
  });

  it('rejects unsupported attachment types', () => {
    const callback = jest.fn();

    claimFileFilter(undefined, { mimetype: 'text/html' } as Express.Multer.File, callback);

    expect(callback).toHaveBeenCalledWith(expect.any(Error), false);
  });
});