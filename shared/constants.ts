export const EXPENSE_CATEGORIES = {
  water: '水电',
  electricity: '电费',
  shared_item: '公用物品',
  meal: '聚餐',
  other: '其他',
} as const;

export const CONVENTION_TYPES = {
  rule: '规则',
  notice: '通知',
  reminder: '提醒',
  duty: '值日',
} as const;

export const DUTY_TYPES = {
  cleaning: '打扫卫生',
  garbage: '倒垃圾',
  other: '其他',
} as const;

export const NOTIFICATION_TYPE_LABELS = {
  expense: '开销',
  duty: '值日',
  vote: '投票',
  convention: '公约',
  anonymous: '悄悄话',
  weather: '天气',
} as const;
