// Make the whole collapsible category header toggle its section,
// not just the fold arrow icon.
(function () {
    document.addEventListener('click', function (event) {
        // The category (draft) title is a bare <span> that is a direct child
        // of .chapter-link-wrapper. Real chapters use an <a> instead, so this
        // only matches the collapsible category headers.
        var titleSpan = event.target.closest('.chapter-link-wrapper > span');
        if (!titleSpan) {
            return;
        }

        var toggle = titleSpan.parentElement.querySelector('.chapter-fold-toggle');
        if (!toggle) {
            return;
        }

        event.preventDefault();
        toggle.click();
    });
})();

// Progressive-enhancement tabs.
//
// Markdown authors write:
//   <div class="nia-tabs" data-group="os">
//   <div class="nia-tab" data-title="Windows">
//   ...markdown...
//   </div>
//   <div class="nia-tab" data-title="Linux / macOS">
//   ...markdown...
//   </div>
//   </div>
//
// This script builds the tab bar, handles switching and keyboard navigation,
// and keeps tabs that share a `data-group` in sync (persisted in localStorage)
// so choosing e.g. "Windows" once applies everywhere on the page.
(function () {
    var STORAGE_PREFIX = 'nia-tabs:';

    function slug(value) {
        return (value || '')
            .trim()
            .toLowerCase()
            .replace(/[^a-z0-9]+/g, '-')
            .replace(/^-|-$/g, '');
    }

    function readStored(group) {
        try {
            return localStorage.getItem(STORAGE_PREFIX + group);
        } catch (e) {
            return null;
        }
    }

    function writeStored(group, title) {
        try {
            localStorage.setItem(STORAGE_PREFIX + group, title);
        } catch (e) {
            /* storage unavailable (private mode) — ignore */
        }
    }

    function initTabs(root) {
        var blocks = Array.prototype.slice.call(root.querySelectorAll('.nia-tabs'));
        var groups = {};

        function hasTitle(block, title) {
            return block._niaPanels.some(function (panel) {
                return panel.dataset.title === title;
            });
        }

        function select(block, title) {
            if (!hasTitle(block, title)) {
                title = block._niaPanels[0].dataset.title;
            }
            block._niaPanels.forEach(function (panel) {
                panel.hidden = panel.dataset.title !== title;
            });
            block._niaButtons.forEach(function (button) {
                var active = button.dataset.title === title;
                button.classList.toggle('is-active', active);
                button.setAttribute('aria-selected', active ? 'true' : 'false');
                button.setAttribute('tabindex', active ? '0' : '-1');
            });
        }

        function syncGroup(group, title, origin) {
            (groups[group] || []).forEach(function (block) {
                if (block !== origin && hasTitle(block, title)) {
                    select(block, title);
                }
            });
        }

        blocks.forEach(function (block, blockIndex) {
            var panels = Array.prototype.slice.call(block.children).filter(function (el) {
                return el.classList && el.classList.contains('nia-tab');
            });
            if (panels.length === 0) {
                return;
            }

            var group = block.getAttribute('data-group');
            var tablist = document.createElement('div');
            tablist.className = 'nia-tablist';
            tablist.setAttribute('role', 'tablist');

            var buttons = [];

            panels.forEach(function (panel, index) {
                var title = panel.getAttribute('data-title') || 'Tab ' + (index + 1);
                var baseId = 'niatab-' + blockIndex + '-' + index + '-' + slug(title);

                panel.classList.add('nia-tab-panel');
                panel.setAttribute('role', 'tabpanel');
                panel.id = baseId + '-panel';
                panel.setAttribute('aria-labelledby', baseId + '-tab');
                panel.dataset.title = title;

                var button = document.createElement('button');
                button.type = 'button';
                button.className = 'nia-tab-button';
                button.textContent = title;
                button.setAttribute('role', 'tab');
                button.id = baseId + '-tab';
                button.setAttribute('aria-controls', baseId + '-panel');
                button.dataset.title = title;

                button.addEventListener('click', function () {
                    select(block, title);
                    if (group) {
                        writeStored(group, title);
                        syncGroup(group, title, block);
                    }
                });

                buttons.push(button);
                tablist.appendChild(button);
            });

            block._niaPanels = panels;
            block._niaButtons = buttons;
            block.insertBefore(tablist, panels[0]);
            block.classList.add('nia-ready');

            tablist.addEventListener('keydown', function (event) {
                var current = buttons.indexOf(document.activeElement);
                if (current < 0) {
                    return;
                }
                var next = null;
                if (event.key === 'ArrowRight' || event.key === 'ArrowDown') {
                    next = (current + 1) % buttons.length;
                } else if (event.key === 'ArrowLeft' || event.key === 'ArrowUp') {
                    next = (current - 1 + buttons.length) % buttons.length;
                } else if (event.key === 'Home') {
                    next = 0;
                } else if (event.key === 'End') {
                    next = buttons.length - 1;
                }
                if (next !== null) {
                    event.preventDefault();
                    buttons[next].focus();
                    buttons[next].click();
                }
            });

            if (group) {
                (groups[group] = groups[group] || []).push(block);
            }

            var initial = panels[0].dataset.title;
            if (group) {
                var saved = readStored(group);
                if (saved && hasTitle(block, saved)) {
                    initial = saved;
                }
            }
            select(block, initial);
        });
    }

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', function () {
            initTabs(document);
        });
    } else {
        initTabs(document);
    }
})();
