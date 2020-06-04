/* 
  TODO: - keep track of tabs and individual selection for tab to show in popup
        - set primary language base on Chrome preferences 
        - set source language base of page locales
        - notifications...
        - keep track of notifications
        - send messages to re-render content and popup when options changes
 */
chrome.runtime.onInstalled.addListener(function () {
  chrome.storage.sync.get(["options", "dictionary"], function (result) {
    if (!result.options) {
      // TODO: get chrome language chrome.i18n.getAcceptLanguages() set as target
      const options = {
        sourceLanguage: { code: "en", name: "English" },
        targetLanguage: { code: "sk", name: "Slovak" },
      };
      const dictionary = result.dictionary ? result.dictionary : [];

      chrome.storage.sync.set({
        options,
        dictionary,
      });
    }
  });
});

chrome.storage.sync.set({
  notification: { interval: false, correctIndex: null },
});

chrome.runtime.onMessage.addListener(function (message, sender, sendResponse) {
  chrome.storage.sync.get(["dictionary", "options"], function (result) {
    if (result.dictionary && result.options) {
      if (message.method === "setOptions") {
        const options = {
          ...result.options,
          ...message.data.options,
        };
        chrome.storage.sync.set({ options });
      }
      if (message.method === "getOptions") {
        sendResponse(result.options);
      }
      if (message.method === "setDictionary") {
        const dictionary = [
          ...result.dictionary,
          {
            source: {
              code: result.options.sourceLanguage.code,
              name: result.options.sourceLanguage.name,
              data: message.data.source,
            },
            result: {
              code: result.options.targetLanguage.code,
              name: result.options.targetLanguage.name,
              data: message.data.result,
            },
          },
        ];
        chrome.storage.sync.set({ dictionary });
      }
      if (message.method === "getDictionary") {
        sendResponse(result.dictionary);
      }
      if (message.method === "deleteDictionaryWord") {
        const dictionary = result.dictionary.filter(
          (_, index) => index !== deleteId
        );
        $("#" + deleteId).remove();
      }
      if (message.method === "getTranslation") {
        data = {
          source: message.data.source,
          sourceLanguage: result.options.sourceLanguage,
          targetLanguage: result.options.targetLanguage,
        };
        chrome.tabs.query({ currentWindow: true, active: true }, function (
          tabArray
        ) {
          translated = translate(data, sendResponse, tabArray[0].id);
        });
      }
      if (message.method === "getTabTranslation") {
        chrome.tabs.query({ currentWindow: true, active: true }, function (
          tabArray
        ) {
          chrome.storage.sync.get("tabs", function (result) {
            sendResponse(result.tabs[tabArray[0].id]);
          });
        });
      }
    }
  });
  return true;
});

async function translate(data, sendResponse, tabId) {
  const url =
    "https://translate.googleapis.com/translate_a/single?client=gtx&sl=" +
    data.sourceLanguage.code +
    "&tl=" +
    data.targetLanguage.code +
    "&dt=t&q=" +
    encodeURI(data.source);

  const response = await fetch(url);
  const json = await response.json();
  try {
    await chrome.storage.sync.get("tabs", function (result) {
      chrome.storage.sync.set({
        tabs: {
          ...result.tabs,
          [tabId]: {
            source: {
              code: data.sourceLanguage.code,
              name: data.sourceLanguage.name,
              data: data.source,
            },
            result: {
              code: data.targetLanguage.code,
              name: data.targetLanguage.name,
              data: json[0][0][0],
            },
          },
        },
      });
    });
    return sendResponse({ result: json[0][0][0], ...data });
  } catch (error) {
    return error.message;
  }
}

chrome.tabs.onUpdated.addListener(function (tabId, changeInfo, tab) {
  if (changeInfo.url === undefined) {
    chrome.storage.sync.get(["notification", "dictionary"], function (result) {
      if (result.notification.interval && result.dictionary.length >= 2) {
        chrome.storage.sync.set({
          notification: { interval: false },
        });
        showQuizNotification();
      }
    });
  }
});

setInterval(setNotificationInterval, 18000000);

function setNotificationInterval() {
  chrome.storage.sync.get("notification", function (result) {
    if (result.notification.interval === false) {
      chrome.storage.sync.set({
        notification: { ...result.notification, interval: true },
      });
    }
  });
}

function showQuizNotification() {
  chrome.storage.sync.get("dictionary", function (result) {
    const word =
      result.dictionary[Math.floor(Math.random() * result.dictionary.length)];
    const badWord =
      result.dictionary[Math.floor(Math.random() * result.dictionary.length)];
    let buttons, correctIndex;
    if (Math.round(Math.random())) {
      correctIndex = 0;
      buttons = [
        {
          title: word.result.data,
        },
        {
          title: badWord.result.data,
        },
      ];
    } else {
      correctIndex = 1;
      buttons = [
        {
          title: badWord.result.data,
        },
        { title: word.result.data },
      ];
    }
    chrome.storage.sync.set({
      notification: { interval: false, correctIndex },
    });
    chrome.notifications.create(
      new Date().now,
      {
        iconUrl: "../icons8-language-48.png",
        type: "basic",
        title: "Translation-Extension",
        message: word.source.data,
        contextMessage: "Choose right answer for word",
        buttons,
      },
      callback
    );
  });
}

chrome.notifications.onButtonClicked.addListener(function (_, buttonIndex) {
  chrome.storage.sync.get("notification", function (result) {
    const opt = {
      type: "basic",
      title: "Translation-Extension",
    };

    if (buttonIndex === result.notification.correctIndex) {
      opt.iconUrl = "../icons8-language-48.png";
      opt.message = "Your answer was Correct!! Congratulations!";
    } else {
      opt.iconUrl = "../icons8-language-48.png";
      opt.message = "Your answer was Incorrect. :(";
    }
    chrome.notifications.create(new Date().now, opt, callback);
  });
});

function callback() {
  console.log("Last error:", chrome.runtime.lastError);
}

chrome.tabs.onCreated.addListener(function (tab) {
  chrome.storage.sync.get("tabs", function (result) {
    chrome.storage.sync.set({
      tabs: {
        ...result.tabs,
        [tab.id]: {
          source: {
            code: null,
            name: null,
            data: null,
          },
          result: {
            code: null,
            name: null,
            data: null,
          },
        },
      },
    });
  });
});
chrome.tabs.onRemoved.addListener(function (tab) {
  chrome.storage.sync.get("tabs", function (result) {
    const { [tab.id]: value, ...rest } = result.tabs;
    chrome.storage.sync.set({ tabs: { ...rest } });
  });
});

chrome.tabs.query({ windowId: chrome.windows.WINDOW_ID_CURRENT }, (tabs) => {
  const saveTabs = tabs.reduce(function (obj, item, index) {
    obj[item.id] = {
      source: {
        code: null,
        name: null,
        data: null,
      },
      result: {
        code: null,
        name: null,
        data: null,
      },
    };
    return obj;
  }, {});
  chrome.storage.sync.set({ tabs: { ...saveTabs } });
});
