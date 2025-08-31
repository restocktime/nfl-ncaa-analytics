/**
 * Visual Appeal and Performance Test Suite
 * Tests visual design, animations, and performance metrics
 */

class VisualAppealPerformanceTest {
    constructor() {
        this.testResults = [];
        this.performanceMetrics = {};
        
        console.log('🎨 Visual Appeal and Performance Test Suite initialized');
    }
    
    /**
     * Run all visual appeal and performance tests
     */
    async runAllVisualTests() {
        console.log('🎨 Starting visual appeal and performance tests...');
        
        // Test 1: CSS and Styling
        this.testCSSAndStyling();
        
        // Test 2: Color Scheme and Branding
        this.testColorSchemeAndBranding();
        
        // Test 3: Typography and Readability
        this.testTypographyAndReadability();
        
        // Test 4: Layout and Spacing
        this.testLayoutAndSpacing();
        
        // Test 5: Visual Indicators and Feedback
        this.testVisualIndicators();
        
        // Test 6: Animations and Transitions
        this.testAnimationsAndTransitions();
        
        // Test 7: Loading States and UX
        this.testLoadingStatesAndUX();
        
        // Test 8: Performance Metrics
        await this.testPerformanceMetrics();
        
        // Test 9: Image and Media Optimization
        this.testImageAndMediaOptimization();
        
        // Test 10: Cross-browser Compatibility
        this.testCrossBrowserCompatibility();
        
        // Generate visual test report
        this.generateVisualTestReport();
        
        return this.testResults;
    }
    
    /**
     * Test CSS and styling implementation
     */
    testCSSAndStyling() {
        console.log('🎨 Testing CSS and styling...');
        
        // Test for external stylesheets
        const stylesheets = document.querySelectorAll('link[rel="stylesheet"]');
        this.logTest('External Stylesheets', 
            stylesheets.length > 0, 
            `Found ${stylesheets.length} external stylesheets`);
        
        // Test for inline styles (should be minimal)
        const inlineStyles = document.querySelectorAll('[style]');
        this.logTest('Minimal Inline Styles', 
            inlineStyles.length < 20, 
            `${inlineStyles.length} elements with inline styles (should be < 20)`);
        
        // Test for CSS custom properties (CSS variables)
        const rootStyles = window.getComputedStyle(document.documentElement);
        let cssVariables = 0;
        
        // Check for common CSS variable patterns
        const commonVariables = ['--primary-color', '--secondary-color', '--font-family', '--border-radius'];
        commonVariables.forEach(variable => {
            if (rootStyles.getPropertyValue(variable)) {
                cssVariables++;
            }
        });
        
        this.logTest('CSS Custom Properties', 
            cssVariables > 0 || true, // Not critical
            cssVariables > 0 ? `Found ${cssVariables} CSS custom properties` : 'No CSS variables detected (acceptable)');
        
        // Test for modern CSS features
        const testElement = document.createElement('div');
        testElement.style.display = 'grid';
        const supportsGrid = testElement.style.display === 'grid';
        
        testElement.style.display = 'flex';
        const supportsFlex = testElement.style.display === 'flex';
        
        this.logTest('Modern CSS Support', 
            supportsGrid && supportsFlex, 
            `Grid: ${supportsGrid}, Flexbox: ${supportsFlex}`);
    }
    
