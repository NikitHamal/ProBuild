# Sketchware Pro (Frontend)

A modern web-based UI/UX for a Sketchware-like app creation platform built with HTML, CSS, and JavaScript.

## Features

- **App Management**: Create, edit, and delete app projects
- **Visual Editor**: Design mobile app interfaces using a drag-and-drop editor
- **Component Library**: Access common Android UI components
- **Property Editor**: Customize component properties
- **Multi-screen Support**: Create and manage multiple screens per app

## Project Structure

```
sketchware-pro/
├── css/                 # CSS files
│   ├── styles.css       # Global styles
│   ├── navbar.css       # Navbar styles
│   ├── home.css         # Home page styles
│   ├── editor.css       # Editor styles
│   ├── dialog.css       # Dialog component styles
│   ├── notifications.css # Notification styles
│   └── component-preview.css # Component preview styles
├── js/                  # JavaScript files
│   ├── app-service.js   # Service for app data management
│   ├── home-view.js     # Home page view
│   └── editor-view.js   # Editor page view
├── components/          # Reusable components
│   ├── navbar.js        # Navbar component
│   └── app-card.js      # App card component
├── index.html           # Home page
└── editor.html          # Editor page
```

## Design Guidelines

- **Font**: Poppins
- **Icons**: Material Icons
- **Border Radius**: 4px
- **Color Scheme**: Black and white

## Getting Started

1. Clone the repository
2. Open `index.html` in your browser
3. Start creating your first app!

## Building APKs with GitHub Actions

This project includes GitHub Actions workflows for automatically building Android APKs:

- **Automatic Builds**: APKs are automatically built when code is pushed to the main branch
- **Manual Builds**: APKs can be manually built using GitHub Actions workflows
- **Signed Builds**: Create signed APKs by setting up keystore secrets in your repository

For detailed instructions on using GitHub Actions to build APKs, see [.github/README.md](.github/README.md).

## Notes

This is a frontend-only implementation. All data is stored in the browser's localStorage. 