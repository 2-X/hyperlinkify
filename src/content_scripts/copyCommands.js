const DOUBLE_PRESS_DELAY = 200;
let doublePressPending = false;
let doublePressPendingTimeout = null;

// Detect if we're on macOS
const isMac = navigator.platform.toUpperCase().indexOf('MAC') >= 0;

function hasUserSelection() {
    // Consider "real" selection only when there is visible highlighted text
    // i.e., selected text length >= 1. Caret-only focus should NOT count.
    const selection = window.getSelection?.();
    const selectedTextLength = selection ? (selection.toString?.().length || 0) : 0;
    if (selectedTextLength > 0) {
        return true;
    }

    // Also handle INPUT/TEXTAREA selection length
    const active = document.activeElement;
    if (!active) return false;
    const tag = active.tagName;
    const isInput = tag === 'INPUT' || tag === 'TEXTAREA';
    if (isInput && typeof active.selectionStart === 'number' && typeof active.selectionEnd === 'number') {
        return (active.selectionEnd - active.selectionStart) > 0;
    }

    return false;
}

document.addEventListener('keydown', function(event) {
    // Check for platform-specific keyboard shortcuts
    // macOS: CMD+ALT+C (metaKey + altKey + KeyC)
    // Windows/Linux: CTRL+ALT+C (ctrlKey + altKey + KeyC)
    console.log(event)
    if (event.code === 'KeyC' && //event.altKey && 
        ((isMac && event.metaKey) || (!isMac && event.ctrlKey))) {
        // If user has a selection, allow normal copy behavior
        if (hasUserSelection()) {
            return; // Do not prevent default or trigger hyperlinkify
        }

        event.preventDefault(); // Prevent default browser behavior only when no selection
        
        if (doublePressPending) {
            // This is the second press within the timeout period
            console.log("Double press detected - Markdown copy");
            clearTimeout(doublePressPendingTimeout);
            doublePressPending = false;
            
            chrome.runtime.sendMessage({
                "message": "hyperlinkify_story_keys",
                "markdown": true,
            });
        } else {
            // This is the first press, set up for potential double press
            console.log("First press detected - waiting for potential second press");
            doublePressPending = true;
            
            // Clear any existing timeout
            if (doublePressPendingTimeout) {
                clearTimeout(doublePressPendingTimeout);
            }
            
            // Set timeout for single press action
            doublePressPendingTimeout = setTimeout(() => {
                if (doublePressPending) {
                    console.log("Single press timeout - Regular copy");
                    doublePressPending = false;
                    
                    chrome.runtime.sendMessage({
                        "message": "hyperlinkify_story_keys",
                        "markdown": false,
                    });
                }
            }, DOUBLE_PRESS_DELAY);
        }
    }
});