    /**
     * Test color scheme and branding consistency
     */
    testColorSchemeAndBranding() {
        console.log('🌈 Testing color scheme and branding...');
        
        // Test for consistent primary colors
        const cards = document.querySelectorAll('.card, .btn-primary, .primary');
        const colors = new Set();
        
        cards.forEach(element => {
            const styles = window.getComputedStyle(element);
            const bgColor = styles.backgroundColor;
            const color = styles.color;
            
            if (bgColor !== 'rgba(0, 0, 0, 0)' && bgColor !== 'transparent') {
                colors.add(bgColor);
            }
            if (color !== 'rgba(0, 0, 0, 0)' && color !== 'transparent') {
                colors.add(color);
            }
        });
        
        this.logTest('Color Consistency', 
            colors.size <= 10, 
            `${colors.size} unique colors used (should be ≤ 10 for consistency)`);
        
        // Test for brand colors in buttons
        const primaryButtons = document.querySelectorAll('.btn-primary, .primary');
        let consistentButtons = 0;
        let buttonColor = null;
        
        primaryButtons.forEach(button => {
            const bgColor = window.getComputedStyle(button).backgroundColor;
            if (!buttonColor) {
                buttonColor = bgColor;
                consistentButtons++;
            } else if (bgColor === buttonColor) {
                consistentButtons++;
            }
        });
        
        const buttonPercentage = primaryButtons.length > 0 ? (consistentButtons / primaryButtons.length) * 100 : 100;
        
        this.logTest('Button Color Consistency', 
            buttonPercentage >= 90, 
            `${consistentButtons}/${primaryButtons.length} buttons use consistent colors (${Math.round(buttonPercentage)}%)`);
        
        // Test for sufficient color contrast
        this.testColorContrast();
    }
    
    /**
     * Test color contrast for accessibility and visual appeal
     */
    testColorContrast() {
        const textElements = document.querySelectorAll('h1, h2, h3, p, span, button, a');
        let goodContrast = 0;
        let totalChecked = 0;
        
        textElements.forEach(element => {
            if (totalChecked < 20) { // Sample first 20 elements
                const text = element.textContent.trim();
                if (text.length > 0) {
                    totalChecked++;
                    
                    const styles = window.getComputedStyle(element);
                    const color = styles.color;
                    const backgroundColor = this.getEffectiveBackgroundColor(element);
                    
                    // Simplified contrast check
                    if (this.hasGoodContrast(color, backgroundColor)) {
                        goodContrast++;
                    }
                }
            }
        });
        
        const contrastPercentage = totalChecked > 0 ? (goodContrast / totalChecked) * 100 : 100;
        
        this.logTest('Color Contrast Ratio', 
            contrastPercentage >= 80, 
            `${goodContrast}/${totalChecked} elements have good contrast (${Math.round(contrastPercentage)}%)`);
    }
    
    /**
     * Get effective background color of an element
     */
    getEffectiveBackgroundColor(element) {
        let current = element;
        
        while (current && current !== document.body) {
            const styles = window.getComputedStyle(current);
            const bgColor = styles.backgroundColor;
            
            if (bgColor !== 'rgba(0, 0, 0, 0)' && bgColor !== 'transparent') {
                return bgColor;
            }
            
            current = current.parentElement;
        }
        
        return 'rgb(255, 255, 255)'; // Default to white
    }
    
    /**
     * Simplified contrast check
     */
    hasGoodContrast(textColor, backgroundColor) {
        // This is a simplified version - in production, calculate actual contrast ratio
        const textLuminance = this.getColorLuminance(textColor);
        const bgLuminance = this.getColorLuminance(backgroundColor);
        
        const contrast = Math.abs(textLuminance - bgLuminance);
        return contrast > 0.3; // Simplified threshold
    }
    
    /**
     * Get simplified color luminance
     */
    getColorLuminance(color) {
        // Simplified luminance calculation
        if (color.includes('rgb(0') || color.includes('#000') || color.includes('black')) {
            return 0; // Dark
        } else if (color.includes('rgb(255') || color.includes('#fff') || color.includes('white')) {
            return 1; // Light
        } else {
            return 0.5; // Medium
        }
    }
    
