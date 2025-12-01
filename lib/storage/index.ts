// 存储管理模块统一导出

import { StorageManager } from './types';
import { StorageManagerImpl } from './StorageManager';

// 导出工厂函数
export function createStorageManager(): StorageManager {
  return new StorageManagerImpl();
}

// 导出类型和常量
export * from './types';

