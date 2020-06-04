$(function () {
  // TODO: get page locale and send to background script Source Language

  function getSelected() {
    if (window.getSelection) {
      return window.getSelection().toString();
    } else if (document.getSelection) {
      return document.getSelection().toString();
    } else {
      const selection = document.selection && document.selection.createRange();
      if (selection.text) {
        return selection.toString();
      }
      return false;
    }
  }

  chrome.runtime.sendMessage(
    {
      method: "getOptions",
    },
    function (response) {
      if (response.sourceLanguage.code !== response.targetLanguage.code) {
        $(document).mouseup(function (event) {
          let selection = getSelected().trim();
          if (selection != "") {
            removeIcon();
            $("body").append(
              `<div id='translation-extension' style="position: absolute; left: ${event.clientX}px;
        top:${event.clientY}px;"></div>`
            );
            $("#translation-extension").mousedown(function (event) {
              chrome.runtime.sendMessage(
                {
                  method: "getTranslation",
                  data: {
                    source: selection,
                  },
                },
                function (response) {
                  $("#translation-extension-translated").append(
                    `<div class="trex-wrapper">
                      <div id="trex-close">x</div>
                      <label id="trex-result-language-label" for="trex-result">${response.sourceLanguage.name}</label>
                      <input type="text" id="trex-source" value="${response.source}" />
                      <label id="trex-result-language-label" for="trex-result">${response.targetLanguage.name}</label>
                      <input type="text" id="trex-result" value="${response.result}" readonly />
                      <div class="trex-actions">
                        <div id="trex-save">Save to Dictionary</div>
                      </div>
                    </div>`
                  );
                  $("#trex-close").click(function () {
                    removeTranslatedTooltip();
                  });
                  $("#trex-save").click(function () {
                    const source = $("#trex-source").val();
                    const result = $("#trex-result").val();
                    if (source && result) {
                      chrome.runtime.sendMessage({
                        method: "setDictionary",
                        data: {
                          source,
                          result,
                        },
                      });
                    }
                  });
                }
              );
              $("body").append(
                `<div id='translation-extension-translated' style="position: absolute; left: ${event.clientX}px;
                top:${event.clientY}px;"></div>`
              );
            });
          } else {
            removeIcon();
          }
        });
      }
    }
  );

  chrome.runtime.onMessage.addListener(function (message) {
    if (message.method === "setContentTooltipClosed") {
      removeTranslatedTooltip();
    }
  });

  function removeIcon() {
    $("#translation-extension").remove();
  }
  function removeTranslatedTooltip() {
    $("#translation-extension-translated").remove();
  }
});
