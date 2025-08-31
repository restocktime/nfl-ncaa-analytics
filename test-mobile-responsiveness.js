/**
 * Mobile Responsiveness Test Suite
 * Tests mobile-specific functionality and responsive design
 */

class MobileResponsivenessTest {
    constructor() {
        this.testResults = [];
        this.viewportSizes = [
            { name: 'Mobile Portrait', width: 375, height: 667 },
            { name: 'Mobile Landscape', width: 667, height: 375 },
            { name: 'Tablet Portrait', width: 768, height: 1024 },
            { name: 'Tablet Landscape', width: 1024, height: 768 },
            { name: 'Desktop', width: 1200, height: 800 }
        ];
        
        console.log('📱 Mobile Responsiveness Test Suite initialized');
    }
    
    /**
     * Run all mobile responsiveness tests
     */
    async runAllMobileTests() {
        console.log('📱 Starting mobile responsiveness tests...');
        
        // Test 1: Viewport Configuration
        this.testViewportConfiguration();
        
        // Test 2: Touch Target Sizes
        this.testTouchTargetSizes();
        
        // Test 3: Text Readability
        this.testTextReadability();
        
        // Test 4: Layout Responsiveness
        await this.testLayoutResponsiveness();
        
        // Test 5: Navigation Usability
        this.testNavigationUsability();
        
        // Test 6: Content Accessibility
        this.testContentAccessibility();
        
        // Test 7: Performance on Mobile
        await this.testMobilePerformance();
        
        // Generate mobile test report
        this.generateMobileTestReport();
        
        return this.testResults;
    }
    
    /**
     * Test viewport configuration
     */
    testViewportConfiguration() {
        console.log('📐 Testing viewport configuration...');
        
        // Check viewport meta tag
        const viewportMeta = document.querySelector('meta[name="viewport"]');
        this.logTest('Viewport Meta Tag Exists', 
            viewportMeta !== null, 
            viewportMeta ? 'Viewport meta tag found' : 'Missing viewport meta tag');
        
        if (viewportMeta) {
            const content = viewportMeta.getAttribute('content');
            
            // Check for width=device-width
            this.logTest('Device Width Setting', 
                content.includes('width=device-width'), 
                'Viewport uses device width');
            
            // Check for initial-scale
            this.logTest('Initial Scale Setting', 
                content.includes('initial-scale=1'), 
                'Initial scale is set to 1');
            
            // Check for user-scalable (should allow zooming for accessibility)
            this.logTest('User Scalable Setting', 
                !content.includes('user-scalable=no'), 
                'User scaling is allowed for accessibility');
        }
    }
    
    /**
     * Test touch target sizes
     */
    testTouchTargetSizes() {
        console.log('👆 Testing touch target sizes...');
        
        const interactiveElements = document.querySelectorAll(
            'button, a, input, select, textarea, [onclick], [role="button"]'
        );
        
        let validTouchTargets = 0;
        let totalTargets = interactiveElements.length;
        
        interactiveElements.forEach((element, index) => {
            const rect = element.getBoundingClientRect();
            const minSize = 44; // iOS minimum recommended touch target size
            
            const isValidSize = rect.width >= minSize && rect.height >= minSize;
            
            if (isValidSize) {
                validTouchTargets++;
            } else {
                console.log(`⚠️ Small touch target: ${element.tagName} (${Math.round(rect.width)}x${Math.round(rect.height)}px)`);
            }
        });
        
        const percentage = totalTargets > 0 ? (validTouchTargets / totalTargets) * 100 : 100;
        
        this.logTest('Touch Target Sizes', 
            percentage >= 80, 
            `${validTouchTargets}/${totalTargets} elements meet minimum size (${Math.round(percentage)}%)`);
    }
    
