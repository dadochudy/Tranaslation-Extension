$(function () {
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
            removeTranslatedTooltip();
            $("body").append(
              `<div id='translation-extension' style="position: absolute; left: ${event.clientX}px;
        top:${event.clientY}px;">
          <div id='translation-extension-icon'></div>
        </div>`
            );

            $("#translation-extension-icon").mousedown(function (event) {
              chrome.runtime.sendMessage(
                {
                  method: "getTranslation",
                  data: {
                    source: selection,
                  },
                },
                function (response) {
                  $("#translation-extension").append(
                    `<div class="trex-wrapper">
                      <div id="trex-close">x</div>
                      <div id="trex-source-input-wrapper">
                        <input id="trex-source" type="text" value="${response.source}" />
                        <span id="trex-source-placeholder">${response.sourceLanguage.name}</span>
                      </div>
                      <div id="trex-result-input-wrapper">
                        <input id="trex-result" type="text" value="${response.result}" readonly />
                        <span id="trex-result-placeholder">${response.targetLanguage.name}</span>
                      </div>
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
    $("#translation-extension-icon").remove();
  }
  function removeTranslatedTooltip() {
    $("#translation-extension").remove();
  }
});

/* 
TODO: for later maybe add page language detection
get sentence with regex and get language with 
i18n.detectLanguage()
regex isn't working correctly
$("body div ").filter(function () {
  console.log(
    $(this)
      .text()
      .match(/[A-Za-z\d][^\.!?]{20,70}[\.!?]/)
  );
})
*/
