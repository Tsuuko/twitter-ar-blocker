import { checkContainsEmoji } from '../utils/check';
import { sleep } from '../utils/sleep';
import {
  ACTIONS,
  Action,
  AddBlockScreenNameAction,
  BlockCompletedAction,
} from './actions';

const checkInterval = 200;
const blockInterval = 1000;

const idleTime = 10000;

const blockedScreenNames = new Set<string>();

const blockScreenNames = new Set<string>();

console.log(
  checkContainsEmoji('@YahooNewsTopics 😊😊', {
    length: 2,
    onlyEmoji: true,
  })
);

chrome.runtime.onMessage.addListener(function (
  request: { action: Action },
  sender,
  sendResponse
) {
  if (request.action === 'addBlockScreenName') {
    const { screenName } = request as AddBlockScreenNameAction;
    if (blockedScreenNames.has(screenName)) {
      return;
    }
    blockScreenNames.add(screenName);
  }
});

let lastScrollTime = Date.now().valueOf();

let isRunning = false;
const checkAndBlock = async () => {
  // eslint-disable-next-line no-constant-condition
  while (true) {
    isRunning = true;

    await sleep(checkInterval);

    if (lastScrollTime + idleTime < Date.now().valueOf()) {
      isRunning = false;
      console.log('stop');
      break;
    }

    const articles = document.querySelectorAll<HTMLDivElement>('article');
    let screenName: string | undefined;
    const blockArticle = [...articles].find((article) => {
      screenName = getScreenNameFromArticle(article);
      return (
        screenName &&
        blockScreenNames.has(screenName) &&
        !blockedScreenNames.has(screenName)
      );
    });

    if (!screenName || !blockArticle) {
      continue;
    }

    const res = block(blockArticle);
    // const res = true;

    if (res) {
      console.log(screenName, 'blocked.');
      blockedScreenNames.add(screenName);

      const message: BlockCompletedAction = {
        action: ACTIONS.blockCompleted,
        screenName,
      };
      chrome.runtime.sendMessage(message);

      await sleep(blockInterval - checkInterval);
    }
  }
};

const getScreenNameFromArticle = (article: HTMLDivElement) => {
  const screenName = article
    .querySelector('a')
    ?.getAttribute('href')
    ?.replace('/', '');
  return screenName;
};

const block = (article: HTMLDivElement) => {
  console.log(article);
  const menuButton: HTMLDivElement | null =
    article.querySelector(`div[role='button']`);
  if (!menuButton) {
    return false;
  }
  menuButton.click();
  const blockButton: HTMLDivElement | null = document.querySelector(
    `div[data-testid='block']`
  );
  if (!blockButton) {
    return false;
  }
  blockButton.click();

  const blockConfirmButton: HTMLDivElement | null = document.querySelector(
    `div[data-testid="confirmationSheetConfirm"]`
  );
  if (!blockConfirmButton) {
    return false;
  }
  blockConfirmButton.click();

  return true;
};

window.addEventListener('scroll', async () => {
  if (
    !window.location.href.match(/https:\/\/twitter.com\/.*\/status\/\d{19}/)
  ) {
    return;
  }

  lastScrollTime = Date.now().valueOf();

  if (!isRunning) {
    console.log('start');
    checkAndBlock();
  }
});
