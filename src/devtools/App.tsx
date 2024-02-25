/* eslint-disable @typescript-eslint/no-explicit-any */
import { useCallback, useEffect, useRef, useState } from 'react';
import {
  ACTIONS,
  AddBlockScreenNameAction,
  BaseAction,
} from '../contentScripts/actions';
import { checkContainsArabic, checkContainsEmoji } from '../utils/check';

export type ReplyTree = {
  name: string;
  screen_name: string;
  user_rest_id: string;
  description: string;
  full_text: string;
  is_blue_verified: boolean;
};

export const App = () => {
  const [isEnabled, setIsEnabled] = useState(false);

  const [blockList, setBlockList] = useState(new Map<string, boolean>());

  const tabIdRef = useRef<number>();

  const onResponseReceived = useCallback(
    (source: chrome.debugger.Debuggee, method: string, params?: any) => {
      const { response, requestId } = params || {};
      const url: string = response?.url;
      if (
        !(
          method === 'Network.responseReceived' &&
          url?.match(
            /https:\/\/(twitter|x)\.com\/i\/api\/graphql\/.*\/TweetDetail/
          ) &&
          response.mimeType === 'application/json'
        )
      ) {
        return;
      }

      const tabId = source.tabId;
      chrome.debugger.sendCommand(
        { tabId },
        'Network.getResponseBody',
        { requestId },
        async (response: any) => {
          if (!response) {
            return;
          }
          const body = JSON.parse(response.body);
          const { entries } =
            body.data.threaded_conversation_with_injections_v2.instructions[0];

          const replies: ReplyTree[] = entries
            .filter(
              (v: any) =>
                (v.entryId as string).match(/conversationthread-\d{19}$/) // プロモ・おすすめツイートを除外
            )
            .map((v: any) => {
              const tweetResults: Array<any> = v.content.items.map(
                (v: any) => v.item.itemContent.tweet_results.result
              );

              const replyTrees: ReplyTree[] = tweetResults.map(
                (tweetResult) => {
                  const userResult = tweetResult.core.user_results.result;
                  return {
                    name: userResult.legacy.name,
                    screen_name: userResult.legacy.screen_name,
                    user_rest_id: userResult.rest_id,
                    description: userResult.legacy.description,
                    full_text: tweetResult.legacy.full_text,
                    is_blue_verified: userResult.is_blue_verified,
                  };
                }
              );
              return replyTrees;
            })
            .flat();
          console.log(replies);
          console.log([...new Set(replies.map((v) => v.screen_name))]);

          [
            ...new Set(
              replies
                .filter((v) => {
                  const isContainsArabic =
                    checkContainsArabic(v.name, 2) ||
                    checkContainsArabic(v.description, 2) ||
                    checkContainsArabic(v.full_text, 2);
                  const isContainsEmoji = checkContainsEmoji(v.full_text, {
                    length: 1,
                    onlyEmoji: true,
                  });
                  return isContainsArabic || isContainsEmoji;
                })
                .map((v) => v.screen_name)
            ),
          ]
            .filter((v) => v && !(blockList.get(v as string) === true)) // FIXME:
            .forEach((screenName) => {
              const params: AddBlockScreenNameAction = {
                action: ACTIONS.addBlockScreenName,
                screenName: screenName as string,
              };
              chrome.tabs.sendMessage(tabId!, params);
              setBlockList(
                (prev) => new Map(prev.set(screenName as string, false))
              );
            });
        }
      );
    },
    []
  );

  const enable = useCallback(() => {
    const tabId = chrome.devtools.inspectedWindow.tabId;
    tabIdRef.current = tabId;

    chrome.debugger.attach({ tabId }, '1.3', () => {
      setIsEnabled(true);

      chrome.debugger.sendCommand({ tabId }, 'Network.enable', {}, () => {
        chrome.debugger.onEvent.addListener(onResponseReceived);
      });
    });
  }, [onResponseReceived]);

  const disable = useCallback(() => {
    const tabId = tabIdRef.current;
    chrome.debugger.detach({ tabId }, () => {
      setIsEnabled(false);
    });
  }, [tabIdRef]);

  const handleMessage = useCallback(
    (request: BaseAction, sender: any, sendResponse: any) => {
      if (request.action === 'blockCompleted') {
        const { screenName } = request as AddBlockScreenNameAction;
        setBlockList((prev) => new Map(prev.set(screenName, true)));
      }
    },
    []
  );
  useEffect(() => {
    chrome.runtime.onMessage.addListener(handleMessage);
    return () => {
      chrome.runtime.onMessage.removeListener(handleMessage);
    };
  }, [handleMessage]);

  return (
    <div>
      <div>Hello! DevTools!</div>
      <button onClick={isEnabled ? disable : enable}>
        <span
          style={{
            color: isEnabled ? 'lightgreen' : 'red',
            marginRight: '5px',
          }}
        >
          ●
        </span>
        {String(isEnabled ? 'to disable' : 'to enable')}
      </button>
      <button
        onClick={() => {
          setBlockList(new Map());
        }}
      >
        clear blockList
      </button>
      <hr />
      <div style={{ whiteSpace: 'pre-wrap' }}>
        {[...blockList.entries()].map(([k, v]) => {
          return (
            <div>
              {k}: {v ? '✅' : '-'}
            </div>
          );
        })}
      </div>
    </div>
  );
};
