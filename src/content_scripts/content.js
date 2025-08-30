function copyToClipboard(value) {
    var temp_elem;
    
    if (typeof value === 'string') {
        // Handle string input
        temp_elem = document.createElement('textarea');
        temp_elem.value = value;
        document.body.appendChild(temp_elem);
        temp_elem.select();
    } else if (value instanceof Element) {
        temp_elem = value.cloneNode(true);
        document.body.appendChild(temp_elem);
        
        // Create a range and selection
        const range = document.createRange();
        const selection = window.getSelection();
        
        selection.removeAllRanges();
        range.selectNodeContents(temp_elem);
        selection.addRange(range);
    } else {
        console.error('Invalid input type. Expected string or DOM element.');
        return;
    }
    
    document.execCommand("copy");
    document.body.removeChild(temp_elem);
    
    if (value instanceof Element) {
        window.getSelection().removeAllRanges();
    }
}



function get_story_contents_from_templates() {
	var url = window.location.href;
	var templates = window.JH_TEMPLATES || [];
	for (var i = 0; i < templates.length; i++) {
		var template = templates[i];
		try {
			if (!template.match(url)) {
				continue;
			}
			var scopes = template.scopeSelectors || ['document'];
			for (var s = 0; s < scopes.length; s++) {
				var selector = scopes[s];
				var scope = selector === 'document' ? document : document.querySelector(selector);
				if (!scope) {
					continue;
				}
				var result = template.extract(scope, url);
				if (result && result.formatted_text && result.story_link) {
					return result;
				}
			}
		} catch (e) {
			console.log('Template error:', template.id || i, e);
		}
	}
	
	// Fallback to document title if no template matches or extraction fails
	var title = document.title?.trim();
	if (title) {
		return {
			formatted_text: `[${title}]`,
			story_link: url
		};
	}
	
	return null;
}

function toMarkdownLinkText(formatted_text) {
    if (typeof formatted_text !== 'string') {
        return '[]';
    }
    if (formatted_text.startsWith('[') && formatted_text.endsWith(']')) {
        var inner = formatted_text.slice(1, -1);
        inner = inner.replace(/\[/g, '\\[').replace(/\]/g, '\\]');
        return '[' + inner + ']';
    }
    var escaped = formatted_text.replace(/\[/g, '\\[').replace(/\]/g, '\\]');
    return '[' + escaped + ']';
}

function showNotification(isMarkdown, copiedText) {
    // Create notification element
    const notification = document.createElement('div');
    notification.style.position = 'fixed';
    notification.style.top = '0';
    notification.style.left = '0';
    notification.style.width = '100%';
    notification.style.height = '100%';
    notification.style.display = 'flex';
    notification.style.justifyContent = 'center';
    notification.style.alignItems = 'center';
    notification.style.backgroundColor = 'rgba(0, 0, 0, 0.3)';
    notification.style.backdropFilter = 'blur(3px)';
    notification.style.zIndex = '9999';
    notification.style.opacity = '0';
    notification.style.transition = 'opacity 0.3s ease-in-out';
    
    // Create message element
    const message = document.createElement('div');
    // Remove brackets from the formatted text for display
    const displayText = copiedText ? copiedText.replace(/^\[|\]$/g, '') : 'content';
    message.textContent = `Copied "${displayText}" as ${!isMarkdown ? 'a hyperlink' : 'a markdown hyperlink'} to this page`;
    message.style.padding = '20px 40px';
    message.style.backgroundColor = 'rgba(255, 255, 255, 0.9)';
    message.style.borderRadius = '8px';
    message.style.boxShadow = '0 4px 12px rgba(0, 0, 0, 0.15)';
    message.style.fontSize = '18px';
    message.style.fontWeight = 'bold';
    
    notification.appendChild(message);
    document.body.appendChild(notification);
    
    // Trigger animation
    setTimeout(() => {
        notification.style.opacity = '1';
    }, 10);
    
    // Remove after delay
    setTimeout(() => {
        notification.style.opacity = '0';
        setTimeout(() => {
            document.body.removeChild(notification);
        }, 300);
    }, 1500);
}

chrome.runtime.onMessage.addListener(
    function(request, sender, sendResponse) {
        if( request.message === "hyperlinkify_story" ) {
            console.log(`hyperlinkify_story markdown: ${request.markdown}`);

            var story_contents = get_story_contents_from_templates();

            if(story_contents === null || story_contents === undefined){
                console.log("No story contents found");
                return;
            }

            if(story_contents.formatted_text === null || story_contents.formatted_text === undefined){
                console.log("Error getting story contents");
                return;
            }

            formatted_text = story_contents.formatted_text;
            story_link = story_contents.story_link;

            if(request.markdown) {
                var markdown_text = toMarkdownLinkText(formatted_text) + `(${story_link})`
                copyToClipboard(markdown_text)
                
                console.log("Markdown text copied to clipboard.");
                showNotification(true, formatted_text);
                sendResponse({success: true});
                
            } else {
                var tempLink = document.createElement('a');
                tempLink.href = story_link;
                tempLink.textContent = formatted_text; 
                tempLink.style.textDecoration = 'underline';


                var container = document.createElement('div');
                container.appendChild(tempLink);
                container.style.color = 'blue';
                container.style.backgroundColor = 'transparent';
                
                var tempDiv = document.createElement('div');
                tempDiv.style.color = 'black';
                tempDiv.style.backgroundColor = 'transparent';
                tempDiv.appendChild(container)
                document.body.appendChild(tempDiv);

                copyToClipboard(tempDiv)
                
                console.log("Formatted hyperlinks copied to clipboard.");
                showNotification(false, formatted_text);
                sendResponse({success: true});
            }

        }
    }
);


