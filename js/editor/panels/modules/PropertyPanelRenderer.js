import { googleFonts } from './constants.js';

class PropertyPanelRenderer {
    /**
     * Generates the HTML for the Google Font options.
     * @returns {string}
     */
    static _generateFontOptions() {
        return googleFonts.map(font =>
            `<option value="${font}">${font}</option>`
        ).join('');
    }

    /**
     * Renders the complete HTML structure for the property panel in the sidebar.
     * @returns {string} - The HTML string for the property panel.
     */
    static renderSidebarPropertyPanel() {
        const fontOptionsHtml = this._generateFontOptions();

        return `
            <div class="property-panel" id="property-panel">
                <div class="no-component-selected" id="no-component-message">
                    <i class="material-icons">touch_app</i>
                    <p>Select a component to edit properties</p>
                </div>
                <div id="property-groups-container" style="display: none;">
                    ${this._renderPositionGroup()}
                    ${this._renderLayoutGroup()}
                    ${this._renderAppearanceGroup()}
                    ${this._renderTextGroup(fontOptionsHtml)}
                    ${this._renderEffectsGroup()}
                    ${this._renderComponentSpecificGroup()}
                    ${this._renderIdentityGroup()}
                    ${this._renderDeleteGroup()}
                </div>
            </div>
        `;
    }

    // --- Private helper methods to render each group --- 

    static _renderGroupHeader(title) {
        return `
            <div class="property-group-header">
                <div class="property-group-title">${title}</div>
                <i class="material-icons property-group-toggle">expand_more</i>
            </div>
        `;
    }

    static _renderPositionGroup() {
        return `
            <div class="property-group">
                ${this._renderGroupHeader('Position')}
                <div class="property-rows">
                    <div class="property-row">
                        <div class="property-label">X</div>
                        <div class="property-input"><input type="number" id="prop-x" placeholder="X"></div>
                    </div>
                    <div class="property-row">
                        <div class="property-label">Y</div>
                        <div class="property-input"><input type="number" id="prop-y" placeholder="Y"></div>
                    </div>
                </div>
            </div>
        `;
    }

    static _renderLayoutGroup() {
        return `
            <div class="property-group">
                ${this._renderGroupHeader('Layout')}
                <div class="property-rows">
                    <div class="property-row">
                        <div class="property-label">Width</div>
                        <div class="property-input">
                            <select id="prop-width-type">
                                <option value="wrap_content">Wrap</option>
                                <option value="match_parent">Match</option>
                                <option value="fixed">Fixed</option>
                            </select>
                        </div>
                    </div>
                    <div class="property-row" id="custom-width-row" style="display: none;">
                        <div class="property-label">Width px</div>
                        <div class="property-input"><input type="number" id="prop-width-value" placeholder="Width in px"></div>
                    </div>
                    <div class="property-row">
                        <div class="property-label">Height</div>
                        <div class="property-input">
                            <select id="prop-height-type">
                                <option value="wrap_content">Wrap</option>
                                <option value="match_parent">Match</option>
                                <option value="fixed">Fixed</option>
                            </select>
                        </div>
                    </div>
                    <div class="property-row" id="custom-height-row" style="display: none;">
                        <div class="property-label">Height px</div>
                        <div class="property-input"><input type="number" id="prop-height-value" placeholder="Height in px"></div>
                    </div>
                    <div class="property-row">
                        <div class="property-label">Margin</div>
                        <div class="property-input"><input type="text" id="prop-margin" placeholder="e.g. 8px"></div>
                    </div>
                    <div class="property-row">
                        <div class="property-label">Padding</div>
                        <div class="property-input"><input type="text" id="prop-padding" placeholder="e.g. 8px"></div>
                    </div>
                </div>
            </div>
        `;
    }

