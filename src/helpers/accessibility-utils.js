/**
 * Accessibility tree extraction utilities
 */

/**
 * Extract comprehensive DOM tree from the browser
 * This function runs in the browser context via driver.execute()
 * @param {string|Element} selectorOrElement - CSS selector string or DOM element to start from (optional)
 * @returns {Object} DOM tree structure
 */
function extractDom(selectorOrElement = null) {
    /* eslint-disable no-undef */

    // Determine the root element to start extraction from
    let rootElement;

    if (selectorOrElement) {
        if (typeof selectorOrElement === 'string') {
            // It's a CSS selector
            rootElement = document.querySelector(selectorOrElement);
            if (!rootElement) {
                return {
                    type: 'error',
                    error: `Element not found for selector: ${selectorOrElement}`,
                    data: null
                };
            }
        } else {
            // It's already a DOM element
            rootElement = selectorOrElement;
        }
    } else {
        // Default to document root
        rootElement = document.documentElement;
    }

    // Helper function to get computed role
    const getComputedRole = (element) => {
        // Try to get explicit role first
        const explicitRole = element.getAttribute('role');
        if (explicitRole) {
            return explicitRole;
        }

        // Derive implicit role from tag name and attributes
        const tagName = element.tagName.toLowerCase();

        // Common implicit roles
        const implicitRoles = {
            a: element.hasAttribute('href') ? 'link' : 'generic',
            button: 'button',
            input: getInputRole(element),
            img: element.hasAttribute('alt') ? 'img' : 'presentation',
            h1: 'heading',
            h2: 'heading',
            h3: 'heading',
            h4: 'heading',
            h5: 'heading',
            h6: 'heading',
            nav: 'navigation',
            main: 'main',
            aside: 'complementary',
            section: 'region',
            article: 'article',
            form: 'form',
            ul: 'list',
            ol: 'list',
            li: 'listitem',
            table: 'table',
            tr: 'row',
            td: 'cell',
            th: 'columnheader'
        };

        return implicitRoles[tagName] || 'generic';
    };

    // Helper function to determine input role
    const getInputRole = (element) => {
        const type = element.getAttribute('type') || 'text';
        const inputRoles = {
            button: 'button',
            submit: 'button',
            reset: 'button',
            checkbox: 'checkbox',
            radio: 'radio',
            range: 'slider',
            search: 'searchbox',
            email: 'textbox',
            tel: 'textbox',
            url: 'textbox',
            password: 'textbox'
        };
        return inputRoles[type] || 'textbox';
    };

    // Helper function to get accessible name
    const getAccessibleName = (element) => {
        // Check aria-label first
        const ariaLabel = element.getAttribute('aria-label');
        if (ariaLabel) {
            return ariaLabel.trim();
        }

        // Check aria-labelledby
        const labelledBy = element.getAttribute('aria-labelledby');
        if (labelledBy) {
            const labelElement = document.getElementById(labelledBy);
            if (labelElement) {
                return labelElement.textContent?.trim() || '';
            }
        }

        // Check associated label elements
        if (element.id) {
            const label = document.querySelector(`label[for="${element.id}"]`);
            if (label) {
                return label.textContent?.trim() || '';
            }
        }

        // For form controls, check parent label
        const parentLabel = element.closest('label');
        if (parentLabel) {
            return parentLabel.textContent?.trim() || '';
        }

        // Check alt attribute for images
        if (element.tagName.toLowerCase() === 'img') {
            return element.getAttribute('alt') || '';
        }

        // Check title attribute
        const title = element.getAttribute('title');
        if (title) {
            return title.trim();
        }

        // Fallback to text content (truncated)
        const textContent = element.textContent?.trim();
        return textContent ? textContent.substring(0, 100) : '';
    };

    // Helper function to get accessible description
    const getAccessibleDescription = (element) => {
        const describedBy = element.getAttribute('aria-describedby');
        if (describedBy) {
            const descElement = document.getElementById(describedBy);
            if (descElement) {
                return descElement.textContent?.trim() || '';
            }
        }
        return '';
    };

    // Main extraction function
    const extractNodeInfo = (element, depth = 0, maxDepth = 10) => {
        // Prevent infinite recursion
        if (depth > maxDepth) {
            return null;
        }

        const computedStyle = window.getComputedStyle(element);
        const rect = element.getBoundingClientRect();

        const info = {
            tagName: element.tagName,
            role: getComputedRole(element),
            name: getAccessibleName(element),
            description: getAccessibleDescription(element),

            // ARIA attributes
            level: element.getAttribute('aria-level') || null,
            expanded: element.getAttribute('aria-expanded') || null,
            checked: element.getAttribute('aria-checked') || null,
            selected: element.getAttribute('aria-selected') || null,
            pressed: element.getAttribute('aria-pressed') || null,
            orientation: element.getAttribute('aria-orientation') || null,

            // State information
            disabled: element.disabled || element.getAttribute('aria-disabled') === 'true',
            hidden:
                element.hidden ||
                element.getAttribute('aria-hidden') === 'true' ||
                computedStyle.display === 'none' ||
                computedStyle.visibility === 'hidden',
            readonly: element.readOnly || element.getAttribute('aria-readonly') === 'true',
            required: element.required || element.getAttribute('aria-required') === 'true',

            // Focus and interaction
            focusable:
                element.tabIndex >= 0 ||
                ['input', 'button', 'select', 'textarea', 'a'].includes(element.tagName.toLowerCase()) ||
                element.getAttribute('contenteditable') === 'true',
            tabIndex: element.tabIndex,

            // Position and size
            bounds: {
                x: Math.round(rect.x),
                y: Math.round(rect.y),
                width: Math.round(rect.width),
                height: Math.round(rect.height)
            },

            // Additional attributes
            id: element.id || null,
            className: element.className || null,

            children: []
        };

        // Extract children (limit number to avoid excessive data)
        if (element.children && element.children.length > 0) {
            const maxChildren = 100; // Reasonable limit
            for (let i = 0; i < Math.min(element.children.length, maxChildren); i++) {
                const child = element.children[i];
                if (child.nodeType === 1) {
                    // Element node
                    const childInfo = extractNodeInfo(child, depth + 1, maxDepth);
                    if (childInfo) {
                        info.children.push(childInfo);
                    }
                }
            }
        }

        return info;
    };

    // Check for native accessibility API support
    if (typeof window.getComputedAccessibleNode === 'function') {
        try {
            const rootNode = document.documentElement;
            return {
                type: 'native',
                data: window.getComputedAccessibleNode(rootNode),
                fallback: null
            };
        } catch (error) {
            console.warn('Native accessibility API failed, using fallback:', error);
        }
    }

    // Fallback implementation
    try {
        return {
            type: 'fallback',
            data: extractNodeInfo(rootElement),
            metadata: {
                url: window.location.href,
                title: document.title,
                timestamp: new Date().toISOString(),
                userAgent: navigator.userAgent,
                viewport: {
                    width: window.innerWidth,
                    height: window.innerHeight
                },
                selector: typeof selectorOrElement === 'string' ? selectorOrElement : null,
                startElement: rootElement.tagName || 'unknown'
            }
        };
    } catch (error) {
        return {
            type: 'error',
            error: error.message,
            data: null
        };
    }

    /* eslint-enable no-undef */
}

module.exports = {
    extractDom,
    extractAccessibilityTree: extractDom // Keep backward compatibility
};
