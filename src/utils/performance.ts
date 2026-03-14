// src/utils/performance.ts
/**
 * Performance Optimization Utilities
 */

import React, { useCallback, useEffect, useMemo, useRef } from 'react';

// ==================== DEBOUNCE ====================

export function debounce<T extends (...args: any[]) => any>(
  func: T,
  wait: number
): (...args: Parameters<T>) => void {
  let timeout: NodeJS.Timeout | null = null;
  
  return (...args: Parameters<T>) => {
    if (timeout) clearTimeout(timeout);
    timeout = setTimeout(() => func(...args), wait);
  };
}

export function useDebounce<T>(value: T, delay: number): T {
  const [debouncedValue, setDebouncedValue] = React.useState(value);

  useEffect(() => {
    const handler = setTimeout(() => setDebouncedValue(value), delay);
    return () => clearTimeout(handler);
  }, [value, delay]);

  return debouncedValue;
}

// ==================== THROTTLE ====================

export function throttle<T extends (...args: any[]) => any>(
  func: T,
  limit: number
): (...args: Parameters<T>) => void {
  let inThrottle: boolean;
  
  return (...args: Parameters<T>) => {
    if (!inThrottle) {
      func(...args);
      inThrottle = true;
      setTimeout(() => (inThrottle = false), limit);
    }
  };
}

// ==================== MEMOIZATION ====================

export function memoize<T extends (...args: any[]) => any>(
  func: T,
  keyGenerator?: (...args: Parameters<T>) => string
): T {
  const cache = new Map<string, ReturnType<T>>();
  
  return ((...args: Parameters<T>) => {
    const key = keyGenerator ? keyGenerator(...args) : JSON.stringify(args);
    
    if (cache.has(key)) {
      return cache.get(key)!;
    }
    
    const result = func(...args);
    cache.set(key, result);
    return result;
  }) as T;
}

// ==================== LAZY INITIALIZATION ====================

export function useLazyInitialize<T>(initializer: () => T): T {
  const ref = useRef<T | null>(null);
  
  if (ref.current === null) {
    ref.current = initializer();
  }
  
  return ref.current;
}

// ==================== MEMORY MANAGEMENT ====================

export class MemoryManager {
  private cache = new WeakMap<object, any>();
  private gcInterval: NodeJS.Timeout | null = null;

  constructor(private gcIntervalMs: number = 60000) {
    this.startGC();
  }

  set(key: object, value: any): void {
    this.cache.set(key, value);
  }

  get(key: object): any {
    return this.cache.get(key);
  }

  private startGC(): void {
    this.gcInterval = setInterval(() => {
      // WeakMap auto-GCs, this is just for logging
      if (__DEV__) {
        console.log('[MemoryManager] Garbage collection cycle');
      }
    }, this.gcIntervalMs);
  }

  dispose(): void {
    if (this.gcInterval) {
      clearInterval(this.gcInterval);
    }
  }
}

// ==================== BUNDLE SIZE OPTIMIZATION ====================

export const lazyImport = <T extends React.ComponentType<any>>(
  factory: () => Promise<{ default: T }>
) => React.lazy(factory);

// ==================== PERFORMANCE MONITORING ====================

export class PerformanceMonitor {
  private marks = new Map<string, number>();
  private measures = new Map<string, number>();

  mark(name: string): void {
    this.marks.set(name, Date.now());
  }

  measure(name: string, startMark: string, endMark?: string): number {
    const start = this.marks.get(startMark);
    const end = endMark ? this.marks.get(endMark) : Date.now();
    
    if (!start) {
      console.warn(`[PerformanceMonitor] Start mark "${startMark}" not found`);
      return 0;
    }
    
    const duration = (end || Date.now()) - start;
    this.measures.set(name, duration);
    
    if (__DEV__) {
      console.log(`[Performance] ${name}: ${duration}ms`);
    }
    
    return duration;
  }

  getMeasure(name: string): number | undefined {
    return this.measures.get(name);
  }

  clear(): void {
    this.marks.clear();
    this.measures.clear();
  }
}

export const performanceMonitor = new PerformanceMonitor();

// ==================== HOOKS ====================

export function useAnimationFrame(callback: (deltaTime: number) => void): void {
  const requestRef = useRef<number>();
  const previousTimeRef = useRef<number>();

  const animate = useCallback((time: number) => {
    if (previousTimeRef.current !== undefined) {
      const deltaTime = time - previousTimeRef.current;
      callback(deltaTime);
    }
    previousTimeRef.current = time;
    requestRef.current = requestAnimationFrame(animate);
  }, [callback]);

  useEffect(() => {
    requestRef.current = requestAnimationFrame(animate);
    return () => {
      if (requestRef.current) {
        cancelAnimationFrame(requestRef.current);
      }
    };
  }, [animate]);
}

export function useIntersectionObserver(
  ref: React.RefObject<Element>,
  options?: IntersectionObserverInit
): boolean {
  const [isIntersecting, setIsIntersecting] = React.useState(false);

  useEffect(() => {
    if (!ref.current) return;

    const observer = new IntersectionObserver(([entry]) => {
      setIsIntersecting(entry.isIntersecting);
    }, options);

    observer.observe(ref.current);

    return () => observer.disconnect();
  }, [ref, options]);

  return isIntersecting;
}

// ==================== EXPORTS ====================