    static _renderAppearanceGroup() {
        return `
            <div class="property-group">
                ${this._renderGroupHeader('Appearance')}
                <div class="property-rows">
                    <div class="property-row">
                        <div class="property-label">Background</div>
                        <div class="property-input color-input">
                            <input type="color" id="prop-bgcolor">
                            <div class="color-preview" id="bgcolor-preview"></div>
                        </div>
                    </div>
                    <div class="property-row color-none-row">
                        <div class="property-label"></div>
                        <div class="property-input">
                            <button type="button" id="bgcolor-none" class="none-btn">None</button>
                        </div>
                    </div>
                    <div class="property-row">
                        <div class="property-label">Opacity</div>
                        <div class="property-input">
                            <div class="slider-container">
                                <input type="range" id="prop-opacity-slider" min="0" max="100" value="100">
                                <input type="number" id="prop-opacity" min="0" max="100" value="100">
                            </div>
                        </div>
                    </div>
                    <div class="property-row">
                        <div class="property-label">Corner Radius</div>
                        <div class="property-input"><input type="text" id="prop-borderradius" placeholder="e.g. 4px"></div>
                    </div>
                </div>
            </div>
        `;
    }

    static _renderTextGroup(fontOptionsHtml) {
        return `
            <div class="property-group" id="text-group">
                ${this._renderGroupHeader('Text')}
                <div class="property-rows">
                    <div class="property-row" data-prop="text">
                        <div class="property-label">Content</div>
                        <div class="property-input"><input type="text" id="prop-text" placeholder="Text"></div>
                    </div>
                    <div class="property-row" data-prop="textSize">
                        <div class="property-label">Size</div>
                        <div class="property-input"><input type="number" id="prop-textsize"></div>
                    </div>
                    <div class="property-row" data-prop="textColor">
                        <div class="property-label">Color</div>
                        <div class="property-input color-input">
                            <input type="color" id="prop-textcolor">
                            <div class="color-preview" id="textcolor-preview"></div>
                        </div>
                    </div>
                    <div class="property-row" data-prop="font">
                        <div class="property-label">Font</div>
                        <div class="property-input">
                            <select id="prop-font">
                                <option value="">Default</option>
                                ${fontOptionsHtml}
                            </select>
                        </div>
                    </div>
                </div>
            </div>
        `;
    }

    static _renderEffectsGroup() {
        return `
            <div class="property-group">
                ${this._renderGroupHeader('Effects')}
                <div class="property-rows">
                    <div class="property-row">
                        <div class="property-label">Border Color</div>
                        <div class="property-input color-input">
                            <input type="color" id="prop-bordercolor">
                            <div class="color-preview" id="bordercolor-preview"></div>
                        </div>
                    </div>
                    <div class="property-row color-none-row">
                        <div class="property-label"></div>
                        <div class="property-input">
                            <button type="button" id="bordercolor-none" class="none-btn">None</button>
                        </div>
                    </div>
                    <div class="property-row">
                        <div class="property-label">Shadow</div>
                        <div class="property-input"><input type="text" id="prop-boxshadow" placeholder="e.g. 2px 2px 5px #888"></div>
                    </div>
                </div>
            </div>
        `;
    }

