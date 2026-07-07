export interface UploadOptions {
  filename: string;
  mimeType: string;
  size: number;
  metadata?: Record<string, unknown>;
  allowedMimeTypes?: string[];
  maxSize?: number;
}

export interface UploadResult {
  id: string;
  path: string;
  url: string;
  size: number;
  mimeType: string;
  originalName: string;
  provider: string;
}

export interface DeleteResult {
  success: boolean;
  error?: string;
}

export interface StorageProvider {
  upload(buffer: Buffer, options: UploadOptions): Promise<UploadResult>;
  uploadStream(stream: NodeJS.ReadableStream, options: UploadOptions): Promise<UploadResult>;
  delete(path: string): Promise<DeleteResult>;
  getUrl(path: string): Promise<string>;
  exists(path: string): Promise<boolean>;
}

export class LocalStorageProvider implements StorageProvider {
  private basePath: string;
  private baseUrl: string;

  constructor(options: { basePath?: string; baseUrl?: string }) {
    this.basePath = options.basePath || './uploads';
    this.baseUrl = options.baseUrl || '/uploads';
  }

  async upload(buffer: Buffer, options: UploadOptions): Promise<UploadResult> {
    const fs = await import('fs/promises');
    const path = await import('path');

    const id = crypto.randomUUID();
    const ext = path.extname(options.filename);
    const relativePath = `${id}${ext}`;
    const fullPath = path.join(this.basePath, relativePath);

    await fs.mkdir(this.basePath, { recursive: true });
    await fs.writeFile(fullPath, buffer);

    return {
      id,
      path: relativePath,
      url: `${this.baseUrl}/${relativePath}`,
      size: buffer.length,
      mimeType: options.mimeType,
      originalName: options.filename,
      provider: 'local',
    };
  }

  async uploadStream(stream: NodeJS.ReadableStream, options: UploadOptions): Promise<UploadResult> {
    const chunks: Buffer[] = [];
    for await (const chunk of stream) {
      chunks.push(chunk as Buffer);
    }
    const buffer = Buffer.concat(chunks);
    return this.upload(buffer, options);
  }

  async delete(path: string): Promise<DeleteResult> {
    try {
      const fs = await import('fs/promises');
      const pathMod = await import('path');
      const fullPath = pathMod.join(this.basePath, path);
      await fs.unlink(fullPath);
      return { success: true };
    } catch (error) {
      return { success: false, error: error instanceof Error ? error.message : 'Delete failed' };
    }
  }

  async getUrl(path: string): Promise<string> {
    return `${this.baseUrl}/${path}`;
  }

  async exists(path: string): Promise<boolean> {
    try {
      const fs = await import('fs/promises');
      const pathMod = await import('path');
      const fullPath = pathMod.join(this.basePath, path);
      await fs.access(fullPath);
      return true;
    } catch {
      return false;
    }
  }
}

export function createStorageProvider(config: { provider: string; localPath: string }): StorageProvider {
  switch (config.provider) {
    case 'local':
      return new LocalStorageProvider({ basePath: config.localPath });
    default:
      return new LocalStorageProvider({ basePath: config.localPath });
  }
}
