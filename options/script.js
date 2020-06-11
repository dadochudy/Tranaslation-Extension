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

  chrome.runtime.sendMessage({ method: "getDictionary" }, function (
    dictionary
  ) {
    if (dictionary) {
      dictionary.forEach((element, index) => {
        $("#trex-list").append(`
        <li class="list-group-item">
          <table class="table table-hover">
            <tbody>
              <tr>
                <td><p class="source">${element.source.data}</p></td>
                <td><p class="target">${element.result.data}</p></td>
                <td>
                <button type="button" class="btn btn-danger delete-button"><i class="icon-trash"></i></button></td>
              </tr>
            </tbody>
          </table>
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

  chrome.runtime.sendMessage({ method: "getOptions" }, function (options) {
    if (options) {
      $(`#${options.sourceLanguage.name}`).prop("checked", true);

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
  });
});
