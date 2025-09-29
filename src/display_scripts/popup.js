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


function getHostnameFromUrl(urlString) {
    try {
        const u = new URL(urlString);
        if (u.protocol === 'file:') return 'file';
        return u.hostname;
    } catch (e) {
        return '';
    }
}

function loadDisabledDomains() {
    return new Promise((resolve) => {
        chrome.storage.sync.get(['disabledDomains'], (res) => {
            const list = Array.isArray(res.disabledDomains) ? res.disabledDomains : [];
            resolve(list);
        });
    });
}

function saveDisabledDomains(list) {
    return new Promise((resolve) => {
        chrome.storage.sync.set({ disabledDomains: list }, resolve);
    });
}

async function toggleForDomain(domain) {
    const list = await loadDisabledDomains();
    const idx = list.indexOf(domain);
    if (idx >= 0) {
        list.splice(idx, 1);
    } else {
        list.push(domain);
    }
    await saveDisabledDomains(list);
    return list.indexOf(domain) >= 0; // true if now disabled
}

async function render_site_toggle() {
    const container = document.getElementById('site-toggle');
    if (!container) return;

    chrome.tabs.query({ currentWindow: true, active: true }, async (tabs) => {
        const tab = tabs && tabs[0];
        if (!tab || !tab.url) {
            container.innerText = 'Unavailable';
            return;
        }
        const domain = getHostnameFromUrl(tab.url);
        if (!domain) {
            container.innerText = 'Unavailable';
            return;
        }

        const list = await loadDisabledDomains();
        const isDisabled = list.includes(domain);

        container.innerHTML = `
            <button id="toggle-domain" style="cursor:pointer; font-size:16px; padding:6px 10px; border-radius:6px; border:1px solid #ccc; background:#fff;">
                ${isDisabled ? '❌' : '✅'} ${domain}
            </button>
        `;

        const btn = document.getElementById('toggle-domain');
        btn.onclick = async () => {
            const nowDisabled = await toggleForDomain(domain);
            btn.textContent = `${nowDisabled ? '❌' : '✅'} ${domain}`;
        };
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
                Copy Hyperlink
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
    render_site_toggle();
    render_shortcut_config();
});

function getDefaultShortcut() {
    const isMac = navigator.platform.toUpperCase().indexOf('MAC') >= 0;
    return { code: 'KeyC', ctrl: !isMac, alt: false, shift: false, meta: isMac };
}

function shortcutToLabel(s) {
    if (!s) return '';
    const parts = [];
    if (s.ctrl) parts.push('Ctrl');
    if (s.alt) parts.push('Alt');
    if (s.shift) parts.push('Shift');
    if (s.meta) parts.push('Meta');
    parts.push(s.code);
    return parts.join(' + ');
}

function isModifierCode(code) {
    return code === 'ShiftLeft' || code === 'ShiftRight' || code === 'ControlLeft' || code === 'ControlRight' || code === 'AltLeft' || code === 'AltRight' || code === 'MetaLeft' || code === 'MetaRight';
}

function render_shortcut_config() {
    const container = document.getElementById('shortcut-config');
    if (!container) return;

    chrome.storage.sync.get(['globalShortcut', 'globalShortcutEnabled'], (res) => {
        const current = res.globalShortcut || getDefaultShortcut();
        const enabled = typeof res.globalShortcutEnabled === 'boolean' ? res.globalShortcutEnabled : true;

        container.innerHTML = `
            <label for="shortcut-input">Shortcut</label>
            <input id="shortcut-input" type="text" style="width:180px;" readonly value="${shortcutToLabel(current)}" />
            <label for="shortcut-enabled">Enabled</label>
            <input id="shortcut-enabled" type="checkbox" ${enabled ? 'checked' : ''} />
        `;

        const input = document.getElementById('shortcut-input');
        const toggle = document.getElementById('shortcut-enabled');

        input.addEventListener('keydown', (e) => {
            e.preventDefault();
            const code = e.code;
            if (isModifierCode(code)) {
                return;
            }
            const next = {
                code: code,
                ctrl: !!e.ctrlKey,
                alt: !!e.altKey,
                shift: !!e.shiftKey,
                meta: !!e.metaKey
            };
            chrome.storage.sync.set({ globalShortcut: next }, () => {
                input.value = shortcutToLabel(next);
            });
        });

        input.addEventListener('focus', () => {
            input.select();
        });

        toggle.addEventListener('change', () => {
            chrome.storage.sync.set({ globalShortcutEnabled: toggle.checked });
        });
    });
}
