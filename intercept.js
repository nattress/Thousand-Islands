//
// Background script which persists across tabs
//
// Intercepts all image loads sniffing the image hashes / URLs.
// All hashes and URLs are checked against a list of images to remove.  If the image
// has been marked for removal, the original image request is cancelled.
//

//
// Choose an image to redirect hidden images to
//
var InterceptedImageUrl = "http://i.imgur.com/MpgceXT.png";

String.prototype.endsWith = function(suffix) {
    return this.indexOf(suffix, this.length - suffix.length) !== -1;
};

var urlToHash = {};
var hashToRemoved = {};

chrome.storage.local.get(["urlToHash", "hashToRemoved"], function(result)
{
    if (result.urlToHash !== undefined)
    {
        console.log("urlToHash");
        urlToHash = result.urlToHash;
        console.log(JSON.stringify(urlToHash));
    }

    if (result.hashToRemoved !== undefined)
    {
        console.log("hashToRemoved");
        hashToRemoved = result.hashToRemoved;
        console.log(JSON.stringify(hashToRemoved));
    }
});

function saveToLocalStorage()
{
    chrome.storage.local.set({"urlToHash": urlToHash}, function()
        {
            chrome.storage.local.set({"hashToRemoved": hashToRemoved}, function()
            {
                console.log("Settings saved.");
            });
        });
}

function getImageHash(url)
{
    // This uses shiny new Javascript intrinsic promises. Support is not great across the board
    // but if you have a recent copy of Chrome you're good
    return new Promise(function(resolve, reject)
    {
        // There is no URL -> hash mapping so we must download the image and create a hash
        var xhr = new XMLHttpRequest();
        xhr.open("GET", url, true);
        xhr.responseType = "arraybuffer";
        xhr.onload = function(buffer) {
            var words = new Uint8Array(buffer.srcElement.response);
            var hex = '';
            for (var i = 0; i < words.length; i++) {
                hex += words[i].toString(16);  // this will convert it to a 4byte hex string
            }
            resolve(CryptoJS.MD5(hex).toString());
        };
        xhr.addEventListener("error", function() { reject("error"); } , false);
        xhr.addEventListener("abort", function() { reject("error"); } , false);
        xhr.send();
    });
}

function shouldShowImage(url)
{
    // Check if the URL has a hash already
    if (urlToHash[url] === undefined)
    {
        getImageHash(url).then(function(hash) {
            urlToHash[url] = hash;
        },
        function(error)
        {
            console.error("Failed");
        });
    }
    
    if (hashToRemoved[urlToHash[url]] == true)
        return false;

    return true;
}

//
// Based on Cory's script at http://www.abeautifulsite.net/parsing-urls-in-javascript/
//
function parseUrl(url) {
    var parser = document.createElement('a'),
        searchObject = {},
        queries, split, i;
    // Let the browser do the work
    parser.href = url;
    // Convert query string to object
    queries = parser.search.replace(/^\?/, '').split('&');
    for( i = 0; i < queries.length; i++ ) {
        split = queries[i].split('=');
        searchObject[split[0]] = split[1];
    }
    return {
        protocol: parser.protocol,
        host: parser.host,
        hostname: parser.hostname,
        port: parser.port,
        pathname: parser.pathname,
        search: parser.search,
        searchObject: searchObject,
        hash: parser.hash
    };
}

console.log("Thousand Islands background monitor started")
chrome.webRequest.onBeforeRequest.addListener(function(details){
    
    var url = details.url;
    if (details.tabId === -1)
    {
        // This request was not associated with a tab in the browser.  That means it was a background
        // request from an extension (maybe even this one).  We'll ignore those for the purpose of
        // this prototype.  A proper implementation would only return here if we know *this*
        // extension has requested the image. That's needed to prevent an infinite loop of request
        // interceptions, since the image request in shouldShowImage() will end up running this method
        // too.
        return;
    }

    var parsedUrl = parseUrl(url);
    
    if (parsedUrl.pathname.endsWith(".jpg") || 
        parsedUrl.pathname.endsWith(".gif") || 
        parsedUrl.pathname.endsWith(".png"))
    {
        if (!shouldShowImage(url))
        {
            // The image has been deep 6'd, cancel the request and GTFO
            console.log("Image blocked. Tab:" + details.tabId + " Url: " + url);
            return { redirectUrl: InterceptedImageUrl };
        }
        
    }
},
{urls: [ "<all_urls>" ]},['requestBody', 'blocking']);

chrome.runtime.onMessage.addListener(
    function(request, sender, sendResponse) {

    if (!sender.tab)
    {
        if (request.action == "getIsImageEnabled")
        {
            var shouldShow = shouldShowImage(request.url);
            var hash = urlToHash[request.url];
            sendResponse(shouldShow);
        }
        else if (request.action == "setImageVisibility")
        {
            var shouldShow = shouldShowImage(request.url);
            var hash = urlToHash[request.url];
            if (shouldShow == request.visibility)
            {
                // Setting visibility to its current value. Return false so we don't
                // update the UI
                sendResponse(false);
            }

            hashToRemoved[hash] = !request.visibility;

            sendResponse(true);
            console.log(JSON.stringify(urlToHash));
            console.log(JSON.stringify(hashToRemoved));
            // When an image visibility is changed, save settings.
            saveToLocalStorage();
        }
        
    }
});