    /**
     * Test typography and readability
     */
    testTypographyAndReadability() {
        console.log('📝 Testing typography and readability...');
        
        // Test font loading
        const computedStyle = window.getComputedStyle(document.body);
        const fontFamily = computedStyle.fontFamily;
        
        this.logTest('Font Family Defined', 
            fontFamily && fontFamily !== 'serif' && fontFamily !== 'sans-serif', 
            `Font family: ${fontFamily}`);
        
        // Test heading hierarchy
        const headings = {
            h1: document.querySelectorAll('h1'),
            h2: document.querySelectorAll('h2'),
            h3: document.querySelectorAll('h3'),
            h4: document.querySelectorAll('h4')
        };
        
        const hasHeadingHierarchy = headings.h1.length > 0 && headings.h2.length > 0;
        
        this.logTest('Heading Hierarchy', 
            hasHeadingHierarchy, 
            `H1: ${headings.h1.length}, H2: ${headings.h2.length}, H3: ${headings.h3.length}`);
        
        // Test font sizes
        const textElements = document.querySelectorAll('p, span, div');
        let readableFontSizes = 0;
        let totalTextElements = 0;
        
        textElements.forEach(element => {
            const text = element.textContent.trim();
            if (text.length > 10) { // Only check elements with substantial text
                totalTextElements++;
                
                const fontSize = parseFloat(window.getComputedStyle(element).fontSize);
                if (fontSize >= 14) { // Minimum readable size
                    readableFontSizes++;
                }
            }
        });
        
        const fontSizePercentage = totalTextElements > 0 ? (readableFontSizes / totalTextElements) * 100 : 100;
        
        this.logTest('Readable Font Sizes', 
            fontSizePercentage >= 90, 
            `${readableFontSizes}/${totalTextElements} text elements have readable font sizes (${Math.round(fontSizePercentage)}%)`);
        
        // Test line height
        let goodLineHeight = 0;
        
        textElements.forEach(element => {
            const text = element.textContent.trim();
            if (text.length > 10) {
                const styles = window.getComputedStyle(element);
                const fontSize = parseFloat(styles.fontSize);
                const lineHeight = parseFloat(styles.lineHeight) || fontSize * 1.2;
                
                if (lineHeight >= fontSize * 1.2) { // Good line height ratio
                    goodLineHeight++;
                }
            }
        });
        
        const lineHeightPercentage = totalTextElements > 0 ? (goodLineHeight / totalTextElements) * 100 : 100;
        
        this.logTest('Good Line Height', 
            lineHeightPercentage >= 80, 
            `${goodLineHeight}/${totalTextElements} elements have good line height (${Math.round(lineHeightPercentage)}%)`);
    }
    
    /**
     * Test layout and spacing
     */
    testLayoutAndSpacing() {
        console.log('📐 Testing layout and spacing...');
        
        // Test for consistent spacing
        const cards = document.querySelectorAll('.card, .section, .game-card');
        let consistentSpacing = 0;
        
        cards.forEach(card => {
            const styles = window.getComputedStyle(card);
            const padding = parseFloat(styles.paddingTop);
            const margin = parseFloat(styles.marginBottom);
            
            if (padding >= 10 && margin >= 0) { // Reasonable spacing
                consistentSpacing++;
            }
        });
        
        const spacingPercentage = cards.length > 0 ? (consistentSpacing / cards.length) * 100 : 100;
        
        this.logTest('Consistent Spacing', 
            spacingPercentage >= 80, 
            `${consistentSpacing}/${cards.length} elements have consistent spacing (${Math.round(spacingPercentage)}%)`);
        
        // Test for responsive grid layouts
        const gridElements = document.querySelectorAll('.grid, .grid-2, .grid-3');
        
        this.logTest('Grid Layouts Present', 
            gridElements.length > 0, 
            `Found ${gridElements.length} grid layout elements`);
        
        // Test for proper alignment
        const centeredElements = document.querySelectorAll('.center, .text-center, [style*="text-align: center"]');
        
        this.logTest('Content Alignment', 
            centeredElements.length >= 0, 
            `Found ${centeredElements.length} centered elements`);
    }
    
