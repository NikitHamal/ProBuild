# ProBuild (Frontend)

A modern web-based UI/UX for a visual app creation platform, inspired by Sketchware, built with HTML, CSS, and vanilla JavaScript. This project focuses on providing the frontend interface for designing and managing app projects.

## Features

*   **Project Management**: Create, open, and manage multiple app projects.
*   **Visual Editor (`editor.html`)**:
    *   Drag-and-drop interface for designing app layouts.
    *   Library of common UI components (Buttons, TextFields, etc.).
    *   Property editor panel to customize component attributes.
    *   Support for multiple screens within a single project.
    *   Block-based logic editor (using Blockly).
    *   Basic code editor view.
*   **Home Page (`index.html`)**: Dashboard to view and access existing projects.
*   **Local Storage**: Project data is saved directly in the browser's `localStorage`.
*   **(Experimental) Build System**: Includes logic for preparing project files for a potential build process (details in `js/editor/build/`).
*   **(Experimental) GitHub Integration**: Basic functionality for saving/loading projects to GitHub repos (details in `js/editor/build/GitHubService.js`).

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
│   ├── config/          # Configuration files (e.g., component definitions)
│   ├── editor/          # Core editor logic (views, components, events, build)
│   ├── utils/           # Utility functions
│   ├── app-service.js   # Service for app data management (localStorage)
│   ├── home-view.js     # Logic for the home page (project listing)
│   └── editor-view.js   # Main entry point for the editor (likely deprecated/simple loader)
├── components/          # Reusable UI Web Components (e.g., navbar, dialogs)
├── index.html           # Home page / Project dashboard entry point
├── editor.html          # Main visual editor entry point
└── README.md            # This file
```

## Getting Started

1.  **Clone the repository:**
    ```bash
    git clone <repository-url>
    cd ProBuild # Or your renamed directory
    ```
2.  **Open in Browser:** Simply open the `index.html` file in your web browser. No build step is required for basic usage.

## Development Notes

*   **Frameworks**: Built with vanilla HTML, CSS, and JavaScript (ES6 Modules).
*   **Dependencies**: Uses Blockly for the blocks editor (loaded via CDN).
*   **Styling**: Primarily custom CSS, potentially utility classes (inspect `styles.css`).
*   **State Management**: Simple state management through classes and potentially `localStorage`.

## Disclaimer

This is a frontend-only implementation for demonstrating the UI/UX of a visual app builder. The build system and GitHub integration are experimental and may require a separate backend or further development to be fully functional. 