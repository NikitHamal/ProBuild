class AlignmentOverlayHandler {
    constructor(editorView, componentManager) {
        this.editorView = editorView;
        this.componentManager = componentManager;
        this.snapThreshold = 5; // Pixels threshold for snapping
    }

    /**
     * Initializes the containers for alignment guides and dimension overlays.
     */
    initOverlays() {
        const previewContainer = document.getElementById('preview-container');
        if (!previewContainer) return;

        // Ensure overlay containers exist
        if (!document.getElementById('alignment-guides')) {
            const alignmentGuides = document.createElement('div');
            alignmentGuides.id = 'alignment-guides';
            previewContainer.appendChild(alignmentGuides);
        }
        if (!document.getElementById('dimension-overlay')) {
            const dimensionOverlay = document.createElement('div');
            dimensionOverlay.id = 'dimension-overlay';
            previewContainer.appendChild(dimensionOverlay);
        }
    }

     /**
     * Calculates the snapped position for a component being dragged.
     * @param {number} currentX - The current raw X position.
     * @param {number} currentY - The current raw Y position.
     * @param {number} width - The width of the component being dragged.
     * @param {number} height - The height of the component being dragged.
     * @param {string} draggedComponentId - The ID of the component being dragged.
     * @returns {object} - { x: snappedX, y: snappedY, lines: activeSnapLines[] }
     */
    calculateSnapPosition(currentX, currentY, width, height, draggedComponentId) {
        let snappedX = currentX;
        let snappedY = currentY;
        let activeSnapLines = [];
        let snapOffsetX = 0;
        let snapOffsetY = 0;

        const previewContainer = document.getElementById('preview-container');
        if (!previewContainer || !this.editorView.currentScreen) {
            return { x: currentX, y: currentY, lines: [] };
        }

        // Targets: Container edges and center
        const containerWidth = previewContainer.clientWidth;
        const containerHeight = previewContainer.clientHeight;
        const containerCenterX = containerWidth / 2;
        const containerCenterY = containerHeight / 2;

        const targets = [
            // Container vertical
            { type: 'v', edge: 'left', pos: 0 },
            { type: 'v', edge: 'center', pos: containerCenterX },
            { type: 'v', edge: 'right', pos: containerWidth },
            // Container horizontal
            { type: 'h', edge: 'top', pos: 0 },
            { type: 'h', edge: 'center', pos: containerCenterY },
            { type: 'h', edge: 'bottom', pos: containerHeight }
        ];

        // Targets: Other components
        const otherComponents = this.editorView.currentScreen.components.filter(c => c.id !== draggedComponentId);
        otherComponents.forEach(comp => {
            const compElement = document.querySelector(`.preview-component[data-component-id="${comp.id}"]`);
            if (!compElement) return;
            const compProps = comp.properties;
            const compX = compProps.x || 0;
            const compY = compProps.y || 0;
            const compWidth = compElement.offsetWidth;
            const compHeight = compElement.offsetHeight;

            // Vertical edges + center
            targets.push({ type: 'v', edge: 'left', pos: compX });
            targets.push({ type: 'v', edge: 'center', pos: compX + compWidth / 2 });
            targets.push({ type: 'v', edge: 'right', pos: compX + compWidth });
            // Horizontal edges + center
            targets.push({ type: 'h', edge: 'top', pos: compY });
            targets.push({ type: 'h', edge: 'center', pos: compY + compHeight / 2 });
            targets.push({ type: 'h', edge: 'bottom', pos: compY + compHeight });
        });

        // Check snapping for vertical lines
        let hasSnappedX = false;
        [currentX, currentX + width / 2, currentX + width].forEach((draggedPos, i) => {
            if (hasSnappedX) return; // Snap only once per axis
            for (const target of targets) {
                if (target.type === 'v') {
                    const dist = Math.abs(draggedPos - target.pos);
                    if (dist < this.snapThreshold) {
                        // Calculate the offset needed to align the dragged edge with the target edge
                        if (i === 0) snapOffsetX = target.pos - currentX;           // Align left edge
                        if (i === 1) snapOffsetX = target.pos - (currentX + width / 2); // Align center
                        if (i === 2) snapOffsetX = target.pos - (currentX + width);   // Align right edge
                        
                        activeSnapLines.push({ type: 'vertical', pos: target.pos });
                        hasSnappedX = true;
                        break; // Stop checking targets for this edge
                    }
                }
            }
        });

        // Check snapping for horizontal lines
        let hasSnappedY = false;
        [currentY, currentY + height / 2, currentY + height].forEach((draggedPos, i) => {
            if (hasSnappedY) return;
            for (const target of targets) {
                 if (target.type === 'h') {
                    const dist = Math.abs(draggedPos - target.pos);
                    if (dist < this.snapThreshold) {
                        if (i === 0) snapOffsetY = target.pos - currentY;             // Align top edge
                        if (i === 1) snapOffsetY = target.pos - (currentY + height / 2); // Align middle
                        if (i === 2) snapOffsetY = target.pos - (currentY + height);    // Align bottom edge

                        activeSnapLines.push({ type: 'horizontal', pos: target.pos });
                        hasSnappedY = true;
                        break;
                    }
                }
            }
        });

        // Apply snapping offsets
        snappedX = currentX + snapOffsetX;
        snappedY = currentY + snapOffsetY;

        return { x: snappedX, y: snappedY, lines: activeSnapLines };
    }

    /**
     * Draws alignment guides on the screen based on active snap lines.
     * @param {Array<object>} lines - Array of line objects { type: 'horizontal'/'vertical', pos: number }.
     */
    drawAlignmentGuides(lines) {
        const guidesContainer = document.getElementById('alignment-guides');
        if (!guidesContainer) return;
        guidesContainer.innerHTML = ''; // Clear previous guides

        lines.forEach(line => {
            const guide = document.createElement('div');
            guide.className = `alignment-guide ${line.type}`;
            if (line.type === 'horizontal') {
                guide.style.top = `${line.pos}px`;
                 guide.style.left = '0';
                guide.style.width = '100%';
                guide.style.height = '1px';
            } else { // vertical
                guide.style.left = `${line.pos}px`;
                guide.style.top = '0';
                guide.style.height = '100%';
                guide.style.width = '1px';
            }
            guidesContainer.appendChild(guide);
        });
    }

    /**
     * Clears all visible alignment guides.
     */
    clearAlignmentGuides() {
        const guidesContainer = document.getElementById('alignment-guides');
        if (guidesContainer) {
            guidesContainer.innerHTML = '';
        }
    }

    /**
     * Updates the dimension overlay to show the size and position of a component.
     * @param {object} component - The component data object.
     * @param {HTMLElement} [element] - The corresponding DOM element (optional, can be queried).
     */
    updateDimensionOverlay(component, element) {
        const overlay = document.getElementById('dimension-overlay');
        if (!overlay) return;
        overlay.innerHTML = ''; // Clear previous

        if (!component) return; // Do nothing if no component is selected/provided

        const targetElement = element || document.querySelector(`.preview-component[data-component-id="${component.id}"]`);
        if (!targetElement) return;

        const rect = targetElement.getBoundingClientRect();
        const parentRect = targetElement.parentElement.getBoundingClientRect();

        // Get position relative to parent (preview-container)
        const relativeX = rect.left - parentRect.left + targetElement.parentElement.scrollLeft;
        const relativeY = rect.top - parentRect.top + targetElement.parentElement.scrollTop;
        const width = rect.width;
        const height = rect.height;

        // Create text element for dimensions
        const dimensionText = document.createElement('div');
        dimensionText.className = 'dimension-text';
        dimensionText.textContent = `${Math.round(width)} × ${Math.round(height)}`;
        
        // Determine best position for dimension text to avoid overlap
        // Position at the left corner instead of centered
        let textY = Math.max(5, relativeY - 22); // Default to above
        
        // If too close to top, place it below the component instead
        if (relativeY < 30) {
            textY = relativeY + height + 16;
            dimensionText.classList.add('below');
        }
        
        // Position at left corner instead of center
        const textX = relativeX + 5; // 5px offset from left edge
        dimensionText.style.left = `${textX}px`;
        dimensionText.style.top = `${textY}px`;
        
        overlay.appendChild(dimensionText);

        // Check if resize handles exist for this component
        const hasResizeHandles = targetElement.querySelector('.resize-handle') !== null;
        
        // Only add corner markers if resize handles don't exist
        if (!hasResizeHandles) {
            // Add position indicators at corners (non-intrusive)
            const corners = [
                { name: 'top-left', x: relativeX, y: relativeY },
                { name: 'top-right', x: relativeX + width, y: relativeY },
                { name: 'bottom-left', x: relativeX, y: relativeY + height },
                { name: 'bottom-right', x: relativeX + width, y: relativeY + height }
            ];
            
            corners.forEach(corner => {
                const cornerMarker = document.createElement('div');
                cornerMarker.className = `corner-marker ${corner.name}`;
                cornerMarker.style.left = `${corner.x}px`;
                cornerMarker.style.top = `${corner.y}px`;
                overlay.appendChild(cornerMarker);
            });
        }
    }

    /**
     * Clears the dimension overlay.
     */
    clearDimensionOverlay() {
        const overlay = document.getElementById('dimension-overlay');
        if (overlay) {
            overlay.innerHTML = '';
        }
    }
}

export default AlignmentOverlayHandler; 