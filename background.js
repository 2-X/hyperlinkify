chrome.runtime.onInstalled.addListener(() => {
  console.log('Chrome extension installed');
});



chrome.runtime.onMessage.addListener(
    function(request, sender, sendResponse) {
        if( request.message === "hyperlinkify_story_keys" ) {
            console.log("hyperlinkify_story_keys");
            console.log(sender.tab.id);
            console.log(request.markdown);
            chrome.tabs.sendMessage(sender.tab.id, {
                "message": "hyperlinkify_story",
                "markdown": request.markdown,
            });
            sendResponse({success: true});

        }
    }
);

