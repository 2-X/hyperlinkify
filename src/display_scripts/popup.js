const hyperlinkify_story = ({markdown}) => {
    console.log("hyperlinkify_story sending");
    chrome.tabs.query({currentWindow: true, active: true}, function (tabs){
        var activeTab = tabs[0];
        console.log(markdown);
        chrome.tabs.sendMessage(activeTab.id, {
            "message": "hyperlinkify_story",
            "markdown": markdown,
        });
    });
}


const render_content = () => {
    // get content div
    
    let content_div = document.getElementById("content");

    content_div.innerHTML = `
        <div class="content-row no-drag">        
            <div class="checkbox">
                    <input type="checkbox" id="markdown">
                    <label for="markdown">Markdown</label>
            </div>
            <div id="hyperlinkify-story">
                Hyperlinkify!
            </div>
        </div>
    `
    document.getElementById("hyperlinkify-story").onclick = () => {
        hyperlinkify_story({
            "markdown": document.getElementById("markdown").checked
        });
    }
    
}

// ON LOAD
document.addEventListener("DOMContentLoaded", () => {
    render_content();
});
