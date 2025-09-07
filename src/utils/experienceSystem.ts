/**
 * 经验值系统工具函数
 */

/**
 * 计算升到指定等级所需的经验值
 * 公式: exp(level) = 200 * level - 100
 * @param level 目标等级
 * @returns 升到该等级所需的总经验值
 */
export const getRequiredExpForLevel = (level: number): number => {
  if (level <= 1) return 0;
  return 200 * level - 100;
};

/**
 * 计算当前等级下一级所需的经验值
 * @param currentLevel 当前等级
 * @returns 升到下一级需要的经验值
 */
export const getExpToNextLevel = (currentLevel: number): number => {
  return getRequiredExpForLevel(currentLevel + 1);
};

/**
 * 计算当前等级范围内的经验值进度
 * @param currentLevel 当前等级
 * @param currentExp 当前总经验值
 * @returns 当前等级的经验进度信息
 */
export const getLevelProgress = (currentLevel: number, currentExp: number) => {
  const currentLevelExp = getRequiredExpForLevel(currentLevel);
  const nextLevelExp = getRequiredExpForLevel(currentLevel + 1);
  const expInCurrentLevel = currentExp - currentLevelExp;
  const expNeededForNextLevel = nextLevelExp - currentLevelExp;
  const progressPercentage = Math.min(100, (expInCurrentLevel / expNeededForNextLevel) * 100);

  return {
    currentLevelExp,
    nextLevelExp,
    expInCurrentLevel,
    expNeededForNextLevel,
    expToNext: nextLevelExp - currentExp,
    progressPercentage
  };
};

/**
 * 根据总经验值计算当前等级
 * @param totalExp 总经验值
 * @returns 当前等级
 */
export const calculateLevelFromExp = (totalExp: number): number => {
  if (totalExp <= 0) return 1;
  
  let level = 1;
  while (getRequiredExpForLevel(level + 1) <= totalExp) {
    level++;
  }
  return level;
};

/**
 * 添加经验值并检查是否升级
 * @param currentLevel 当前等级
 * @param currentExp 当前经验值
 * @param addExp 要添加的经验值
 * @returns 升级结果信息
 */
export const addExperience = (currentLevel: number, currentExp: number, addExp: number) => {
  const newExp = currentExp + addExp;
  const newLevel = calculateLevelFromExp(newExp);
  const leveledUp = newLevel > currentLevel;
  const levelsGained = newLevel - currentLevel;

  return {
    newExp,
    newLevel,
    leveledUp,
    levelsGained,
    expGained: addExp
  };
};
