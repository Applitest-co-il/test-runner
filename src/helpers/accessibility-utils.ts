/**
 * Accessibility tree extraction utilities
 */

import { ElementInfo, DomTreeResult } from '../types';

/**
 * Extract comprehensive DOM tree from the browser
 * This function runs in the browser context via driver.execute()
 * @param selectorOrElement - CSS selector string or DOM element to start from (optional)
 * @returns DOM tree structure
 */
export function extractDom(selectorOrElement: string | Element | null = null): DomTreeResult {
    /* eslint-disable no-undef */

    // Determine the root element to start extraction from
    let rootElement: Element;

    if (selectorOrElement) {
        if (typeof selectorOrElement === 'string') {
            // It's a CSS selector
            const found = document.querySelector(selectorOrElement);
            if (!found) {
                return {
                    type: 'error',
                    error: `Element not found for selector: ${selectorOrElement}`,
                    data: null
                };
            }
            rootElement = found;
        } else {
            // It's already a DOM element
            rootElement = selectorOrElement;
        }
    } else {
        // Default to document root
        rootElement = document.documentElement;
    }

    // Helper function to get computed role
    const getComputedRole = (element: Element): string => {
        // Try to get explicit role first
        const explicitRole = element.getAttribute('role');
        if (explicitRole) {
            return explicitRole;
        }

        // Derive implicit role from tag name and attributes
        const tagName = element.tagName.toLowerCase();

        // Common implicit roles
        const implicitRoles: Record<string, string> = {
            a: element.hasAttribute('href') ? 'link' : 'generic',
            button: 'button',
            input: getInputRole(element as HTMLInputElement),
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
    const getInputRole = (element: HTMLInputElement): string => {
        const type = element.getAttribute('type') || 'text';
        const inputRoles: Record<string, string> = {
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
    const getAccessibleName = (element: Element): string => {
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
    const getAccessibleDescription = (element: Element): string => {
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
    const extractNodeInfo = (element: Element, depth: number = 0, maxDepth: number = 10): ElementInfo | null => {
        // Prevent infinite recursion
        if (depth > maxDepth) {
            return null;
        }

        const computedStyle = window.getComputedStyle(element);
        const rect = element.getBoundingClientRect();

        const info: ElementInfo = {
            tagName: element.tagName,
            role: getComputedRole(element),
            name: getAccessibleName(element),
            description: getAccessibleDescription(element),

            // ARIA attributes
            level: element.getAttribute('aria-level') || undefined,
            expanded: element.getAttribute('aria-expanded') || undefined,
            checked: element.getAttribute('aria-checked') || undefined,
            selected: element.getAttribute('aria-selected') || undefined,
            pressed: element.getAttribute('aria-pressed') || undefined,
            orientation: element.getAttribute('aria-orientation') || undefined,

            // State information
            disabled: (element as HTMLInputElement).disabled || element.getAttribute('aria-disabled') === 'true',
            hidden:
                (element as HTMLElement).hidden ||
                element.getAttribute('aria-hidden') === 'true' ||
                computedStyle.display === 'none' ||
                computedStyle.visibility === 'hidden',
            readonly: (element as HTMLInputElement).readOnly || element.getAttribute('aria-readonly') === 'true',
            required: (element as HTMLInputElement).required || element.getAttribute('aria-required') === 'true',

            // Focus and interaction
            focusable:
                (element as HTMLElement).tabIndex >= 0 ||
                ['input', 'button', 'select', 'textarea', 'a'].includes(element.tagName.toLowerCase()) ||
                element.getAttribute('contenteditable') === 'true',
            tabIndex: (element as HTMLElement).tabIndex,

            // Position and size
            bounds: {
                x: Math.round(rect.x),
                y: Math.round(rect.y),
                width: Math.round(rect.width),
                height: Math.round(rect.height)
            },

            // Additional attributes
            id: element.id || undefined,
            className: element.className || undefined,

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
    if (typeof (window as any).getComputedAccessibleNode === 'function') {
        try {
            const rootNode = document.documentElement;
            return {
                type: 'native',
                data: (window as any).getComputedAccessibleNode(rootNode),
                metadata: {
                    url: window.location.href,
                    title: document.title,
                    timestamp: new Date().toISOString(),
                    userAgent: navigator.userAgent,
                    viewport: {
                        width: window.innerWidth,
                        height: window.innerHeight
                    },
                    selector: typeof selectorOrElement === 'string' ? selectorOrElement : undefined,
                    startElement: rootElement.tagName || 'unknown'
                }
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
                selector: typeof selectorOrElement === 'string' ? selectorOrElement : undefined,
                startElement: rootElement.tagName || 'unknown'
            }
        };
    } catch (error) {
        return {
            type: 'error',
            error: (error as Error).message,
            data: null
        };
    }

    /* eslint-enable no-undef */
}