    static _renderComponentSpecificGroup() {
        return `
            <div class="property-group" id="component-specific-group">
                ${this._renderGroupHeader('Component Options')}
                <div class="property-rows">
                    <!-- EditText Specific -->
                    <div class="property-row" data-prop="hint" style="display:none;">
                        <div class="property-label">Hint</div>
                        <div class="property-input"><input type="text" id="prop-hint" placeholder="Hint"></div>
                    </div>
                    <div class="property-row" data-prop="hintColor" style="display:none;">
                        <div class="property-label">Hint Color</div>
                        <div class="property-input color-input">
                            <input type="color" id="prop-hintcolor">
                            <div class="color-preview" id="hintcolor-preview"></div>
                        </div>
                    </div>
                    <!-- ImageView Specific -->
                    <div class="property-row" data-prop="src" style="display:none;">
                        <div class="property-label">Image URL</div>
                        <div class="property-input"><input type="text" id="prop-src" placeholder="Image URL"></div>
                    </div>
                    <div class="property-row" data-prop="imageUpload" style="display:none;">
                        <div class="property-label">Local Image</div>
                        <div class="property-input">
                            <button type="button" id="upload-image-btn" class="image-upload-btn">
                                <i class="material-icons">upload</i> Upload
                            </button>
                            <input type="file" id="image-file-input" accept="image/*" style="display:none;">
                        </div>
                    </div>
                    <div class="property-row" data-prop="savedImages" style="display:none;">
                        <div class="property-label">Saved Images</div>
                        <div class="property-input">
                            <button type="button" id="show-saved-images-btn" class="image-library-btn">
                                <i class="material-icons">photo_library</i> Browse
                            </button>
                        </div>
                    </div>
                    <div class="property-row" data-prop="scaleType" style="display:none;">
                        <div class="property-label">Scale Type</div>
                        <div class="property-input">
                            <select id="prop-scaleType">
                                <option value="contain">Contain</option>
                                <option value="cover">Cover</option>
                                <option value="fill">Fill</option>
                                <option value="fitCenter">Fit Center</option>
                            </select>
                        </div>
                    </div>
                    <!-- Checkable Specific -->
                    <div class="property-row" data-prop="checked" style="display:none;">
                        <div class="property-label">Checked</div>
                        <div class="property-input"><input type="checkbox" id="prop-checked"></div>
                    </div>
                    <!-- Progress Specific -->
                    <div class="property-row" data-prop="progress" style="display:none;">
                        <div class="property-label">Progress</div>
                        <div class="property-input"><input type="number" id="prop-progress" min="0" max="100"></div>
                    </div>
                    <div class="property-row" data-prop="max" style="display:none;">
                        <div class="property-label">Max Value</div>
                        <div class="property-input"><input type="number" id="prop-max" min="1"></div>
                    </div>
                    <!-- Spinner (Dropdown) Specific -->
                    <div class="property-row" data-prop="items" style="display:none;">
                        <div class="property-label">Items</div>
                        <div class="property-input"><input type="text" id="prop-items" placeholder="Item1,Item2,Item3"></div>
                    </div>
                    <!-- WebView Specific -->
                    <div class="property-row" data-prop="url" style="display:none;">
                        <div class="property-label">URL</div>
                        <div class="property-input"><input type="text" id="prop-url" placeholder="https://..."></div>
                    </div>
                    <!-- Radio & Orientation Controls -->
                    <div class="property-row" data-prop="orientation" style="display:none;">
                        <div class="property-label">Orientation</div>
                        <div class="property-input">
                            <select id="prop-orientation">
                                <option value="horizontal">Horizontal</option>
                                <option value="vertical">Vertical</option>
                            </select>
                        </div>
                    </div>
                </div>
            </div>
        `;
    }

    static _renderIdentityGroup() {
        return `
            <div class="property-group">
                ${this._renderGroupHeader('Identity')}
                <div class="property-rows">
                    <div class="property-row">
                        <div class="property-label">ID</div>
                        <div class="property-input"><input type="text" id="prop-id" placeholder="Component ID"></div>
                    </div>
                    <div class="property-row">
                        <div class="property-label">Type</div>
                        <div class="property-input"><input type="text" id="prop-type" placeholder="Component Type" readonly></div>
                    </div>
                </div>
            </div>
        `;
    }

    /**
     * Renders the delete component button group
     * @returns {string} The HTML string for the delete button
     */
    static _renderDeleteGroup() {
        return `
            <div class="property-group delete-group">
                <button id="delete-component-btn" class="delete-component-btn">
                    <i class="material-icons">delete</i> Delete Component
                </button>
            </div>
        `;
    }
}

export default PropertyPanelRenderer; 