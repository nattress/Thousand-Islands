//
// Configuration constants
//

// Minimum image width in pixels for us to display it in the pop-up window for controlling visibility.
// Basically we don't care about 25x25 pixel icons; they just clutter up the list
var MinImageWidth = 51;
var MinImageHeight = 51;

function getCurrentTabId(callback) {
  // Query filter to be passed to chrome.tabs.query - see
  // https://developer.chrome.com/extensions/tabs#method-query
  var queryInfo = {
    active: true,
    currentWindow: true
  };
  console.log("Getting active tab id ");
  chrome.tabs.query(queryInfo, function(tabs) {
    // chrome.tabs.query invokes the callback with a list of tabs that match the
    // query. When the popup is opened, there is certainly a window and at least
    // one tab, so we can safely assume that |tabs| is a non-empty array.
    // A window can only have one active tab at a time, so the array consists of
    // exactly one tab.
    var tab = tabs[0];

    // A tab is a plain object that provides information about the tab.
    // See https://developer.chrome.com/extensions/tabs#type-Tab
    //var url = tab.id;

    // tab.url is only available if the "activeTab" permission is declared.
    // If you want to see the URL of other tabs (e.g. after removing active:true
    // from |queryInfo|), then the "tabs" permission is required to see their
    // "url" properties.
    //console.assert(typeof url == 'string', 'tab.url should be a string');

    callback(tab.id);
  });

  // Most methods of the Chrome extension APIs are asynchronous. This means that
  // you CANNOT do something like this:
  //
  // var url;
  // chrome.tabs.query(queryInfo, function(tabs) {
  //   url = tabs[0].url;
  // });
  // alert(url); // Shows "undefined", because chrome.tabs.query is async.
}

function renderStatus(statusText) {
  document.getElementById('status').textContent = statusText;
}

//
// Chrome does not grant browser_action (toolbar button) scripts access to the contents
// of web pages (the DOM).  It does provide messaging between tabs, so we message 
// the content.js script requesting a list of images loaded in the tab.
//
function getActiveTabImages(tabId, callback)
{
    chrome.tabs.sendMessage(tabId, { text: "get_images" }, callback);
}

function loadImage(path, target) {
    $('<img src="'+ path +'">').load(function() {
      $(this).appendTo(target);

      renderStatus("");
    });
}

function changeVisibility(url, buttonElement)
{
    var current = $(buttonElement).prop('value');

    if (current != "Show" && current != "Hide")
    {
        // The button text should always read Show or Hide.  If it doesn't, something went wrong
        // and we should leave well alone
        return;
    }

    var newVisibility = current == "Show" ? true : false;
    chrome.runtime.sendMessage({action: "setImageVisibility", url: url, visibility: newVisibility}, function(response) {
        if (response)
        {
            $(buttonElement).prop('value', newVisibility ? "Hide" : "Show");
        }
    });
}

function getImageVisibility(url, statusElement, imageWidth, imageHeight)
{
    chrome.runtime.sendMessage({action: "getIsImageEnabled", url: url}, function(response) {
        if (response)
        {
            // Image is enabled. If it's smaller than our configuration threshold, remove it
            // from the list so it doesn't get cluttered with icons
            if (imageWidth < MinImageWidth || imageHeight < MinImageHeight)
            {
                $("#" + statusElement).parent().hide();
            }
        }
        $("#" + statusElement).append("<input type='button' id='" + statusElement + "b" + "' value=" + (response ? "Hide" : "Show") + " />");
        $("#" + statusElement + "b").click(function()
        {
            changeVisibility(url, "#" + statusElement + "b");
        });
    });
}

document.addEventListener('DOMContentLoaded', function() {
    renderStatus("Loading..");
    getCurrentTabId(function(id) {
        getActiveTabImages(id, function(images)
        {
            if (images == undefined || images.length == 0)
            {
                renderStatus("No images found in page");
            }

            for (var i = 0; i < images.length; i++)
            {
                $("#page-images").append("<div id=\"img" + i + "\"></div>");
                loadImage(images[i].url, "#img" + i);
                $("#img" + i).append("<div id=\"control" + i + "\" class='control'></div>");
                getImageVisibility(images[i].url, "control" + i, images[i].width, images[i].height);
            }
        });
    });
});