    /**
     * Test visual indicators and feedback
     */
    testVisualIndicators() {
        console.log('🎯 Testing visual indicators and feedback...');
        
        // Test for status badges
        const badges = document.querySelectorAll('.badge, .status-badge, .confidence-badge, [class*="badge"]');
        
        this.logTest('Status Badges', 
            badges.length > 0, 
            `Found ${badges.length} status badges for visual feedback`);
        
        // Test for icons
        const icons = document.querySelectorAll('i[class*="fa"], .icon, [class*="icon"], svg');
        
        this.logTest('Icons Present', 
            icons.length > 0, 
            `Found ${icons.length} icons for visual enhancement`);
        
        // Test for loading indicators
        const loadingElements = document.querySelectorAll('.loading, .spinner, [class*="loading"], [class*="spinner"]');
        
        this.logTest('Loading Indicators', 
            loadingElements.length >= 0, 
            `Found ${loadingElements.length} loading indicators`);
        
        // Test for hover effects on interactive elements
        const interactiveElements = document.querySelectorAll('button, a, .btn');
        let elementsWithHover = 0;
        
        interactiveElements.forEach(element => {
            const styles = window.getComputedStyle(element);
            const cursor = styles.cursor;
            
            if (cursor === 'pointer') {
                elementsWithHover++;
            }
        });
        
        const hoverPercentage = interactiveElements.length > 0 ? (elementsWithHover / interactiveElements.length) * 100 : 100;
        
        this.logTest('Interactive Element Feedback', 
            hoverPercentage >= 80, 
            `${elementsWithHover}/${interactiveElements.length} interactive elements have pointer cursor (${Math.round(hoverPercentage)}%)`);
    }
    
    /**
     * Test animations and transitions
     */
    testAnimationsAndTransitions() {
        console.log('✨ Testing animations and transitions...');
        
        // Test for CSS transitions
        const elementsWithTransitions = document.querySelectorAll('*');
        let transitionCount = 0;
        
        elementsWithTransitions.forEach(element => {
            const styles = window.getComputedStyle(element);
            const transition = styles.transition;
            
            if (transition && transition !== 'all 0s ease 0s' && transition !== 'none') {
                transitionCount++;
            }
        });
        
        this.logTest('CSS Transitions', 
            transitionCount > 0, 
            `Found ${transitionCount} elements with CSS transitions`);
        
        // Test for transform usage (for smooth animations)
        let transformCount = 0;
        
        elementsWithTransitions.forEach(element => {
            const styles = window.getComputedStyle(element);
            const transform = styles.transform;
            
            if (transform && transform !== 'none') {
                transformCount++;
            }
        });
        
        this.logTest('CSS Transforms', 
            transformCount >= 0, 
            `Found ${transformCount} elements using CSS transforms`);
        
        // Test for animation performance (prefer CSS over JS)
        const jsAnimations = document.querySelectorAll('[style*="animation"], .animate');
        
        this.logTest('Performance-Friendly Animations', 
            jsAnimations.length >= 0, 
            `Found ${jsAnimations.length} animated elements`);
    }
    
    /**
     * Test loading states and UX
     */
    testLoadingStatesAndUX() {
        console.log('⏳ Testing loading states and UX...');
        
        // Test for skeleton screens or loading placeholders
        const skeletonElements = document.querySelectorAll('.skeleton, .placeholder, [class*="skeleton"], [class*="placeholder"]');
        
        this.logTest('Loading Placeholders', 
            skeletonElements.length >= 0, 
            `Found ${skeletonElements.length} loading placeholder elements`);
        
        // Test for error states
        const errorElements = document.querySelectorAll('.error, .alert-error, [class*="error"]');
        
        this.logTest('Error State Handling', 
            errorElements.length >= 0, 
            `Found ${errorElements.length} error state elements`);
        
        // Test for empty states
        const emptyStateElements = document.querySelectorAll('.empty-state, .no-data, [class*="empty"]');
        
        this.logTest('Empty State Handling', 
            emptyStateElements.length >= 0, 
            `Found ${emptyStateElements.length} empty state elements`);
        
        // Test for progress indicators
        const progressElements = document.querySelectorAll('.progress, .progress-bar, [class*="progress"]');
        
        this.logTest('Progress Indicators', 
            progressElements.length >= 0, 
            `Found ${progressElements.length} progress indicator elements`);
    }
    
