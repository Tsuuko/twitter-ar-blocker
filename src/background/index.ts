// chrome.webRequest.onCompleted.addListener(
//   async (details) => {
//     if (
//       details.url.startsWith(
//         'https://twitter.com/i/api/graphql/B9_KmbkLhXt6jRwGjJrweg/TweetDetail'
//       ) &&
//       !details.initiator?.startsWith('chrome-extension')
//     ) {
//       console.log(details);

//       const res = await (await fetch(details.url)).json();
//       console.log(res);
//     }
//   },
//   { urls: ['<all_urls>'] }
// );
// chrome.webRequest.onCompleted
// chrome.devtools.network.