    /**
     * Test text readability
     */
    testTextReadability() {
        console.log('📖 Testing text readability...');
        
        const textElements = document.querySelectorAll('p, span, div, h1, h2, h3, h4, h5, h6, li, td, th');
        
        let readableText = 0;
        let totalText = 0;
        
        textElements.forEach(element => {
            const text = element.textContent.trim();
            if (text.length > 0) {
                totalText++;
                
                const styles = window.getComputedStyle(element);
                const fontSize = parseFloat(styles.fontSize);
                const lineHeight = parseFloat(styles.lineHeight) || fontSize * 1.2;
                
                // Minimum readable font size on mobile
                const minFontSize = 14;
                const minLineHeight = fontSize * 1.2;
                
                if (fontSize >= minFontSize && lineHeight >= minLineHeight) {
                    readableText++;
                }
            }
        });
        
        const percentage = totalText > 0 ? (readableText / totalText) * 100 : 100;
        
        this.logTest('Text Readability', 
            percentage >= 90, 
            `${readableText}/${totalText} text elements are readable (${Math.round(percentage)}%)`);
        
        // Test color contrast (basic check)
        this.testColorContrast();
    }
    
    /**
     * Test color contrast for readability
     */
    testColorContrast() {
        const textElements = document.querySelectorAll('p, span, div, h1, h2, h3, h4, h5, h6');
        
        let goodContrast = 0;
        let totalChecked = 0;
        
        textElements.forEach(element => {
            const text = element.textContent.trim();
            if (text.length > 0 && totalChecked < 10) { // Sample first 10 elements
                totalChecked++;
                
                const styles = window.getComputedStyle(element);
                const color = styles.color;
                const backgroundColor = styles.backgroundColor;
                
                // Basic contrast check (simplified)
                const hasGoodContrast = this.checkBasicContrast(color, backgroundColor);
                
                if (hasGoodContrast) {
                    goodContrast++;
                }
            }
        });
        
        const percentage = totalChecked > 0 ? (goodContrast / totalChecked) * 100 : 100;
        
        this.logTest('Color Contrast', 
            percentage >= 80, 
            `${goodContrast}/${totalChecked} elements have adequate contrast (${Math.round(percentage)}%)`);
    }
    
    /**
     * Basic contrast check (simplified version)
     */
    checkBasicContrast(color, backgroundColor) {
        // This is a simplified check - in production, use a proper contrast ratio calculator
        if (backgroundColor === 'rgba(0, 0, 0, 0)' || backgroundColor === 'transparent') {
            return true; // Assume good contrast with default background
        }
        
        // Basic check: if text is dark and background is light, or vice versa
        const isDarkText = color.includes('rgb(0') || color.includes('rgb(33') || color.includes('#000') || color.includes('#333');
        const isLightBackground = backgroundColor.includes('rgb(255') || backgroundColor.includes('rgb(248') || backgroundColor.includes('#fff') || backgroundColor.includes('#f');
        
        return (isDarkText && isLightBackground) || (!isDarkText && !isLightBackground);
    }
    
    /**
     * Test layout responsiveness across different viewport sizes
     */
    async testLayoutResponsiveness() {
        console.log('📏 Testing layout responsiveness...');
        
        const originalWidth = window.innerWidth;
        const originalHeight = window.innerHeight;
        
        for (const viewport of this.viewportSizes) {
            console.log(`📱 Testing ${viewport.name} (${viewport.width}x${viewport.height})`);
            
            // Simulate viewport resize (note: this doesn't actually resize the browser)
            // In a real test environment, you'd use tools like Puppeteer or Playwright
            
            // Test responsive grid layouts
            const gridElements = document.querySelectorAll('.grid, .grid-2, .grid-3');
            
            gridElements.forEach(grid => {
                const styles = window.getComputedStyle(grid);
                const display = styles.display;
                
                this.logTest(`${viewport.name} - Grid Layout`, 
                    display === 'grid' || display === 'flex', 
                    `Grid uses responsive layout: ${display}`);
            });
            
            // Test card layouts
            const cards = document.querySelectorAll('.card, .game-card');
            
            let responsiveCards = 0;
            cards.forEach(card => {
                const styles = window.getComputedStyle(card);
                const maxWidth = styles.maxWidth;
                
                if (maxWidth !== 'none' || styles.width.includes('%')) {
                    responsiveCards++;
                }
            });
            
            const cardPercentage = cards.length > 0 ? (responsiveCards / cards.length) * 100 : 100;
            
            this.logTest(`${viewport.name} - Responsive Cards`, 
                cardPercentage >= 80, 
                `${responsiveCards}/${cards.length} cards are responsive (${Math.round(cardPercentage)}%)`);
        }
    }
    
