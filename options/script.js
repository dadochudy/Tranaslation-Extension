$(function () {
  chrome.runtime.sendMessage({ method: "getDictionary" }, function (
    dictionary
  ) {
    if (dictionary) {
      dictionary.forEach((element, index) => {
        $("#trex-list").append(`
        <li id="${index}">
          <p class="source">${element.source.data}</p>
          <p class="target">${element.result.data}</p>
          <button class="delete-button">×</button>
        </li>
      `);
        $(".delete-button").click(function () {
          const deleteId = parseInt($(this).closest("li").attr("id"));
          chrome.runtime.sendMessage({
            method: "deleteDictionaryWord",
            deleteId,
          });
        });
      });
    }
  });

  chrome.runtime.sendMessage({ method: "getOptions" }, function (options) {
    if (options) {
      for (let lang in isoLangs) {
        $("#trex-target-language-select").append(`
          <option value="${lang}">${isoLangs[lang].name}</option>
        `);
      }
      $("#trex-target-language-select").val(options.targetLanguage.code);

      $("#trex-target-language-select").change(function () {
        const newTargetLangCode = $(this).find(":selected").val();
        const newTargetLangName = $(this).find(":selected").text();
        const options = {
          targetLanguage: { code: newTargetLangCode, name: newTargetLangName },
        };
        $("#trex-target-language-select").after(`
          <button id="trex-save-language">save</button>
        `);
        $("#trex-save-language").click(function () {
          chrome.runtime.sendMessage({
            method: "setOptions",
            data: {
              options,
            },
          });
          $(this).remove();
        });
      });
    }

    for (let lang in isoLangs) {
      $("#trex-target-language-select").append(
        `<option value="${lang}">${isoLangs[lang].name}</option>`
      );
    }
  });
});
