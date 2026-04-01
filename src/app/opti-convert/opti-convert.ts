import {
  ChangeDetectionStrategy,
  Component,
  computed,
  effect,
  inject,
  signal,
  PLATFORM_ID,
} from '@angular/core';
import { CommonModule, isPlatformBrowser } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatIconModule } from '@angular/material/icon';
import { animate, stagger } from 'motion';
import { OptiConvertService, ConversionItem, ConversionResult } from './opti-convert.service';
import { firstValueFrom } from 'rxjs';

@Component({
  selector: 'app-opti-convert',
  standalone: true,
  imports: [CommonModule, FormsModule, MatIconModule],
  templateUrl: './opti-convert.html',
  styleUrl: './opti-convert.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class OptiConvertComponent {
  private service = inject(OptiConvertService);
  private platformId = inject(PLATFORM_ID);

  files = signal<ConversionItem[]>([]);
  quality = signal<number>(80);
  format = signal<'webp' | 'avif'>('webp');
  isDarkMode = signal<boolean>(true);
  isDragging = signal<boolean>(false);

  estimatedSizeFactor = computed(() => {
    const q = this.quality();
    const f = this.format();
    const base = f === 'avif' ? 0.15 : 0.2;
    return base * (q / 100);
  });

  totalOriginalSize = computed(() =>
    this.files().reduce((acc, f) => acc + f.originalSize, 0),
  );

  totalEstimatedSize = computed(() =>
    this.totalOriginalSize() * this.estimatedSizeFactor(),
  );

  constructor() {
    effect(() => {
      const dark = this.isDarkMode();
      if (isPlatformBrowser(this.platformId)) {
        if (dark) {
          document.documentElement.classList.add('dark');
        } else {
          document.documentElement.classList.remove('dark');
        }
      }
    });
  }

  toggleTheme(): void {
    this.isDarkMode.update((v) => !v);
  }

  onDragOver(event: DragEvent): void {
    event.preventDefault();
    event.stopPropagation();
    this.isDragging.set(true);
  }

  onDragLeave(event: DragEvent): void {
    event.preventDefault();
    event.stopPropagation();
    this.isDragging.set(false);
  }

  onDrop(event: DragEvent): void {
    event.preventDefault();
    event.stopPropagation();
    this.isDragging.set(false);

    const droppedFiles = event.dataTransfer?.files;
    if (droppedFiles) {
      this.handleFiles(Array.from(droppedFiles));
    }
  }

  onFileSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    if (input.files) {
      this.handleFiles(Array.from(input.files));
    }
  }

  private handleFiles(newFiles: File[]): void {
    const items: ConversionItem[] = newFiles
      .filter((f) => f.type.startsWith('image/') || f.name.endsWith('.svg'))
      .map((f) => {
        return {
          id: Math.random().toString(36).substring(7),
          file: f,
          name: f.name,
          originalSize: f.size,
          status: 'pending',
        };
      });

    this.files.update((current) => [...current, ...items]);
    this.animateList();
  }

  removeFile(id: string): void {
    this.files.update((current) => current.filter((f) => f.id !== id));
  }

  async convertAll(): Promise<void> {
    const currentFiles = this.files();
    const quality = this.quality();
    const format = this.format();
    
    const filesToProcess = currentFiles.filter(f => f.status !== 'done' && f.status !== 'processing');
    if (filesToProcess.length === 0) return;

    let targetFolder: string | null = null;

    if (filesToProcess.length > 1) {
      targetFolder = await window.electronAPI.selectFolder();
      if (!targetFolder) return;
    }

    for (const item of filesToProcess) {
      const filePath = window.electronAPI.getFilePath(item.file);

      if (!filePath) {
        console.error(`Missing system path for: ${item.name}`);
        this.updateItemStatus(item.id, 'error');
        continue;
      }

      this.updateItemStatus(item.id, 'processing');

      try {
        const result: ConversionResult = await firstValueFrom(
          this.service.convertImage(filePath, format, quality, targetFolder || undefined)
        );

        if (result && result.success) {
          this.updateItemStatus(
            item.id, 
            'done', 
            result.outputPath, 
            result.size
          );
        } else {
          const newStatus = result.error?.includes('cancelled') ? 'pending' : 'error';
          this.updateItemStatus(item.id, newStatus);
        }
      } catch (error) {
        console.error(`Processing error for ${item.name}:`, error);
        this.updateItemStatus(item.id, 'error');
      }
    }
  }

  private updateItemStatus(
    id: string,
    status: ConversionItem['status'],
    url?: string,
    size?: number,
  ): void {
    this.files.update((current) =>
      current.map((f) =>
        f.id === id
          ? { ...f, status, convertedUrl: url, convertedSize: size }
          : f,
      ),
    );
  }

  formatSize(bytes: number): string {
    if (!bytes || bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  }

  private animateList(): void {
    if (!isPlatformBrowser(this.platformId)) return;

    setTimeout(() => {
      const items = document.querySelectorAll('.file-item');
      if (items.length > 0) {
        animate(
          items,
          { opacity: [0, 1], y: [20, 0] },
          { delay: stagger(0.05), duration: 0.4 },
        );
      }
    }, 0);
  }
}