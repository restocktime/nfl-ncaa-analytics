/**
 * IBY Contrast Checker - Debug Tool
 * Created by IBY @benyakar94 - IG  
 * Helps identify text visibility issues
 */

class IBYContrastChecker {
    constructor() {
        this.issues = [];
        console.log('🔍 IBY Contrast Checker initializing...');
    }

    /**
     * Check contrast issues
     */
    checkContrast() {
        this.issues = [];
        
        // Get all text elements
        const textElements = document.querySelectorAll('*');
        let checkedCount = 0;
        let issuesFound = 0;

        textElements.forEach(element => {
            if (this.hasTextContent(element)) {
                const styles = window.getComputedStyle(element);
                const bgColor = styles.backgroundColor;
                const textColor = styles.color;
                
                // Check for white text on white background
                if (this.isLowContrast(textColor, bgColor)) {
                    const issue = {
                        element,
                        textColor,
                        backgroundColor: bgColor,
                        text: element.textContent?.trim().substring(0, 50),
                        className: element.className,
                        tagName: element.tagName
                    };
                    
                    this.issues.push(issue);
                    issuesFound++;
                    
                    // Auto-fix common issues
                    this.autoFix(element, issue);
                }
                checkedCount++;
            }
        });

        console.log(`🔍 Checked ${checkedCount} elements, found ${issuesFound} contrast issues`);
        
        if (this.issues.length > 0) {
            console.warn('⚠️ Contrast Issues Found:', this.issues);
            this.displayIssues();
        } else {
            console.log('✅ No contrast issues detected');
        }

        return this.issues;
    }

    /**
     * Check if element has text content
     */
    hasTextContent(element) {
        const text = element.textContent?.trim();
        const hasChildren = element.children.length === 0;
        return text && text.length > 0 && hasChildren;
    }

    /**
     * Simple contrast check
     */
    isLowContrast(textColor, bgColor) {
        // Convert colors to RGB for comparison
        const textRGB = this.parseColor(textColor);
        const bgRGB = this.parseColor(bgColor);
        
        if (!textRGB || !bgRGB) return false;
        
        // Check for white text on white/light backgrounds
        const isWhiteText = textRGB.r > 200 && textRGB.g > 200 && textRGB.b > 200;
        const isLightBg = bgRGB.r > 200 && bgRGB.g > 200 && bgRGB.b > 200;
        
        return isWhiteText && isLightBg;
    }

    /**
     * Parse color string to RGB
     */
    parseColor(colorStr) {
        if (colorStr.startsWith('rgb')) {
            const match = colorStr.match(/rgb\((\d+),\s*(\d+),\s*(\d+)\)/);
            if (match) {
                return {
                    r: parseInt(match[1]),
                    g: parseInt(match[2]),
                    b: parseInt(match[3])
                };
            }
        }
        
        if (colorStr.startsWith('#')) {
            const hex = colorStr.replace('#', '');
            return {
                r: parseInt(hex.substr(0, 2), 16),
                g: parseInt(hex.substr(2, 2), 16),
                b: parseInt(hex.substr(4, 2), 16)
            };
        }
        
        // Handle named colors
        const namedColors = {
            'white': { r: 255, g: 255, b: 255 },
            'black': { r: 0, g: 0, b: 0 },
            'transparent': null
        };
        
        return namedColors[colorStr] || null;
    }

    /**
     * Auto-fix common contrast issues
     */
    autoFix(element, issue) {
        // Apply high-priority contrast fix
        element.style.setProperty('color', 'var(--text-primary)', 'important');
        
        // Add contrast fix class
        element.classList.add('iby-contrast-fixed');
        
        console.log(`🔧 Auto-fixed: ${issue.tagName}.${issue.className}`);
    }

    /**
     * Display issues in console
     */
    displayIssues() {
        console.group('🚨 Text Contrast Issues');
        
        this.issues.forEach((issue, index) => {
            console.group(`Issue ${index + 1}: ${issue.tagName}`);
            console.log('Element:', issue.element);
            console.log('Text:', issue.text);
            console.log('Text Color:', issue.textColor);
            console.log('Background:', issue.backgroundColor);
            console.log('Classes:', issue.className);
            console.groupEnd();
        });
        
        console.groupEnd();
    }

    /**
     * Run automatic check on page load
     */
    initialize() {
        // Check after page is fully loaded
        if (document.readyState === 'complete') {
            setTimeout(() => this.checkContrast(), 1000);
        } else {
            window.addEventListener('load', () => {
                setTimeout(() => this.checkContrast(), 1000);
            });
        }

        // Add manual check function to window
        window.checkContrast = () => this.checkContrast();
        
        console.log('✅ IBY Contrast Checker ready');
        console.log('💡 Run window.checkContrast() to check for issues');
    }

    /**
     * Highlight all contrast issues visually
     */
    highlightIssues() {
        this.issues.forEach(issue => {
            issue.element.style.setProperty('outline', '2px solid red', 'important');
            issue.element.style.setProperty('outline-offset', '2px', 'important');
        });
        
        console.log(`🎯 Highlighted ${this.issues.length} contrast issues`);
    }

    /**
     * Remove highlighting
     */
    removeHighlighting() {
        document.querySelectorAll('*').forEach(element => {
            element.style.removeProperty('outline');
            element.style.removeProperty('outline-offset');
        });
        
        console.log('✨ Removed highlighting');
    }

    /**
     * Get status report
     */
    getStatus() {
        return {
            totalIssues: this.issues.length,
            lastChecked: new Date().toISOString(),
            autoFixed: document.querySelectorAll('.iby-contrast-fixed').length
        };
    }
}

// Initialize contrast checker
window.ibyContrastChecker = new IBYContrastChecker();

// Auto-initialize
document.addEventListener('DOMContentLoaded', () => {
    setTimeout(() => {
        window.ibyContrastChecker.initialize();
    }, 2000);
});

console.log('🔍 IBY Contrast Checker loaded - Automatic text visibility fixes');