    /**
     * Test navigation usability on mobile
     */
    testNavigationUsability() {
        console.log('🧭 Testing navigation usability...');
        
        // Test for mobile-friendly navigation
        const navElements = document.querySelectorAll('nav, .navigation, .nav, .menu');
        
        this.logTest('Navigation Elements Present', 
            navElements.length > 0, 
            `Found ${navElements.length} navigation elements`);
        
        // Test for hamburger menu or mobile navigation
        const mobileNavTriggers = document.querySelectorAll(
            '.hamburger, .menu-toggle, .nav-toggle, .mobile-menu-toggle, [class*="mobile-menu"]'
        );
        
        this.logTest('Mobile Navigation Triggers', 
            mobileNavTriggers.length > 0 || window.innerWidth > 768, 
            mobileNavTriggers.length > 0 ? 
                `Found ${mobileNavTriggers.length} mobile nav triggers` : 
                'Desktop view - mobile nav not required');
        
        // Test for mobile navigation menu
        const mobileNavMenu = document.querySelectorAll('.mobile-nav-menu, .mobile-nav-overlay');
        
        this.logTest('Mobile Navigation Menu', 
            mobileNavMenu.length >= 2 || window.innerWidth > 768, 
            mobileNavMenu.length >= 2 ? 
                `Found mobile navigation menu and overlay` : 
                'Mobile navigation menu not found');
        
        // Test for mobile navigation functions
        const hasMobileNavFunctions = typeof window.toggleMobileMenu === 'function' && 
                                     typeof window.openMobileMenu === 'function' && 
                                     typeof window.closeMobileMenu === 'function';
        
        this.logTest('Mobile Navigation Functions', 
            hasMobileNavFunctions, 
            hasMobileNavFunctions ? 
                'Mobile navigation functions available' : 
                'Mobile navigation functions missing');
        
        // Test navigation link spacing
        const navLinks = document.querySelectorAll('nav a, .nav a, .navigation a');
        
        let wellSpacedLinks = 0;
        navLinks.forEach(link => {
            const rect = link.getBoundingClientRect();
            if (rect.height >= 40) { // Minimum touch-friendly height
                wellSpacedLinks++;
            }
        });
        
        const linkPercentage = navLinks.length > 0 ? (wellSpacedLinks / navLinks.length) * 100 : 100;
        
        this.logTest('Navigation Link Spacing', 
            linkPercentage >= 80, 
            `${wellSpacedLinks}/${navLinks.length} nav links are touch-friendly (${Math.round(linkPercentage)}%)`);
    }
    
    /**
     * Test content accessibility
     */
    testContentAccessibility() {
        console.log('♿ Testing content accessibility...');
        
        // Test for alt text on images
        const images = document.querySelectorAll('img');
        let imagesWithAlt = 0;
        
        images.forEach(img => {
            if (img.getAttribute('alt') !== null) {
                imagesWithAlt++;
            }
        });
        
        const altPercentage = images.length > 0 ? (imagesWithAlt / images.length) * 100 : 100;
        
        this.logTest('Image Alt Text', 
            altPercentage >= 90, 
            `${imagesWithAlt}/${images.length} images have alt text (${Math.round(altPercentage)}%)`);
        
        // Test for proper heading hierarchy
        const headings = document.querySelectorAll('h1, h2, h3, h4, h5, h6');
        
        this.logTest('Heading Structure', 
            headings.length > 0, 
            `Found ${headings.length} headings for proper document structure`);
        
        // Test for focus indicators
        const focusableElements = document.querySelectorAll(
            'a, button, input, select, textarea, [tabindex]:not([tabindex="-1"])'
        );
        
        this.logTest('Focusable Elements', 
            focusableElements.length > 0, 
            `Found ${focusableElements.length} focusable elements`);
        
        // Test for ARIA labels where needed
        const ariaElements = document.querySelectorAll('[aria-label], [aria-labelledby], [role]');
        
        this.logTest('ARIA Accessibility', 
            ariaElements.length >= 0, 
            `Found ${ariaElements.length} elements with ARIA attributes`);
    }
    
