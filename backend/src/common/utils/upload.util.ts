import fs from 'node:fs';
import path from 'node:path';
import { BadRequestException } from '@nestjs/common';
import { fileTypeFromFile } from 'file-type';
import { diskStorage } from 'multer';

export const MAX_UPLOAD_SIZE_BYTES = 5 * 1024 * 1024;

export function getPublicUploadDirectory() {
  return path.resolve(process.env.UPLOAD_DIR ?? './uploads', 'public');
}

export function getPrivateUploadDirectory() {
  return path.resolve(process.env.UPLOAD_DIR ?? './uploads', 'private');
}

export function ensureUploadDirectories() {
  fs.mkdirSync(getPublicUploadDirectory(), { recursive: true });
  fs.mkdirSync(getPrivateUploadDirectory(), { recursive: true });
}

export async function validateStoredUpload(file: Express.Multer.File, allowedMimeTypes: string[]) {
  const detected = await fileTypeFromFile(file.path);
  if (!detected || !allowedMimeTypes.includes(detected.mime)) {
    await fs.promises.unlink(file.path).catch(() => undefined);
    throw new BadRequestException('The uploaded file content does not match an allowed file type.');
  }

  return file.filename;
}

export async function removeStoredUpload(file?: Express.Multer.File) {
  if (file) {
    await fs.promises.unlink(file.path).catch(() => undefined);
  }
}

const filename = (file: Express.Multer.File) => {
  const safeBase = file.originalname.replace(/\.[^/.]+$/, '').replace(/[^a-zA-Z0-9-_]+/g, '-');
  const extensionByMimeType: Record<string, string> = {
    'image/jpeg': '.jpg',
    'image/png': '.png',
    'application/pdf': '.pdf',
  };
  const extension = extensionByMimeType[file.mimetype] ?? '.bin';
  return `${Date.now()}-${safeBase}${extension}`;
};

export const multerStorage = diskStorage({
  destination: (_req, _file, callback) => {
    ensureUploadDirectories();
    callback(null, getPublicUploadDirectory());
  },
  filename: (_req, file, callback) => {
    callback(null, filename(file));
  },
});

export const claimFileStorage = diskStorage({
  destination: (_req, _file, callback) => {
    ensureUploadDirectories();
    callback(null, getPrivateUploadDirectory());
  },
  filename: (_req, file, callback) => {
    callback(null, filename(file));
  },
});

export const imageFileFilter = (_req: unknown, file: Express.Multer.File, callback: (error: Error | null, acceptFile: boolean) => void) => {
  if (!['image/jpeg', 'image/png'].includes(file.mimetype)) {
    callback(new BadRequestException('Only PNG and JPEG images are allowed for item uploads.'), false);
    return;
  }

  callback(null, true);
};

export const claimFileFilter = (_req: unknown, file: Express.Multer.File, callback: (error: Error | null, acceptFile: boolean) => void) => {
  if (!['image/jpeg', 'image/png', 'application/pdf'].includes(file.mimetype)) {
    callback(new BadRequestException('Claim attachments must be PNG, JPEG, or PDF files.'), false);
    return;
  }

  callback(null, true);
};
