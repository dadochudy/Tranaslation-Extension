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
      chrome.storage.sync.set({ options, dictionary });
    }
  });
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
      if (message.method === "translate") {
        data = {
          source: message.data.source,
          sourceLanguage: result.options.sourceLanguage,
          targetLanguage: result.options.targetLanguage,
        };
        translated = translate(data, sendResponse);
      }
      if (message.method === "getTranslation") {
        if (typeof data !== "undefined") {
          translate(data, sendResponse);
        } else {
          sendResponse(null);
        }
      }
    }
  });
  return true;
});

async function translate(data, sendResponse) {
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
    return sendResponse({ result: json[0][0][0], ...data });
  } catch (error) {
    return error.message;
  }
}

function show() {
  chrome.storage.sync.get("dictionary", function (r) {
    const word = r.dictionary[Math.floor(Math.random() * r.dictionary.length)];
    const badWord =
      r.dictionary[Math.floor(Math.random() * r.dictionary.length)];
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

    let opt = {
      iconUrl: "../icons8-language-48.png",
      type: "basic",
      title: "Translation-Extension",
      message: "Quiz",
      contextMessage: `Choose right answer for word: ${word.source.data}`,
      buttons,
    };
    chrome.notifications.create(new Date().now, opt, callback);

    chrome.notifications.onButtonClicked.addListener(function (buttonIndex) {
      let opt;
      if (buttonIndex === correctIndex) {
        opt = {
          iconUrl: "../icons8-language-48.png", // success img
          type: "basic",
          title: "Translation-Extension",
          message: "Your answer was Correct!! Congratulations!",
        };
      } else {
        opt = {
          iconUrl: "../icons8-language-48.png", // wrong img
          type: "basic",
          title: "Translation-Extension",
          message: "Your answer was Incorrect. :(",
        };
      }
      chrome.notifications.create(new Date().now, opt, callback);
    });

    function callback() {
      console.log("Last error:", chrome.runtime.lastError);
    }
  });
}
setInterval(show, 600000);
