$(function () {
  for (let lang in isoLangs) {
    $("#trex-source-language-select").append(
      `<input
      type="radio"
      value="${lang}"
      id="${isoLangs[lang].name}"
    /><label for="${isoLangs[lang].name}">${isoLangs[lang].name}</label>`
    );
  }

  chrome.runtime.sendMessage({ method: "getOptions" }, function (options) {
    $(`#${options.sourceLanguage.name}`).prop("checked", true);
    $("#trex-result-placeholder").text(
      isoLangs[options.targetLanguage.code].name
    );
  });

  $("#trex-translate").click(() => {
    const source = $("#trex-source").val();
    if (source !== "") {
      chrome.runtime.sendMessage(
        {
          method: "getTranslation",
          data: { source },
        },
        function (response) {
          $("#trex-result").val(response.result);
        }
      );
    }
  });

  $(document).click(function () {
    if ($("#trex-source-language-select").hasClass("trex-expanded")) {
      $("#trex-source-language-select").removeClass("trex-expanded");
    }
  });

  $("#trex-source-language-select").click((e) => {
    e.preventDefault();
    e.stopPropagation();
    if ($("#trex-source-language-select").hasClass("trex-expanded")) {
      $(this).find("input[type='radio']:checked").prop("checked", false);
      $("#" + $(e.target).attr("for")).prop("checked", true);
      const newSourceLangCode = $(
        "#trex-source-language-select input[type='radio']:checked"
      ).val();
      const newSourceLangName = $(
        " #trex-source-language-select input[type='radio']:checked"
      ).attr("id");
      const options = {
        sourceLanguage: { code: newSourceLangCode, name: newSourceLangName },
      };
      chrome.runtime.sendMessage({
        method: "setOptions",
        data: {
          options,
        },
      });
    }
    $("#trex-source-language-select").toggleClass("trex-expanded");

    $("#trex-source-language-select").scrollTop(0);
  });

  $("#trex-save").click(() => {
    const source = $("#trex-source").val();
    const result = $("#trex-result").val();
    if (source && result) {
      chrome.runtime.sendMessage({
        method: "setDictionary",
        data: { source, result },
      });
      $("#trex-source").val("");
      $("#trex-result").val("");
    }
  });

  $("#trex-open-dictionary").click(function () {
    chrome.runtime.openOptionsPage();
  });

  chrome.runtime.sendMessage({ method: "getTabTranslation" }, function (
    response
  ) {
    if (response) {
      $("#trex-source").val(response.source.data);
      $("#trex-result").val(response.result.data);
    }
  });

  chrome.tabs.query({ active: true, currentWindow: true }, function (tabs) {
    chrome.tabs.sendMessage(tabs[0].id, { method: "setContentTooltipClosed" });
  });
});
