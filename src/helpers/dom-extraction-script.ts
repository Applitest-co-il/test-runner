/**
 * DOM extraction script for browser context execution
 * This script runs in the browser context via WebDriverIO's driver.execute()
 */

export const DOM_EXTRACTION_SCRIPT = `
    var depthParam = arguments[0];
    var selectorParam = arguments[1];
    var rootElement;
    
    if (selectorParam) {
        var found = document.querySelector(selectorParam);
        if (!found) {
            return {
                type: 'error',
                error: 'Element not found for selector: ' + selectorParam,
                data: null
            };
        }
        rootElement = found;
    } else {
        rootElement = document.documentElement;
    }
    
    // Helper function to get computed role (mirrors accessibility-utils implementation)
    function getComputedRole(element) {
        // Try to get explicit role first
        var explicitRole = element.getAttribute('role');
        if (explicitRole) {
            return explicitRole;
        }
        
        // Derive implicit role from tag name and attributes
        var tagName = element.tagName.toLowerCase();
        
        // Helper function to determine input role
        function getInputRole(inputElement) {
            var type = inputElement.getAttribute('type') || 'text';
            var inputRoles = {
                'button': 'button',
                'submit': 'button', 
                'reset': 'button',
                'checkbox': 'checkbox',
                'radio': 'radio',
                'range': 'slider',
                'search': 'searchbox',
                'email': 'textbox',
                'tel': 'textbox',
                'url': 'textbox',
                'password': 'textbox'
            };
            return inputRoles[type] || 'textbox';
        }
        
        // Common implicit roles
        var implicitRoles = {
            'a': element.hasAttribute('href') ? 'link' : 'generic',
            'button': 'button',
            'input': getInputRole(element),
            'img': element.hasAttribute('alt') ? 'img' : 'presentation',
            'h1': 'heading',
            'h2': 'heading',
            'h3': 'heading',
            'h4': 'heading',
            'h5': 'heading',
            'h6': 'heading',
            'nav': 'navigation',
            'main': 'main',
            'aside': 'complementary',
            'section': 'region',
            'article': 'article',
            'form': 'form',
            'ul': 'list',
            'ol': 'list',
            'li': 'listitem',
            'table': 'table',
            'tr': 'row',
            'td': 'cell',
            'th': 'columnheader'
        };
        
        return implicitRoles[tagName] || 'generic';
    }
    
    function getComputedName(element) {
        // Check aria-label first
        var ariaLabel = element.getAttribute('aria-label');
        if (ariaLabel) {
            return ariaLabel.trim();
        }
        
        // Check aria-labelledby
        var labelledBy = element.getAttribute('aria-labelledby');
        if (labelledBy) {
            var labelElement = document.getElementById(labelledBy);
            if (labelElement) {
                return (labelElement.textContent || '').trim();
            }
        }
        
        // Check associated label elements
        if (element.id) {
            var label = document.querySelector('label[for="' + element.id + '"]');
            if (label) {
                return (label.textContent || '').trim();
            }
        }
        
        // For form controls, check parent label
        var parentLabel = element.closest('label');
        if (parentLabel) {
            return (parentLabel.textContent || '').trim();
        }
        
        // Check alt attribute for images
        if (element.tagName.toLowerCase() === 'img') {
            return element.getAttribute('alt') || '';
        }
        
        // Check title attribute
        var title = element.getAttribute('title');
        if (title) {
            return title.trim();
        }

        //check name attribute for inputs
        if (element.tagName.toLowerCase() === 'input' || element.tagName.toLowerCase() === 'textarea') {
            var nameAttr = element.getAttribute('name');
            if (nameAttr) {
                return nameAttr.trim();
            }
        }

        //check placeholder for inputs
        if (element.tagName.toLowerCase() === 'input' || element.tagName.toLowerCase() === 'textarea') {
            var placeholder = element.getAttribute('placeholder');
            if (placeholder) {
                return placeholder.trim();
            }
        }
        
        return '';
    }

    function getTextContent(element) {
        var tagName = element.tagName;
        if (!isTextualNode(element)) {
            return '';
        }

        if (!areChildrenTextualNodes(element)) {
            return '';
        }

        var textContent = (element.textContent || '').trim();
        return textContent ? textContent.substring(0, 100) : '';
    }

    function isExcludeTag(tagName) {
        var excludeTags = ['SCRIPT', 'STYLE', 'META', 'LINK', 'NOSCRIPT', 'HEAD'];
        return excludeTags.indexOf(tagName) !== -1;
    }

    function isTextualNode(element) {
        var textualTags = ['P', 'SPAN', 'B', 'I', 'LABEL', 'A', 'BUTTON', 'H1', 'H2', 'H3', 'H4', 'H5', 'H6', 'LI', 'TD', 'TH', 'DIV'];
        return textualTags.indexOf(element.tagName) !== -1;
    }

    function areChildrenTextualNodes(element) {
        var children = element.children;
        for (var i = 0; i < children.length; i++) {
            if (!isTextualNode(children[i])) {
                return false;
            }

            var childTagName = children[i].tagName;
            if (childTagName === 'DIV' || childTagName === 'P') {
                return false;
            }
        }
        return true;
    }

    function extractNodeInfo(element, depth) {
        depth = depth || 0;
        if (depth > depthParam) return null; // Limit depth to prevent infinite recursion
        
        var rect = element.getBoundingClientRect();
        var computedStyle = window.getComputedStyle(element);
        
        var nodeInfo = {
            tagName: element.tagName,
            id: element.id || undefined,
            className: element.className || undefined,
            role: getComputedRole(element),
            name: getComputedName(element),
            textContent: getTextContent(element),
            bounds: {
                x: Math.round(rect.x),
                y: Math.round(rect.y),
                width: Math.round(rect.width),
                height: Math.round(rect.height)
            },
            visible: computedStyle.display !== 'none' && computedStyle.visibility !== 'hidden',
            disabled: element.disabled || element.getAttribute('aria-disabled') === 'true',
            focusable: element.tabIndex >= 0 || ['INPUT', 'BUTTON', 'SELECT', 'TEXTAREA', 'A'].indexOf(element.tagName) !== -1,
            children: []
        };
        
        // Extract children (limit to "depthParam" to avoid excessive data)
        var children = element.children;
        for (var i = 0; i < Math.min(children.length, depthParam); i++) {
            var child = children[i];
            var childTagName = child.tagName;
            if (isExcludeTag(childTagName)) {
                continue;
            }
            var childInfo = extractNodeInfo(child, depth + 1);
            if (childInfo) {
                nodeInfo.children.push(childInfo);
            }
        }
        
        return nodeInfo;
    }
    
    return {
        dom: extractNodeInfo(rootElement),
        metadata: {
            url: window.location.href,
            title: document.title,
            timestamp: new Date().toISOString(),
            userAgent: navigator.userAgent,
            viewport: {
                width: window.innerWidth,
                height: window.innerHeight
            },
            selector: selectorParam
        }
    };
`;
