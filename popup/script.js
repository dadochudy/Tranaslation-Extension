$(function () {
  for (lang in isoLangs) {
    $("#trex-source-language-select").append(
      `<option value="${lang}">${isoLangs[lang].name}</option>`
    );
  }

  chrome.runtime.sendMessage({ method: "getOptions" }, function (options) {
    $("#trex-source-language-select").val(options.sourceLanguage.code);
    $("#trex-result-language-label").text(
      isoLangs[options.targetLanguage.code].name
    );
  });

  $("#trex-translate").click(() => {
    const source = $("#trex-source").val();
    if (source !== "") {
      chrome.runtime.sendMessage(
        {
          method: "translate",
          data: { source },
        },
        function (response) {
          $("#trex-result").val(response.result);
        }
      );
    }
  });

  $("#trex-source-language-select").change(() => {
    const newSourceLangCode = $(this).find(":selected").val();
    const newSourceLangName = $(this).find(":selected").text();
    const options = {
      sourceLanguage: { code: newSourceLangCode, name: newSourceLangName },
    };
    chrome.runtime.sendMessage({
      method: "setOptions",
      data: {
        options,
      },
    });
  });

  $("#trex-save").click(() => {
    const source = $("#trex-source").val();
    const result = $("#trex-result").val();
    if (source && result) {
      chrome.runtime.sendMessage({
        method: "setDictionary",
        data: { source, result },
      });
    }
  });

  $("#trex-open-dictionary").click(function () {
    chrome.runtime.openOptionsPage();
  });

  chrome.runtime.sendMessage({ method: "getTranslation" }, function (response) {
    if (response !== null) {
      $("#trex-source").val(response.source);
      $("#trex-result").val(response.result);
    }
  });

  chrome.tabs.query({ active: true, currentWindow: true }, function (tabs) {
    chrome.tabs.sendMessage(tabs[0].id, { method: "setContentTooltipClosed" });
  });
});
