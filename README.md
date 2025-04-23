# ProBuild

A modern web-based visual app creation platform, inspired by Sketchware, built with HTML, CSS, and vanilla JavaScript. This project provides both frontend and backend capabilities for designing, managing, and building mobile applications.

## Features

*   **Project Management**: Create, open, and manage multiple app projects.
*   **Visual Editor (`editor.html`)**:
    *   Drag-and-drop interface for designing app layouts.
    *   Library of common UI components (Buttons, TextFields, etc.).
    *   Property editor panel to customize component attributes.
    *   Support for multiple screens within a single project.
    *   Block-based logic editor (using Blockly).
    *   Advanced code editor with syntax highlighting.
*   **Home Page (`index.html`)**: Dashboard to view and access existing projects.
*   **Storage Solutions**:
    *   **Local Storage**: Basic project data stored in browser's `localStorage`.
    *   **IndexedDB**: Advanced storage for images and larger project assets.
*   **Build System**: Complete Android application build pipeline via GitHub Actions:
    *   Generates full Android Studio project structure.
    *   Creates all necessary Java files, layouts, and resources.
    *   Prepares Gradle build scripts and configuration.
    *   Produces APK files ready for installation.
*   **GitHub Integration**: Fully functional GitHub repository management:
    *   Project saving/loading to GitHub repositories.
    *   Automated workflows for building apps in the cloud.
    *   APK artifact management and download capabilities.

## Project Structure

```
.
├── css/                 # CSS Stylesheets
│   ├── styles.css       # Global styles
│   ├── navbar.css       # Navbar component styles
│   ├── home.css         # Home page specific styles
│   ├── editor.css       # Editor interface styles
│   ├── dialog.css       # Dialog/Modal styles
│   ├── notifications.css # Notification styles
│   ├── component-preview.css # Styles for component previews
│   ├── blocks-editor.css # Blockly editor styles
│   ├── code-editor.css  # Code editor styles
│   └── build-manager.css # Build manager styles
├── js/                  # JavaScript Logic
│   ├── editor/          # Core editor logic
│   │   ├── build/       # Build system and GitHub integration
│   │   │   ├── ProjectBuilder.js       # Android project generator
│   │   │   ├── GitHubService.js        # GitHub API integration
│   │   │   ├── BuildUIManager.js       # Build UI controller
│   │   │   └── BuildWorkflowManager.js # Orchestrates build process
│   │   ├── blocks/      # Block programming components
│   │   ├── code/        # Code editor functionality
│   │   ├── components/  # UI component definitions
│   │   ├── dialogs/     # Modal dialog controllers
│   │   ├── handlers/    # Event handlers
│   │   ├── managers/    # Feature managers
│   │   ├── panels/      # Panel UI controllers
│   │   ├── services/    # Backend services
│   │   └── utils/       # Editor utilities
│   ├── utils/           # Utility functions
│   │   └── IndexedDBManager.js # Image and asset storage
│   ├── ui/              # UI utilities
│   │   └── NotificationManager.js # Toast notifications
│   ├── app-service.js   # Service for app data management
│   ├── home-view.js     # Logic for the home page
│   └── editor-view.js   # Main entry point for the editor
├── components/          # Reusable UI Web Components
├── index.html           # Home page / Project dashboard
├── editor.html          # Main visual editor
└── README.md            # This file
```

## Getting Started

1.  **Clone the repository:**
    ```bash
    git clone <repository-url>
    cd ProBuild
    ```
2.  **Open in Browser:** Simply open the `index.html` file in your web browser. No build step is required for basic usage.

3.  **GitHub Integration Setup (Optional):**
    * Create a GitHub personal access token with appropriate permissions.
    * Enter your GitHub credentials in the build panel of the editor.

## Development Notes

*   **Frameworks**: Built with vanilla HTML, CSS, and JavaScript (ES6 Modules).
*   **Dependencies**: 
    * Blockly for the blocks editor (loaded via CDN).
    * IndexedDB for client-side storage of images and assets.
    * GitHub API for repository management and workflow triggering.
*   **Styling**: Primarily custom CSS with utility classes.
*   **Data Storage**: 
    * Projects stored in localStorage (basic data) and IndexedDB (images).
    * Option to persist projects to GitHub repositories.
*   **Build System**: 
    * Generates complete Android Studio projects.
    * Uses GitHub Actions workflows for cloud-based builds.
    * Produces installable APK files with appropriate Android manifests.

## Building Apps

1. Create and design your app in the visual editor.
2. Navigate to the Build tab in the editor.
3. Connect your GitHub account.
4. Click "Build APK" to initiate the build process.
5. Download the compiled APK from the GitHub repository's Actions tab.

## Disclaimer

This project has evolved beyond a frontend-only implementation and now includes backend functionality for a more complete visual app builder experience. The build system and GitHub integration are fully functional parts of the application.