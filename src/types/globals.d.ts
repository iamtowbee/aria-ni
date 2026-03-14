// Global type augmentations
declare const __DEV__: boolean;

declare module '*.json';
declare module '*.png';
declare module '*.jpg';
declare module '*.jpeg';
declare module '*.svg';

// Relax types for legacy code
declare global {
  interface Window {
    storage?: any;
  }
}

export {};
