class LibraryManager {
    constructor(editorView) {
        this.editorView = editorView;
        this.libraryCategories = [
            {
                name: "UI Components",
                libraries: [
                    { 
                        id: "material",
                        name: "Material Design Components", 
                        implementation: "com.google.android.material:material:1.10.0",
                        description: "Material Design components like FloatingActionButton, BottomNavigationView, etc.",
                        selected: true
                    },
                    { 
                        id: "constraintlayout",
                        name: "ConstraintLayout", 
                        implementation: "androidx.constraintlayout:constraintlayout:2.1.4",
                        description: "Flexible layout system for complex UI hierarchies",
                        selected: true
                    },
                    { 
                        id: "appcompat",
                        name: "AppCompat", 
                        implementation: "androidx.appcompat:appcompat:1.6.1",
                        description: "Backward compatibility for newer Android features",
                        selected: true
                    },
                    { 
                        id: "cardview",
                        name: "CardView", 
                        implementation: "androidx.cardview:cardview:1.0.0",
                        description: "Material Design card components with shadow and rounded corners",
                        selected: false
                    },
                    { 
                        id: "recyclerview",
                        name: "RecyclerView", 
                        implementation: "androidx.recyclerview:recyclerview:1.3.0",
                        description: "Efficient display of large data sets with custom layouts",
                        selected: false
                    }
                ]
            },
            {
                name: "Networking",
                libraries: [
                    { 
                        id: "retrofit",
                        name: "Retrofit", 
                        implementation: "com.squareup.retrofit2:retrofit:2.9.0",
                        description: "Type-safe HTTP client for Android and Java",
                        selected: false
                    },
                    { 
                        id: "okhttp",
                        name: "OkHttp", 
                        implementation: "com.squareup.okhttp3:okhttp:4.11.0",
                        description: "HTTP client for efficient network requests",
                        selected: false
                    },
                    { 
                        id: "gson",
                        name: "Gson", 
                        implementation: "com.google.code.gson:gson:2.10.1",
                        description: "Java library to convert Java Objects into JSON and back",
                        selected: false
                    }
                ]
            },
            {
                name: "Image Loading",
                libraries: [
                    { 
                        id: "glide",
                        name: "Glide", 
                        implementation: "com.github.bumptech.glide:glide:4.15.1",
                        annotationProcessor: "com.github.bumptech.glide:compiler:4.15.1",
                        description: "Fast and efficient image loading and caching library",
                        selected: false
                    },
                    { 
                        id: "picasso",
                        name: "Picasso", 
                        implementation: "com.squareup.picasso:picasso:2.8",
                        description: "Powerful image downloading and caching library",
                        selected: false
                    }
                ]
            },
            {
                name: "Database",
                libraries: [
                    { 
                        id: "room",
                        name: "Room Database", 
                        implementation: "androidx.room:room-runtime:2.5.2",
                        annotationProcessor: "androidx.room:room-compiler:2.5.2",
                        description: "SQLite database abstraction layer with compile-time verification",
                        selected: false
                    },
                    { 
                        id: "sqliteandroid",
                        name: "SQLite Android", 
                        implementation: "androidx.sqlite:sqlite:2.3.1",
                        description: "Android SQLite database support library",
                        selected: false
                    }
                ]
            },
            {
                name: "Lifecycle & Architecture",
                libraries: [
                    { 
                        id: "lifecycle",
                        name: "Lifecycle Components", 
                        implementation: "androidx.lifecycle:lifecycle-livedata:2.6.1\n    implementation 'androidx.lifecycle:lifecycle-viewmodel:2.6.1'",
                        description: "Handle lifecycle events and build data-driven UIs",
                        selected: false
                    },
                    { 
                        id: "navigation",
                        name: "Navigation Component", 
                        implementation: "androidx.navigation:navigation-fragment:2.7.2\n    implementation 'androidx.navigation:navigation-ui:2.7.2'",
                        description: "Navigate between fragments with consistent experience",
                        selected: false
                    }
                ]
            }
        ];
    }

    getSelectedLibraries() {
        const selectedLibraries = [];
        this.libraryCategories.forEach(category => {
            category.libraries.forEach(library => {
                if (library.selected) {
                    selectedLibraries.push(library);
                }
            });
        });
        return selectedLibraries;
    }

    generateDependenciesBlock() {
        const selectedLibraries = this.getSelectedLibraries();
        let dependenciesBlock = "dependencies {\n";
        
        // Add selected libraries
        selectedLibraries.forEach(library => {
            dependenciesBlock += `    implementation '${library.implementation}'\n`;
            if (library.annotationProcessor) {
                dependenciesBlock += `    annotationProcessor '${library.annotationProcessor}'\n`;
            }
        });
        
        // Add standard dependencies if not already included
        const hasJunit = selectedLibraries.some(lib => lib.implementation.includes('junit'));
        if (!hasJunit) {
            dependenciesBlock += "    testImplementation 'junit:junit:4.13.2'\n";
            dependenciesBlock += "    androidTestImplementation 'androidx.test.ext:junit:1.1.5'\n";
            dependenciesBlock += "    androidTestImplementation 'androidx.test.espresso:espresso-core:3.5.1'\n";
        }
        
        dependenciesBlock += "}";
        return dependenciesBlock;
    }

