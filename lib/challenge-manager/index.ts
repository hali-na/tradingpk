// 挑战管理模块统一导出

export * from './types';
export { ChallengeManagerImpl } from './ChallengeManager';
export { ChallengeValidatorImpl } from './ChallengeValidator';

import { ChallengeManagerImpl } from './ChallengeManager';

export function createChallengeManager() {
  return new ChallengeManagerImpl();
}
