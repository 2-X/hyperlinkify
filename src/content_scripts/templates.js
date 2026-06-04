(function() {
    // Global registry of templates. Each template describes:
    // - match(url): boolean → whether the template should handle the current page
    // - scopeSelectors: ordered list of selectors to probe for a root scope (use 'document' to use the whole page)
    // - extract(scope, url): returns { formatted_text, story_link } or null if not applicable

    window.JH_TEMPLATES = [
        {
            id: 'jira_issue',
            match: function(url) {
                return url.includes('.atlassian.net');
            },
            scopeSelectors: [
                "[data-testid*='issue-modal.modal-dialog'][role*='dialog']",
                "[data-testid='issue.views.issue-details.issue-layout.compact-layout']",
                'document'
            ],
            extract: function(scope, url) {
                var root = scope === 'document' ? document : scope;
                var story_title = root.querySelector("h1[data-testid*='summary.heading']")?.innerText;
                var code_anchor = root.querySelector("a[data-testid*='current-issue.item']");
                var story_code = code_anchor?.innerText;
                var story_link = code_anchor?.href || url;

                if (!story_title || !story_code || !story_link) {
                    return null;
                }

                return {
                    formatted_text: `[${story_code} • ${story_title}]`,
                    story_link: story_link
                };
            }
        },
        {
            id: 'yournavi_curation_dataset',
            match: function(url) {
                return url.includes('yournavi') && url.includes('/curate/') && url.includes('/dataset/');
            },
            scopeSelectors: ['document'],
            extract: function(scope, url) {
                try {
                    var topRow = document.querySelector('.top-row');
                    var datasetDisplayNameInput = document.querySelector('#dataset-display-name');
                    if (!topRow || !datasetDisplayNameInput) {
                        return null;
                    }
                    var topRowText = topRow.innerText
                        .replace(/arrow_right/g, '')
                        .replace(/\n/g, '')
                        .trim();
                    var datasetName = datasetDisplayNameInput.value;
                    return {
                        formatted_text: `[${topRowText} ▸ ${datasetName}]`,
                        story_link: url
                    };
                } catch (e) {
                    return null;
                }
            }
        },
        {
            id: 'google_docs_title',
            match: function(url) {
                return url.includes('docs.google.com') || url.includes('slides.google.com') || url.includes('sheets.google.com');
            },
            scopeSelectors: ['document'],
            extract: function(scope, url) {
                var input = document.querySelector('.docs-title-input');
                var title = (input && (input.value || input.getAttribute('value') || ''))?.trim();
                if (!title) {
                    return null;
                }
                return {
                    formatted_text: `[${title}]`,
                    story_link: url
                };
            }
        },
        {
            id: 'amazon_product',
            match: function(url) {
                return url.includes('amazon.com');
            },
            scopeSelectors: ['document'],
            extract: function(scope, url) {
                var productTitleElement = document.querySelector('#productTitle');
                var title = productTitleElement?.innerText?.trim();
                if (!title) {
                    return null;
                }
                return {
                    formatted_text: `[${title}]`,
                    story_link: url
                };
            }
        },
        {
            id: 'aws_s3_bucket',
            match: function(url) {
                return url.includes('.console.aws.amazon.com/s3/buckets');
            },
            scopeSelectors: ['document'],
            extract: function(scope, url) {
                var breadcrumbNav = document.querySelector('nav[data-testid="mosaic-breadcrumbs"]');
                if (!breadcrumbNav) {
                    return null;
                }
                var breadcrumbItems = breadcrumbNav.querySelectorAll('ol.awsui_breadcrumb-group-list_d19fg_yqdse_180:not(.awsui_ghost_d19fg_yqdse_191) > li.awsui_item_d19fg_yqdse_196');
                if (!breadcrumbItems || breadcrumbItems.length < 3) {
                    return null;
                }
                var pathParts = [];
                for (var i = 2; i < breadcrumbItems.length; i++) {
                    var textEl = breadcrumbItems[i].querySelector('.awsui_text_1kosq_6mb5s_206');
                    if (textEl) {
                        pathParts.push(textEl.innerText.replace(/\/+$/, ''));
                    }
                }
                if (pathParts.length === 0) {
                    return null;
                }
                var fullPath = pathParts.join('/') + '/';
                return {
                    formatted_text: `[Amazon S3 Bucket • ${fullPath}]`,
                    story_link: url
                };
            }
        }
    ];
})();

