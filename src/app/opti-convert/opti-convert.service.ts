import { Injectable } from '@angular/core';
import { from, Observable, of } from 'rxjs';

export interface ConversionResult {
  success: boolean;
  outputPath?: string;
  fileName?: string;
  size?: number;
  error?: string;
}

export interface ImageMetadata {
  size: number;
  width: number;
  height: number;
  format: string;
}

export interface ConversionItem {
  id: string;
  file: File;
  name: string;
  originalSize: number;
  status: 'pending' | 'processing' | 'done' | 'error';
  convertedUrl?: string;
  convertedSize?: number;
}

declare global {
  interface Window {
    electronAPI: {
      convertImage: (data: { 
        filePath: string; 
        format: string; 
        quality: number;
        targetFolder?: string;
      }) => Promise<ConversionResult>;
      selectFolder: () => Promise<string | null>;
      getFilePath: (file: File) => string;
      openFolder: (path: string) => void;
    };
  }
}

@Injectable({
  providedIn: 'root',
})
export class OptiConvertService {
  
  getMetadata(file: File): Observable<ImageMetadata> {
    return of({
      size: file.size,
      width: 0,
      height: 0,
      format: file.type.split('/')[1] || 'unknown'
    });
  }

  convertImage(
    filePath: string, 
    format: 'webp' | 'avif', 
    quality: number, 
    targetFolder?: string
  ): Observable<ConversionResult> {
    if (window.electronAPI) {
      const conversionPromise = window.electronAPI.convertImage({
        filePath: filePath, 
        format: format,
        quality: quality,
        targetFolder: targetFolder
      });
      return from(conversionPromise);
    }

    return of({ success: false, error: 'Electron API not available' });
  }

  selectTargetFolder(): Observable<string | null> {
    if (window.electronAPI) {
      return from(window.electronAPI.selectFolder());
    }
    return of(null);
  }
}