    showLibraryManagerDialog() {
        const DialogUtility = this.editorView.dialogUtility || window.DialogUtility;
        
        // Create category HTML sections
        const categoriesHtml = this.libraryCategories.map(category => {
            const librariesHtml = category.libraries.map(library => {
                return `
                <div class="library-item">
                    <div class="library-header">
                        <label class="library-checkbox-wrapper">
                            <input type="checkbox" class="library-checkbox" 
                                   data-id="${library.id}" ${library.selected ? 'checked' : ''}>
                            <span class="library-name">${library.name}</span>
                        </label>
                        <span class="library-version">${library.implementation.split(':').pop()}</span>
                    </div>
                    <div class="library-description">${library.description}</div>
                    <div class="library-implementation">implementation '${library.implementation}'</div>
                </div>
                `;
            }).join('');

            return `
            <div class="library-category">
                <h3>${category.name}</h3>
                <div class="library-list">
                    ${librariesHtml}
                </div>
            </div>
            `;
        }).join('');

        // Create full dialog content
        const contentHtml = `
        <div class="library-manager-container">
            <p class="dialog-description">Configure external libraries and dependencies for your app. Selected libraries will be added to your app's build.gradle file.</p>
            
            <div class="library-search-container">
                <input type="text" id="library-search" placeholder="Search libraries...">
            </div>
            
            <div class="libraries-container">
                ${categoriesHtml}
            </div>
            
            <div class="gradle-preview">
                <h3>build.gradle Preview</h3>
                <pre id="gradle-preview-content">${this.generateDependenciesBlock()}</pre>
            </div>
        </div>
        `;

        // Footer buttons
        const actionsHtml = `
            <button class="dialog-btn cancel-btn">Cancel</button>
            <button class="dialog-btn apply-btn">Apply</button>
            <button class="dialog-btn save-btn primary">Save</button>
        `;

        // Create the dialog
        const dialog = DialogUtility.createDialog('Configure Libraries & Dependencies', contentHtml, actionsHtml, '800px');

        // Add event listeners
        const cancelBtn = dialog.querySelector('.cancel-btn');
        const applyBtn = dialog.querySelector('.apply-btn');
        const saveBtn = dialog.querySelector('.save-btn');
        const searchInput = dialog.querySelector('#library-search');
        const checkboxes = dialog.querySelectorAll('.library-checkbox');
        
        // Set up search functionality
        searchInput.addEventListener('input', (e) => {
            const searchTerm = e.target.value.toLowerCase();
            dialog.querySelectorAll('.library-item').forEach(item => {
                const name = item.querySelector('.library-name').textContent.toLowerCase();
                const desc = item.querySelector('.library-description').textContent.toLowerCase();
                const shouldShow = name.includes(searchTerm) || desc.includes(searchTerm);
                item.style.display = shouldShow ? 'block' : 'none';
            });
            
            // Show/hide categories based on if they have visible items
            dialog.querySelectorAll('.library-category').forEach(category => {
                const hasVisibleItems = Array.from(category.querySelectorAll('.library-item'))
                    .some(item => item.style.display !== 'none');
                category.style.display = hasVisibleItems ? 'block' : 'none';
            });
        });
        
        // Update preview when checkboxes change
        checkboxes.forEach(checkbox => {
            checkbox.addEventListener('change', () => {
                // Update the model
                const libraryId = checkbox.dataset.id;
                this.libraryCategories.forEach(category => {
                    category.libraries.forEach(library => {
                        if (library.id === libraryId) {
                            library.selected = checkbox.checked;
                        }
                    });
                });
                
                // Update the preview
                const previewElement = dialog.querySelector('#gradle-preview-content');
                previewElement.textContent = this.generateDependenciesBlock();
            });
        });
        
        // Button actions
        cancelBtn.addEventListener('click', () => {
            DialogUtility.closeDialog(dialog);
        });
        
        applyBtn.addEventListener('click', () => {
            this.applyLibraryChanges();
            this.editorView.notificationManager.showNotification('Library configuration applied. Build settings updated.', 'success');
        });
        
        saveBtn.addEventListener('click', () => {
            this.applyLibraryChanges();
            DialogUtility.closeDialog(dialog);
            this.editorView.notificationManager.showNotification('Library configuration saved successfully.', 'success');
        });

        return dialog;
    }
    
    applyLibraryChanges() {
        // In a real implementation, this would modify the app's build.gradle file
        // For our purpose, we'll update the app's configuration
        if (!this.editorView.currentApp) return;
        
        const selectedLibraries = this.getSelectedLibraries();
        this.editorView.currentApp.libraries = selectedLibraries;
        
        // Save the app data through the app service
        if (this.editorView.appService) {
            this.editorView.appService.updateApp(this.editorView.currentApp);
        }
    }
}

export default LibraryManager; 