//
// This snippet of code gets injected into each page Chrome loads.
// Since the background and toolbar button parts of the extension can't
// see the contents of the page, we use the Chrome messaging API to 
// communicate between our extension's components.
//
// Essentially we just send a list of images in the current page to the requesting caller.
//
chrome.runtime.onMessage.addListener(function(msg, sender, sendResponse) {
    /* If the received message has the expected format... */
    if (msg.text && (msg.text == "get_images")) {
        /* Call the specified callback, passing 
           the web-pages DOM content as argument */
        //sendResponse(document.all[0].outerHTML);
        var imageUrls = [];

        for (var i = 0; i < document.images.length; i++)
        {
            var img = document.images[i];
            
            // Don't include images whose data is inline (not a link to a URL)
            if (img.src.indexOf("data:", 0) === 0)
                continue;

            imageUrls.push({url: img.src, width: img.width, height: img.height});
        }
        sendResponse(imageUrls);
    }
});