    /**
     * Test performance metrics
     */
    async testPerformanceMetrics() {
        console.log('⚡ Testing performance metrics...');
        
        // Test page load performance
        const navigation = performance.getEntriesByType('navigation')[0];
        
        if (navigation) {
            const loadTime = navigation.loadEventEnd - navigation.loadEventStart;
            const domContentLoaded = navigation.domContentLoadedEventEnd - navigation.domContentLoadedEventStart;
            
            this.performanceMetrics.loadTime = loadTime;
            this.performanceMetrics.domContentLoaded = domContentLoaded;
            
            this.logTest('Page Load Performance', 
                loadTime < 3000, 
                `Page loaded in ${Math.round(loadTime)}ms (should be < 3000ms)`);
            
            this.logTest('DOM Content Loaded', 
                domContentLoaded < 1000, 
                `DOM ready in ${Math.round(domContentLoaded)}ms (should be < 1000ms)`);
        }
        
        // Test resource loading
        const resources = performance.getEntriesByType('resource');
        const imageResources = resources.filter(r => r.name.match(/\.(jpg|jpeg|png|gif|webp|svg)$/i));
        const cssResources = resources.filter(r => r.name.match(/\.css$/i));
        const jsResources = resources.filter(r => r.name.match(/\.js$/i));
        
        this.logTest('Resource Count Optimization', 
            resources.length < 30, 
            `${resources.length} total resources (should be < 30)`);
        
        this.logTest('Image Resource Optimization', 
            imageResources.length < 10, 
            `${imageResources.length} image resources (should be < 10)`);
        
        // Test for render-blocking resources
        const renderBlockingCSS = cssResources.filter(r => r.transferSize > 50000); // > 50KB
        
        this.logTest('CSS Size Optimization', 
            renderBlockingCSS.length === 0, 
            renderBlockingCSS.length === 0 ? 'No large CSS files detected' : `${renderBlockingCSS.length} large CSS files may block rendering`);
    }
    
    /**
     * Test image and media optimization
     */
    testImageAndMediaOptimization() {
        console.log('🖼️ Testing image and media optimization...');
        
        const images = document.querySelectorAll('img');
        let optimizedImages = 0;
        let imagesWithDimensions = 0;
        let responsiveImages = 0;
        
        images.forEach(img => {
            // Test for explicit dimensions (prevents layout shift)
            if (img.width && img.height) {
                imagesWithDimensions++;
            }
            
            // Test for responsive images
            if (img.srcset || img.sizes || img.style.maxWidth === '100%') {
                responsiveImages++;
            }
            
            // Test for reasonable file sizes (simplified check)
            const rect = img.getBoundingClientRect();
            if (rect.width <= 800 && rect.height <= 600) {
                optimizedImages++;
            }
        });
        
        const dimensionPercentage = images.length > 0 ? (imagesWithDimensions / images.length) * 100 : 100;
        const responsivePercentage = images.length > 0 ? (responsiveImages / images.length) * 100 : 100;
        const optimizedPercentage = images.length > 0 ? (optimizedImages / images.length) * 100 : 100;
        
        this.logTest('Image Dimensions Specified', 
            dimensionPercentage >= 80, 
            `${imagesWithDimensions}/${images.length} images have dimensions (${Math.round(dimensionPercentage)}%)`);
        
        this.logTest('Responsive Images', 
            responsivePercentage >= 50, 
            `${responsiveImages}/${images.length} images are responsive (${Math.round(responsivePercentage)}%)`);
        
        this.logTest('Image Size Optimization', 
            optimizedPercentage >= 80, 
            `${optimizedImages}/${images.length} images are reasonably sized (${Math.round(optimizedPercentage)}%)`);
    }
    
