import { googleFonts } from './constants.js'; // We'll move googleFonts here later

class PropertyValueUtils {
    /**
     * Parses a width or height string value (e.g., "100px", "wrap_content") 
     * into an object containing the type and numerical value.
     * @param {string | number | null} value - The width or height value.
     * @returns {{type: string, value: number | null}}
     */
    static parseWidthHeightValue(value) {
        if (!value) return { type: 'wrap_content', value: null };

        if (['wrap_content', 'match_parent'].includes(value)) {
            return { type: value, value: null };
        }

        if (typeof value === 'string' && value.endsWith('px')) {
            const numValue = parseInt(value.replace('px', ''), 10);
            return { type: 'fixed', value: isNaN(numValue) ? null : numValue };
        }
        
        if (typeof value === 'number') {
            return { type: 'fixed', value: value };
        }

        // Fallback for potentially invalid string values
        return { type: 'wrap_content', value: null };
    }

    /**
     * Converts various color formats (named, rgb, potentially rgba) into a hex string
     * suitable for a color input element. Returns a fallback color if conversion fails.
     * @param {string} value - The color string.
     * @param {string} [fallback='#FFFFFF'] - The fallback hex color.
     * @returns {string} - The hex color string.
     */
    static formatColorForInput(value, fallback = '#FFFFFF') {
        if (!value || value === 'transparent') {
            return fallback; // Use fallback for transparent or empty
        } 
        if (value.startsWith('#')) {
            // Already hex
            return value;
        } 
        
        // Attempt to convert other formats (named, rgb) to hex
        try {
            const tempDiv = document.createElement('div');
            // Set color on the temp div
            tempDiv.style.color = value; 
            // Append to body to allow computed style calculation
            document.body.appendChild(tempDiv); 
            // Get the computed style (likely in rgb format)
            const computedColor = window.getComputedStyle(tempDiv).color; 
             // Remove the temp div
            document.body.removeChild(tempDiv);

            // Convert rgb(r, g, b) to hex #rrggbb
            const rgbMatch = computedColor.match(/^rgb\((\d+),\s*(\d+),\s*(\d+)\)$/);
            if (rgbMatch) {
                const r = parseInt(rgbMatch[1], 10);
                const g = parseInt(rgbMatch[2], 10);
                const b = parseInt(rgbMatch[3], 10);
                // Ensure values are within 0-255 range
                const safeR = Math.max(0, Math.min(255, r));
                const safeG = Math.max(0, Math.min(255, g));
                const safeB = Math.max(0, Math.min(255, b));
                
                // Convert each component to hex and pad with zero if needed
                const hex = '#' + 
                    safeR.toString(16).padStart(2, '0') +
                    safeG.toString(16).padStart(2, '0') +
                    safeB.toString(16).padStart(2, '0');
                return hex.toUpperCase(); // Return uppercase hex
            }
        } catch (e) {
            console.warn(`Could not convert color "${value}" to hex. Using fallback.`, e);
        }
        
        // If conversion failed or format wasn't rgb, return fallback
        return fallback; 
    }

    /**
     * Loads the necessary Google Fonts stylesheet into the document head.
     */
    static loadGoogleFonts() {
        if (!document.getElementById('google-fonts-link') && googleFonts && googleFonts.length > 0) {
            const fontParams = googleFonts.map(font => `family=${font.replace(/ /g, '+')}:wght@400;700`).join('&'); // Load regular and bold weights if available
            const link = document.createElement('link');
            link.id = 'google-fonts-link';
            link.rel = 'stylesheet';
            link.href = `https://fonts.googleapis.com/css2?${fontParams}&display=swap`;
            document.head.appendChild(link);
            console.log('Loading Google Fonts:', link.href);
        }
    }
}

export default PropertyValueUtils; 