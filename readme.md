# Thousand Islands

Prototype browser extension exploring what it means to remove content from the Internet. If a person puts an image on a social media network such as Facebook they retain control over the image only within Facebook's walled garden. It is trivial for another person to share that image to another social network such as Twitter, causing the initial owner to lose control of the content.

### Motivation
This prototype was built for a friend of mine exploring issues around children placing images on the web they later regret. There is no facility for this currently. Everything on the Internet is for all intents and purposes on there forever. This prototype is not designed to restrict expression / political descent / free speech, though any means of control of content could be used for that purpose.

### Retaining Ownership Across the Web

This Chrome extension simulates the ability to remove an image (that through some mechanism a person claims ownership over) from any website so long as the content the image remains the same (achieved through hashing the image's content). There are three components to the extension to achieve this:
1. A Browser action which adds a toolbar button that when clicked, shows all the images on the current web page along with a means of "removing" them from the web
2. A content script that is injected into each page Chrome loads and returns a list of images the page is trying to load (Browser actions cannot access page contents, but Chrome provides a messaging capability between the Browser action and the content script)
3. A background script that persists across tabs and intercepts all image loads, sniffing image hashes / URLs. All hashes / URLs are checked against a list of images to remove. If an image has been marked for removal, the original download request is cancelled.

The prototype simulates browsers having some built-in ability to cooperate in removing content from the web. Currently the blocked images are stored in local storage but this would be replaced by a server.

## Usage

1. Download the source locally to a folder
2. In Chrome hit menu -> More Tools -> Extensions
3. Enable Developer Mode with the checkbox at the top of the window
4. Click "Load unpacked extension..."
5. Select the folder you downloaded the source to