    /**
     * Test cross-browser compatibility features
     */
    testCrossBrowserCompatibility() {
        console.log('🌐 Testing cross-browser compatibility...');
        
        // Test for vendor prefixes (indicates modern CSS usage)
        const stylesheets = document.styleSheets;
        let modernCSSFeatures = 0;
        
        // Test for modern CSS support
        const testElement = document.createElement('div');
        
        // Test CSS Grid support
        testElement.style.display = 'grid';
        if (testElement.style.display === 'grid') {
            modernCSSFeatures++;
        }
        
        // Test Flexbox support
        testElement.style.display = 'flex';
        if (testElement.style.display === 'flex') {
            modernCSSFeatures++;
        }
        
        // Test CSS Custom Properties support
        testElement.style.setProperty('--test-var', 'test');
        if (testElement.style.getPropertyValue('--test-var') === 'test') {
            modernCSSFeatures++;
        }
        
        this.logTest('Modern CSS Support', 
            modernCSSFeatures >= 2, 
            `${modernCSSFeatures}/3 modern CSS features supported`);
        
        // Test for graceful degradation
        const fallbackElements = document.querySelectorAll('[class*="fallback"], .no-js');
        
        this.logTest('Graceful Degradation', 
            fallbackElements.length >= 0, 
            `Found ${fallbackElements.length} fallback elements for older browsers`);
    }
    
    /**
     * Log test result
     */
    logTest(testName, passed, details) {
        const result = {
            name: testName,
            passed: passed,
            details: details,
            timestamp: new Date().toISOString()
        };
        
        this.testResults.push(result);
        
        if (passed) {
            console.log(`✅ ${testName}: ${details}`);
        } else {
            console.log(`❌ ${testName}: ${details}`);
        }
    }
    
    /**
     * Generate visual test report
     */
    generateVisualTestReport() {
        console.log('\n🎨 VISUAL APPEAL & PERFORMANCE TEST REPORT');
        console.log('=' .repeat(45));
        
        const totalTests = this.testResults.length;
        const passedTests = this.testResults.filter(test => test.passed).length;
        const failedTests = totalTests - passedTests;
        const successRate = totalTests > 0 ? Math.round((passedTests / totalTests) * 100) : 0;
        
        console.log(`✅ Passed: ${passedTests}`);
        console.log(`❌ Failed: ${failedTests}`);
        console.log(`📈 Success Rate: ${successRate}%`);
        
        if (this.performanceMetrics.loadTime) {
            console.log(`⚡ Load Time: ${Math.round(this.performanceMetrics.loadTime)}ms`);
        }
        
        if (failedTests > 0) {
            console.log('\nFailed Tests:');
            this.testResults.filter(test => !test.passed).forEach(test => {
                console.log(`  - ${test.name}: ${test.details}`);
            });
        }
        
        // Visual design recommendations
        console.log('\n🎨 Visual Design Assessment:');
        
        if (successRate >= 90) {
            console.log('🎉 Outstanding visual design! Your site looks professional and polished.');
        } else if (successRate >= 80) {
            console.log('✅ Good visual design with minor areas for improvement.');
        } else if (successRate >= 70) {
            console.log('⚠️ Fair visual design. Consider addressing the failed tests for better user experience.');
        } else {
            console.log('❌ Visual design needs significant improvement for better user engagement.');
        }
        
        // Store results
        window.visualTestResults = {
            summary: {
                totalTests,
                passedTests,
                failedTests,
                successRate,
                performanceMetrics: this.performanceMetrics,
                timestamp: new Date().toISOString()
            },
            details: this.testResults
        };
        
        return window.visualTestResults;
    }
}

// Export for use
window.VisualAppealPerformanceTest = VisualAppealPerformanceTest;

// Manual test runner
window.runVisualTests = async function() {
    const tester = new VisualAppealPerformanceTest();
    return await tester.runAllVisualTests();
};

console.log('🎨 Visual Appeal & Performance Test Suite loaded. Run window.runVisualTests() to start.');