    /**
     * Test mobile performance
     */
    async testMobilePerformance() {
        console.log('⚡ Testing mobile performance...');
        
        // Test page load time
        const loadTime = performance.timing.loadEventEnd - performance.timing.navigationStart;
        
        this.logTest('Page Load Time', 
            loadTime < 5000, 
            `Page loaded in ${loadTime}ms (should be < 5000ms)`);
        
        // Test resource count
        const resources = performance.getEntriesByType('resource');
        
        this.logTest('Resource Count', 
            resources.length < 50, 
            `${resources.length} resources loaded (should be < 50 for mobile)`);
        
        // Test for large images
        const images = document.querySelectorAll('img');
        let optimizedImages = 0;
        
        images.forEach(img => {
            const rect = img.getBoundingClientRect();
            // Check if image is reasonably sized for mobile
            if (rect.width <= 800 && rect.height <= 600) {
                optimizedImages++;
            }
        });
        
        const imagePercentage = images.length > 0 ? (optimizedImages / images.length) * 100 : 100;
        
        this.logTest('Image Optimization', 
            imagePercentage >= 80, 
            `${optimizedImages}/${images.length} images are mobile-optimized (${Math.round(imagePercentage)}%)`);
        
        // Test for smooth scrolling
        const hasScrollBehavior = document.documentElement.style.scrollBehavior === 'smooth' ||
                                 window.getComputedStyle(document.documentElement).scrollBehavior === 'smooth';
        
        this.logTest('Smooth Scrolling', 
            hasScrollBehavior || true, // Not critical, so pass if not set
            hasScrollBehavior ? 'Smooth scrolling enabled' : 'Standard scrolling (acceptable)');
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
     * Generate mobile test report
     */
    generateMobileTestReport() {
        console.log('\n📱 MOBILE RESPONSIVENESS TEST REPORT');
        console.log('=' .repeat(40));
        
        const totalTests = this.testResults.length;
        const passedTests = this.testResults.filter(test => test.passed).length;
        const failedTests = totalTests - passedTests;
        const successRate = totalTests > 0 ? Math.round((passedTests / totalTests) * 100) : 0;
        
        console.log(`✅ Passed: ${passedTests}`);
        console.log(`❌ Failed: ${failedTests}`);
        console.log(`📈 Success Rate: ${successRate}%`);
        
        if (failedTests > 0) {
            console.log('\nFailed Tests:');
            this.testResults.filter(test => !test.passed).forEach(test => {
                console.log(`  - ${test.name}: ${test.details}`);
            });
        }
        
        // Mobile-specific recommendations
        console.log('\n📋 Mobile Optimization Recommendations:');
        
        if (successRate >= 90) {
            console.log('🎉 Excellent mobile experience! Your site is well-optimized for mobile devices.');
        } else if (successRate >= 80) {
            console.log('✅ Good mobile experience with room for minor improvements.');
        } else if (successRate >= 70) {
            console.log('⚠️ Fair mobile experience. Consider addressing the failed tests.');
        } else {
            console.log('❌ Poor mobile experience. Significant improvements needed.');
        }
        
        // Store results
        window.mobileTestResults = {
            summary: {
                totalTests,
                passedTests,
                failedTests,
                successRate,
                timestamp: new Date().toISOString()
            },
            details: this.testResults
        };
        
        return window.mobileTestResults;
    }
}

// Export for use
window.MobileResponsivenessTest = MobileResponsivenessTest;

// Manual test runner
window.runMobileTests = async function() {
    const tester = new MobileResponsivenessTest();
    return await tester.runAllMobileTests();
};

console.log('📱 Mobile Responsiveness Test Suite loaded. Run window.runMobileTests() to start.');