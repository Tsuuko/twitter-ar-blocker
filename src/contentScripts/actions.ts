export const ACTIONS = {
  addBlockScreenName: 'addBlockScreenName',
  blockCompleted: 'blockCompleted',
} as const;

export type Action = (typeof ACTIONS)[keyof typeof ACTIONS];

export type BaseAction = {
  action: Action;
};
export type AddBlockScreenNameAction = BaseAction & {
  screenName: string;
};

export type BlockCompletedAction = BaseAction & {
  screenName: string;
};
