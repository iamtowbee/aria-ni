// src/models/ModelDownloader.js
// Download GGUF model files from HuggingFace

import * as FileSystem from 'expo-file-system';
import AsyncStorage from '@react-native-async-storage/async-storage';

const MODELS = {
  'tinyllama-1.1b': {
    repo: 'TheBloke/TinyLlama-1.1B-Chat-v1.0-GGUF',
    filename: 'tinyllama-1.1b-chat-v1.0.Q4_0.gguf',
    size: 637 * 1024 * 1024, // ~637 MB
  },
  'phi-2': {
    repo: 'TheBloke/phi-2-GGUF',
    filename: 'phi-2.Q4_K_M.gguf',
    size: 1.6 * 1024 * 1024 * 1024, // ~1.6 GB
  },
};

export class ModelDownloader {
  constructor() {
    this.baseDir = `${FileSystem.documentDirectory}models/`;
    this.activeDownload = null;
  }

  /**
   * Download a model if not already present.
   */
  async download(modelId, onProgress = null) {
    const config = MODELS[modelId];
    if (!config) {
      throw new Error(`Unknown model: ${modelId}`);
    }

    // Create directory
    await FileSystem.makeDirectoryAsync(this.baseDir, { intermediates: true })
      .catch(() => {});

    const localPath = `${this.baseDir}${config.filename}`;

    // Check if already downloaded
    const exists = await FileSystem.getInfoAsync(localPath);
    if (exists.exists && exists.size === config.size) {
      console.log('[ModelDownloader] Model already exists:', localPath);
      return localPath;
    }

    // Download from HuggingFace
    const url = `https://huggingface.co/${config.repo}/resolve/main/${config.filename}`;
    console.log('[ModelDownloader] Downloading:', url);

    try {
      this.activeDownload = FileSystem.createDownloadResumable(
        url,
        localPath,
        {},
        (progress) => {
          const { totalBytesWritten, totalBytesExpectedToWrite } = progress;
          const percent = (totalBytesWritten / totalBytesExpectedToWrite) * 100;
          if (onProgress) {
            onProgress({
              percent,
              downloaded: totalBytesWritten,
              total: totalBytesExpectedToWrite,
            });
          }
        }
      );

      const result = await this.activeDownload.downloadAsync();
      this.activeDownload = null;

      if (!result || !result.uri) {
        throw new Error('Download failed');
      }

      console.log('[ModelDownloader] Download complete:', result.uri);
      await AsyncStorage.setItem(`@model_downloaded_${modelId}`, 'true');

      return result.uri;
    } catch (err) {
      this.activeDownload = null;
      console.error('[ModelDownloader] Error:', err);
      throw new Error(`Failed to download ${modelId}: ${err.message}`);
    }
  }

  async cancel() {
    if (this.activeDownload) {
      await this.activeDownload.cancelAsync();
      this.activeDownload = null;
    }
  }

  async isDownloaded(modelId) {
    const config = MODELS[modelId];
    if (!config) return false;

    const localPath = `${this.baseDir}${config.filename}`;
    const info = await FileSystem.getInfoAsync(localPath);
    return info.exists && info.size > 0;
  }

  getLocalPath(modelId) {
    const config = MODELS[modelId];
    return config ? `${this.baseDir}${config.filename}` : null;
  }

  async getAvailableModels() {
    const models = [];
    for (const [id, config] of Object.entries(MODELS)) {
      const downloaded = await this.isDownloaded(id);
      models.push({
        id,
        name: config.filename.replace('.gguf', ''),
        size: config.size,
        sizeFormatted: this._formatSize(config.size),
        downloaded,
        localPath: this.getLocalPath(id),
      });
    }
    return models;
  }

  _formatSize(bytes) {
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)} KB`;
    if (bytes < 1024 * 1024 * 1024) return `${(bytes / (1024 * 1024)).toFixed(0)} MB`;
    return `${(bytes / (1024 * 1024 * 1024)).toFixed(2)} GB`;
  }
}
