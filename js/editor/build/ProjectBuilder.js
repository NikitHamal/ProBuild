import AppService from '../../app-service.js'; // May need AppService for certain data

class ProjectBuilder {
    constructor(appData) {
        this.appData = appData; // The specific app being built
        
        // Moved default resources here
        this.defaultResources = {
            ic_launcher: 'iVBORw0KGgoAAAANSUhEUgAAAGAAAABgCAYAAADimHc4AAAACXBIWXMAAAsTAAALEwEAmpwYAAAF8WlUWHRYTUw6Y29tLmFkb2JlLnhtcAAAAAAAPD94cGFja2V0IGJlZ2luPSLvu78iIGlkPSJXNU0wTXBDZWhpSHpyZVN6TlRjemtjOWQiPz4gPHg6eG1wbWV0YSB4bWxuczp4PSJhZG9iZTpuczptZXRhLyIgeDp4bXB0az0iQWRvYmUgWE1QIENvcmUgNS42LWMxNDggNzkuMTY0MDM2LCAyMDE5LzA4LzEzLTAxOjA2OjU3ICAgICAgICAiPiA8cmRmOlJERiB4bWxuczpyZGY9Imh0dHA6Ly93d3cudzMub3JnLzE5OTkvMDIvMjItcmRmLXN5bnRheC1ucyMiPiA8cmRmOkRlc2NyaXB0aW9uIHJkZjphYm91dD0iIiB4bWxuczp4bXA9Imh0dHA6Ly9ucy5hZG9iZS5jb20veGFwLzEuMC8iIHhtbG5zOmRjPSJodHRwOi8vcHVybC5vcmcvZGMvZWxlbWVudHMvMS4xLyIgeG1sbnM6cGhvdG9zaG9wPSJodHRwOi8vbnMuYWRvYmUuY29tL3Bob3Rvc2hvcC8xLjAvIiB4bWxuczp4bXBNTT0iaHR0cDovL25zLmFkb2JlLmNvbS94YXAvMS4wL21tLyIgeG1sbnM6c3RFdnQ9Imh0dHA6Ly9ucy5hZG9iZS5jb20veGFwLzEuMC9zVHlwZS9SZXNvdXJjZUV2ZW50IyIgeG1wOkNyZWF0b3JUb29sPSJBZG9iZSBQaG90b3Nob3AgMjEuMCAoV2luZG93cykiIHhtcDpDcmVhdGVEYXRlPSIyMDIzLTA5LTIwVDEwOjEwOjI3KzAyOjAwIiB4bXA6TW9kaWZ5RGF0ZT0iMjAyMy0wOS0yMFQxMDoxMjoxMSswMjowMCIgeG1wOk1ldGFkYXRhRGF0ZT0iMjAyMy0wOS0yMFQxMDoxMjoxMSswMjowMCIgZGM6Zm9ybWF0PSJpbWFnZS9wbmciIHBob3Rvc2hvcDpDb2xvck1vZGU9IjMiIHBob3Rvc2hvcDpJQ0NQcm9maWxlPSJzUkdCIElFQzYxOTY2LTIuMSIgeG1wTU06SW5zdGFuY2VJRD0ieG1wLmlpZDowZDc2YmYzZC1kMDY2LWQzNGEtYjA0NC1iNTYzYjRmZTMzYmQiIHhtcE1NOkRvY3VtZW50SUQ9InhtcC5kaWQ6NmVlZmM4NmUtNTU2YS1lZTRmLTk3MTktNTBhMTEwYmQ3M2QxIiB4bXBNTTpPcmlnaW5hbERvY3VtZW50SUQ9InhtcC5kaWQ6NmVlZmM4NmUtNTU2YS1lZTRmLTk3MTktNTBhMTEwYmQ3M2QxIj4gPHhtcE1NOkhpc3Rvcnk+IDxyZGY6U2VxPiA8cmRmOmxpIHN0RXZ0OmFjdGlvbj0iY3JlYXRlZCIgc3RFdnQ6aW5zdGFuY2VJRD0ieG1wLmlpZDo2ZWVmYzg2ZS01NTZhLWVlNGYtOTcxOS01MGExMTBiZDczZDEiIHN0RXZ0OndoZW49IjIwMjMtMDktMjBUMTA6MTA6MjcrMDI6MDAiIHN0RXZ0OnNvZnR3YXJlQWdlbnQ9IkFkb2JlIFBob3Rvc2hvcCAyMS4wIChXaW5kb3dzKSIvPiA8cmRmOmxpIHN0RXZ0OmFjdGlvbj0ic2F2ZWQiIHN0RXZ0Omluc3RhbmNlSUQ9InhtcC5paWQ6MGQ3NmJmM2QtZDA2Ni1kMzRhLWIwNDQtYjU2M2I0ZmUzM2JkIiBzdEV2dDp3aGVuPSIyMDIzLTA5LTIwVDEwOjEyOjExKzAyOjAwIiBzdEV2dDpzb2Z0d2FyZUFnZW50PSJBZG9iZSBQaG90b3Nob3AgMjEuMCAoV2luZG93cykiIHN0RXZ0OmNoYW5nZWQ9Ii8iLz4gPC9yZGY6U2VxPiA8L3htcE1NOkhpc3Rvcnk+IDwvcmRmOkRlc2NyaXB0aW9uPiA8L3JkZjpSREY+IDwveDp4bXBtZXRhPiA8P3hwYWNrZXQgZW5kPSJyIj8+VbzAZwAAEGJJREFUeNrtXXtwVNUZ/3aTQEKSQniEoFAzI4jyKHV8TH3xKFoRilXUKTPtVGf6R6ed6R/99zHT6bSdsSqkM51OU+wg9llrK6Nd20EQESgPeSgQIEAIjyQEyGuy2WSz2cd5fOfc7925d/fu3ezm7iaQM3Nn7+69Z+/5fb/zne87j3vvVUQE+eHcGwGTgjzIHFR10lQ9/aVxVadfpP/eIdVRdcr0neJprj7tKtO/uHlqKXD8xc/vkRUOQIFQFKQDi4KpoG6MxOcnPCfMIOtG6A9SoBFE2Q2ej0mnnNIRpWJN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',
            
            defaultColors: `<?xml version="1.0" encoding="utf-8"?>
<resources>
    <color name="colorPrimary">#3F51B5</color>
    <color name="colorPrimaryDark">#303F9F</color>
    <color name="colorAccent">#FF4081</color>
</resources>`,
            
            defaultStrings: `<?xml version="1.0" encoding="utf-8"?>
<resources>
    <string name="app_name">ProBuild App</string>
</resources>`
        };

        // Moved workflow contents here (ideally load from files)
        this.workflowContents = {
            'build-apk.yml': `name: Build APK ... (rest of YAML)`, // Truncated for brevity
            'build-signed-apk.yml': `name: Build Signed APK ... (rest of YAML)` // Truncated for brevity
        };
        
        // TODO: Add methods moved from BuildManager for file generation
        // - collectProjectFiles
        // - getTemplateBuildGradle
        // - getTemplateSettingsGradle
        // - getTemplateGradleProperties
        // - getTemplateLocalProperties
        // - getTemplateWrapperProperties
        // - getAppBuildGradle
        // - generateAndroidManifest
        // - generateActivityTags
        // - generateStringsXml
        // - generateColorsXml
        // - generateStylesXml
        // - getTemplateGradlew
        // - getTemplateGradlewBat
        // - getTemplateWrapperJar
        // - generateMainActivity
        // - generateScreenActivity
        // - generateMainLayout
        // - generateScreenLayout
    }
    
    // --- Moved Project File Generation Methods ---
    
    async collectProjectFiles() {
      try {
        const appData = this.appData; // Use the appData passed in constructor
        if (!appData) {
            // Consider throwing an error instead of relying on NotificationManager here
            throw new Error('App data is missing for project builder.');
        }
        
        const projectFiles = [];
        
        // Project structure placeholder files
        const projectStructure = [
          'app/src/main/java',
          'app/src/main/res/drawable',
          'app/src/main/res/layout',
          'app/src/main/res/values',
          'app/src/main/res/mipmap-hdpi',
          'app/src/main/res/mipmap-mdpi',
          'app/src/main/res/mipmap-xhdpi',
          'app/src/main/res/mipmap-xxhdpi',
          'app/src/main/res/mipmap-xxxhdpi',
          'gradle/wrapper'
        ];
        projectStructure.forEach(dir => {
          projectFiles.push({ path: `${dir}/.gitkeep`, content: '' });
        });
        
        // Add various project files
        projectFiles.push({ path: 'build.gradle', content: this.getTemplateBuildGradle() });
        projectFiles.push({ path: 'settings.gradle', content: this.getTemplateSettingsGradle(appData.name) });
        projectFiles.push({ path: 'gradle.properties', content: this.getTemplateGradleProperties() });
        projectFiles.push({ path: 'local.properties', content: this.getTemplateLocalProperties() });
        projectFiles.push({ path: 'gradle/wrapper/gradle-wrapper.properties', content: this.getTemplateWrapperProperties() });
        
        // Gradle wrapper JAR
        const wrapperJar = this.getTemplateWrapperJar();
        if (!wrapperJar) {
          throw new Error('Failed to generate Gradle wrapper JAR file');
        }
        projectFiles.push({ path: 'gradle/wrapper/gradle-wrapper.jar', content: wrapperJar, encoding: 'base64' });
        
        // Gradle wrapper scripts
        projectFiles.push({ path: 'gradlew', content: this.getTemplateGradlew() });
        projectFiles.push({ path: 'gradlew.bat', content: this.getTemplateGradlewBat() });
        
        // App level build.gradle
        projectFiles.push({ path: 'app/build.gradle', content: this.getAppBuildGradle(appData) });
        
        // AndroidManifest
        projectFiles.push({ path: 'app/src/main/AndroidManifest.xml', content: this.generateAndroidManifest(appData) });
        
        // Resource files
        projectFiles.push({ path: 'app/src/main/res/values/strings.xml', content: this.generateStringsXml({ app_name: appData.name }) });
        projectFiles.push({ path: 'app/src/main/res/values/colors.xml', content: this.defaultResources.defaultColors }); // Use default for now
        projectFiles.push({ path: 'app/src/main/res/values/styles.xml', content: this.generateStylesXml(appData.themeColor || 'colorPrimary') });
        
        // App icon
        projectFiles.push({ path: 'app/src/main/res/mipmap-xxxhdpi/ic_launcher.png', content: this.defaultResources.ic_launcher, encoding: 'base64' }); // Use default for now
        
        // --- DYNAMIC CONTENT --- 
        // Add MainActivity Java
        const mainActivityPath = `app/src/main/java/${appData.packageName.replace(/\./g, '/')}/MainActivity.java`;
        projectFiles.push({ path: mainActivityPath, content: this.generateMainActivity(appData) });
        
        // Add MainActivity Layout XML
        projectFiles.push({ path: 'app/src/main/res/layout/activity_main.xml', content: this.generateMainLayout(appData) });
        
        // Add additional screens and their layouts
        if (appData.screens) {
          appData.screens.forEach(screen => {
            if (screen.name !== 'MainActivity') { // Skip MainActivity as it's handled above
              // Add screen Java file
              const screenPath = `app/src/main/java/${appData.packageName.replace(/\./g, '/')}/${screen.name}.java`;
              projectFiles.push({ path: screenPath, content: this.generateScreenActivity(appData, screen) });
              
              // Add screen layout file
              const layoutFileName = `activity_${screen.name.toLowerCase()}.xml`;
              const layoutPath = `app/src/main/res/layout/${layoutFileName}`;
              projectFiles.push({ path: layoutPath, content: this.generateScreenLayout(appData, screen) });
            }
          });
        }
        
        // Handle hardcoded "nikit" screen if necessary (consider removing this hack)
        const nikitExists = appData.screens && appData.screens.some(s => s.name.toLowerCase() === 'nikit');
        if (!nikitExists) {
          const nikitScreen = { name: 'nikit', components: [] }; // Assuming empty components for compatibility
          const nikitPath = `app/src/main/java/${appData.packageName.replace(/\./g, '/')}/nikit.java`;
          projectFiles.push({ path: nikitPath, content: this.generateScreenActivity(appData, nikitScreen) });
          
          const nikitLayoutPath = 'app/src/main/res/layout/activity_nikit.xml';
          projectFiles.push({ path: nikitLayoutPath, content: this.generateScreenLayout(appData, nikitScreen) });
          
          // Update Manifest
          const manifestIndex = projectFiles.findIndex(f => f.path === 'app/src/main/AndroidManifest.xml');
          if (manifestIndex !== -1 && !projectFiles[manifestIndex].content.includes('<activity android:name=".nikit"')) {
            projectFiles[manifestIndex].content = projectFiles[manifestIndex].content.replace(
              '</application>',
              '        <activity android:name=".nikit" android:exported="false" />\n    </application>'
            );
          }
        }

        return projectFiles;
      } catch (error) {
        console.error('Error collecting project files:', error);
        // Re-throw the error so BuildWorkflowManager can handle it
        throw new Error(`Failed to collect project files: ${error.message}`);
      }
    }

    // Add other moved generation methods here...
    getAppBuildGradle(appData) {
      // Note: Dependencies are hardcoded here. Consider making them dynamic or configurable.
      return `plugins {
    id 'com.android.application'
}

android {
    namespace '${appData.packageName}'
    compileSdk 34

    defaultConfig {
        applicationId "${appData.packageName}"
        minSdk ${appData.minSdk || 21}
        targetSdk 34
        versionCode ${appData.versionCode || 1}
        versionName "${appData.versionName || '1.0'}"

        testInstrumentationRunner "androidx.test.runner.AndroidJUnitRunner"
    }

    buildTypes {
        release {
            minifyEnabled false
            proguardFiles getDefaultProguardFile('proguard-android-optimize.txt'), 'proguard-rules.pro'
        }
    }

    compileOptions {
        sourceCompatibility JavaVersion.VERSION_1_8
        targetCompatibility JavaVersion.VERSION_1_8
    }
}

dependencies {
    implementation 'androidx.appcompat:appcompat:1.6.1'
    implementation 'com.google.android.material:material:1.10.0'
    implementation 'androidx.constraintlayout:constraintlayout:2.1.4'
    testImplementation 'junit:junit:4.13.2'
    androidTestImplementation 'androidx.test.ext:junit:1.1.5'
    androidTestImplementation 'androidx.test.espresso:espresso-core:3.5.1'
}`;
    }

    generateAndroidManifest(appData) {
      return `<?xml version="1.0" encoding="utf-8"?>
<manifest xmlns:android="http://schemas.android.com/apk/res/android"
    package="${appData.packageName}">

    <application
        android:allowBackup="true"
        android:icon="@mipmap/ic_launcher" 
        android:label="@string/app_name"
        android:roundIcon="@mipmap/ic_launcher" 
        android:supportsRtl="true"
        android:theme="@style/AppTheme">
        <activity 
            android:name=".MainActivity"
            android:exported="true">
            <intent-filter>
                <action android:name="android.intent.action.MAIN" />
                <category android:name="android.intent.category.LAUNCHER" />
            </intent-filter>
        </activity>
        ${this.generateActivityTags(appData)} 
    </application>

</manifest>`;
    }

    generateActivityTags(appData) {
      if (!appData.screens || appData.screens.length <= 1) {
        return '';
      }
      // Generate tags for all screens EXCEPT MainActivity (already declared) and the nikit compatibility screen (handled separately)
      return appData.screens
        .filter(screen => screen.name !== 'MainActivity' && screen.name.toLowerCase() !== 'nikit') 
        .map(screen => `<activity android:name=".${screen.name}" android:exported="false" />`)
        .join('\n        ');
    }

    generateStringsXml(strings) {
      let content = `<?xml version="1.0" encoding="utf-8"?>\n<resources>`;
      for (const [key, value] of Object.entries(strings)) {
        content += `\n    <string name="${key}">${value}</string>`; // Basic XML escaping needed here?
      }
      content += '\n</resources>';
      return content;
    }
    
    generateColorsXml(colors) {
      // For now, still uses the default. TODO: Use appData.customColors
      return this.defaultResources.defaultColors;
    }
    
    generateStylesXml(themeColor) {
      // Uses primary color from defaults, Accent from appData
      return `<?xml version="1.0" encoding="utf-8"?>
<resources>
    <!-- Base application theme -->
    <style name="AppTheme" parent="Theme.MaterialComponents.Light.DarkActionBar">
        <!-- Customize your theme here -->
        <item name="colorPrimary">@color/colorPrimary</item> 
        <item name="colorPrimaryDark">@color/colorPrimaryDark</item> 
        <item name="colorAccent">@color/${themeColor}</item>
    </style>
</resources>`;
    }

    // --- DYNAMIC CODE/LAYOUT GENERATION --- 
    // These need to reflect the actual components added by the user

    // --- DYNAMIC CODE/LAYOUT GENERATION HELPERS ---

    _getComponentTypeMapping(componentType) {
        const mapping = {
            'TextView': 'android.widget.TextView',
            'Button': 'android.widget.Button',
            'EditText': 'android.widget.EditText',
            'ImageView': 'android.widget.ImageView',
            // Add other common types: CheckBox, RadioButton, Switch, etc.
        };
        return mapping[componentType];
    }

    _generateImports(components) {
        const imports = new Set([
            'android.os.Bundle',
            'androidx.appcompat.app.AppCompatActivity',
            'android.view.View', // Often needed for listeners
            'android.util.Log'   // For placeholder event logic
        ]);

        components.forEach(comp => {
            const fullType = this._getComponentTypeMapping(comp.type);
            if (fullType) {
                imports.add(fullType);
            }
             // Add imports needed by event logic (e.g., Intent, Toast)
            // TODO: Enhance this based on actual event block content
            if (comp.events && comp.events.onClick) {
                imports.add('android.content.Intent'); // Assuming potential navigation
                imports.add('android.widget.Toast');  // Assuming potential messages
            }
        });

        return Array.from(imports).map(imp => `import ${imp};`).join('\n');
    }

    _generateDeclarations(components) {
        return components
            .filter(comp => comp.id)
            .map(comp => {
                const javaType = comp.type; // Use simple type name for variable
                return `    private ${javaType} ${comp.id};`;
            })
            .join('\n');
    }

    _generateInitializations(components) {
        return components
            .filter(comp => comp.id)
            .map(comp => `        ${comp.id} = findViewById(R.id.${comp.id});`)
            .join('\n');
    }

    _generateEventListeners(components) {
        const listeners = components
            .filter(comp => comp.id && comp.events && comp.events.onClick) // Focus on onClick for now
            .map(comp => {
                const eventLogic = comp.events.onClick.trim();
                // TODO: Implement more sophisticated logic block parsing/generation
                // For now, just wrap in a log statement or basic interpretation
                let javaLogic = `            // TODO: Implement click logic for ${comp.id}\n`;
                javaLogic += `            Log.d("SketchwareEvent", "onClick for ${comp.id}");\n`;
                // Simplistic example: Handle basic Toast
                if (eventLogic.startsWith('Toast.makeText')) {
                     javaLogic += `            Toast.makeText(getApplicationContext(), "Event for ${comp.id}", Toast.LENGTH_SHORT).show();\n`;
                }
                 // Simplistic example: Handle basic Intent
                 else if (eventLogic.startsWith('Intent')) {
                     // Assuming format like "Intent i = new Intent(this, TargetActivity.class); startActivity(i);"
                     const match = eventLogic.match(/new\s+Intent\([^,]+,\s*([^.]+)\.class\)/);
                     if (match && match[1]) {
                        const targetActivity = match[1];
                         javaLogic += `            Intent intent = new Intent(${comp.id}.getContext(), ${targetActivity}.class);\n`;
                         javaLogic += `            startActivity(intent);\n`;
                     } else {
                          javaLogic += `            // Could not parse Intent target from: ${eventLogic}\n`;
                     }
                 }
                 else {
                     javaLogic += `            // Original logic block hint: ${eventLogic.replace(/\n/g, '\\n')}\n`;
                 }
                
                return `        if (${comp.id} != null) {\n            ${comp.id}.setOnClickListener(new View.OnClickListener() {\n                @Override\n                public void onClick(View v) {\n${javaLogic}                }\n            });\n        }`;
            })
            .join('\n\n');
        return listeners ? `\n        // --- Event Listeners ---\n${listeners}` : '';
    }

    generateMainActivity(appData) {
        const mainScreen = appData.screens ? appData.screens.find(s => s.name === 'MainActivity') : null;
        const components = mainScreen ? mainScreen.components || [] : [];

        const imports = this._generateImports(components);
        const declarations = this._generateDeclarations(components);
        const initializations = this._generateInitializations(components);
        const eventListeners = this._generateEventListeners(components);

        return `package ${appData.packageName};

${imports}

public class MainActivity extends AppCompatActivity {
    
${declarations}

    @Override
    protected void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        setContentView(R.layout.activity_main);

        // --- Initialize Views ---
${initializations}
${eventListeners}

        // TODO: Add any custom onCreate logic from appData if available
    }

    // TODO: Add custom methods from appData if available
}`;
    }
    
    generateScreenActivity(appData, screen) {
        if (!screen) return '';
        const components = screen.components || [];
        const screenName = screen.name;

        const imports = this._generateImports(components);
        const declarations = this._generateDeclarations(components);
        const initializations = this._generateInitializations(components);
        const eventListeners = this._generateEventListeners(components);

        return `package ${appData.packageName};

${imports}

public class ${screenName} extends AppCompatActivity {
    
${declarations}

    @Override
    protected void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        setContentView(R.layout.activity_${screenName.toLowerCase()});

        // --- Initialize Views ---
${initializations}
${eventListeners}

        // TODO: Add any custom onCreate logic from appData if available
    }

    // TODO: Add custom methods from appData if available
}`;
    }

    // Helper function to generate XML for a single component
    generateComponentXml(componentData) {
        if (!componentData || !componentData.type) {
            console.warn('Skipping component generation: Invalid data');
            return '';
        }

        // Basic mapping - extend as needed for more component types
        const tagMap = {
            'TextView': 'TextView', // Assuming android.widget prefix is added later or handled
            'Button': 'Button',     // by the layout context
            'EditText': 'EditText', 
            'ImageView': 'ImageView', 
            // Add other mappings like CheckBox, RadioButton, LinearLayout, etc.
        };

        const tagName = tagMap[componentData.type] || componentData.type; // Default to type if not mapped
        if (!tagName) return ''; // Skip unknown types

        let attributes = '';
        for (const [key, value] of Object.entries(componentData)) {
            if (key === 'type' || key === 'children' || key === 'events') continue; // Skip non-attribute keys

            let attrName = key;
            let attrValue = value;

            // Basic attribute mapping (expand significantly)
            if (key === 'id') {
                attrName = 'android:id';
                attrValue = `@+id/${value}`;
            } else if (key === 'text') {
                attrName = 'android:text';
                // Basic escaping - a proper XML escaper would be better
                attrValue = String(value).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;').replace(/'/g, '&apos;');
            } else if (key === 'width') {
                attrName = 'android:layout_width';
            } else if (key === 'height') {
                attrName = 'android:layout_height';
            } else if (key.startsWith('layout_constraint')) {
                // Assume constraint attributes use the 'app' namespace
                attrName = `app:${key.replace(/_/g, '_')}`; // Convert snake_case if needed, already looks okay
            } else if (key.startsWith('layout_margin')) {
                 attrName = `android:${key.replace(/_/g, '')}` // android:layout_marginStart etc. 
            } else if (key === 'srcCompat') { // For ImageView
                attrName = 'app:srcCompat'; // Example, assuming value is like "@drawable/image_name"
            } else if (key === 'scaleType') { // For ImageView
                 attrName = 'android:scaleType';
            } else {
                // Default: Assume android namespace for other layout properties
                attrName = `android:${key}`;
            }
            
            // Use proper XML attribute quoting
             attributes += ` ${attrName}="${attrValue}"`;
        }

        // Add android.widget. prefix if using simple tags
        const fullTagName = `android.widget.${tagName}`;

        // Return self-closing tag for simplicity for now
        // TODO: Handle nested layouts/children if componentData includes them
        return `    <${fullTagName}${attributes}\n        />`;
    }

    generateMainLayout(appData) {
        const mainScreen = appData.screens ? appData.screens.find(s => s.name === 'MainActivity') : null;
        const components = mainScreen ? mainScreen.components || [] : [];

        let componentsXml = components.map(comp => this.generateComponentXml(comp)).join('\n\n');
        
        // Fallback if no components defined or main screen missing
        if (!componentsXml.trim()) {
            componentsXml = `    <TextView
        android:id="@+id/placeholder_text"
        android:layout_width="wrap_content"
        android:layout_height="wrap_content"
        android:text="Add components to MainActivity!"
        app:layout_constraintBottom_toBottomOf="parent"
        app:layout_constraintEnd_toEndOf="parent"
        app:layout_constraintStart_toStartOf="parent"
        app:layout_constraintTop_toTopOf="parent" />`;
        }

        return `<?xml version="1.0" encoding="utf-8"?>
<androidx.constraintlayout.widget.ConstraintLayout xmlns:android="http://schemas.android.com/apk/res/android"
    xmlns:app="http://schemas.android.com/apk/res-auto"
    xmlns:tools="http://schemas.android.com/tools"
    android:layout_width="match_parent"
    android:layout_height="match_parent"
    tools:context=".MainActivity">

${componentsXml}

</androidx.constraintlayout.widget.ConstraintLayout>`;
    }

    generateScreenLayout(appData, screen) {
        if (!screen) return ''; // Handle case where screen is null/undefined

        const components = screen.components || [];
        let componentsXml = components.map(comp => this.generateComponentXml(comp)).join('\n\n');
        
        // Fallback if no components defined
        if (!componentsXml.trim()) {
             componentsXml = `    <TextView
        android:id="@+id/placeholder_text"
        android:layout_width="wrap_content"
        android:layout_height="wrap_content"
        android:text="Add components to ${screen.name}!"
        app:layout_constraintBottom_toBottomOf="parent"
        app:layout_constraintEnd_toEndOf="parent"
        app:layout_constraintStart_toStartOf="parent"
        app:layout_constraintTop_toTopOf="parent" />`;
        }

        return `<?xml version="1.0" encoding="utf-8"?>
<androidx.constraintlayout.widget.ConstraintLayout xmlns:android="http://schemas.android.com/apk/res/android"
    xmlns:app="http://schemas.android.com/apk/res-auto"
    xmlns:tools="http://schemas.android.com/tools"
    android:layout_width="match_parent"
    android:layout_height="match_parent"
    tools:context=".${screen.name}">

${componentsXml}

</androidx.constraintlayout.widget.ConstraintLayout>`;
    }

    // --- Gradle Wrapper Templates (Keep as strings for now) ---
    getTemplateGradlew() {
      // Keep truncated version or full version as string
      return `#!/usr/bin/env sh ... (gradlew script content) ...`;
    }
  
    getTemplateGradlewBat() {
       // Keep truncated version or full version as string
      return `@rem ... (gradlew.bat script content) ...`;
    }
  
    getTemplateWrapperJar() {
      // Keep truncated base64 version
      return "UEsDBBQACAgIAJJebk8AAAAAAAAAAAAAAAAJAAAATUVUQS1JTkYvAwBQSwMEFAAICAgAkl5uTwAAAAAAAAAAAAAAABQAAABNRVRBLUlORi9NQU5JRkVTVC5NRi2OSw4CMRBD957CV1i7YHOF3gCO4DMiBWljRknDPKT361HL1hXbsp8BAOHk2W45lXbFwCSOygMMo7+nFOGOOTFbcghJExyZnEyexC7FbBhF9osNqLPYb4YLC9Z1FvmbSIBgrrJEll2JC3XJNOP79NFpKaXQ4QeOGERcCnL2qPv51CtvwQbUUsvfLMRcbwW5tzcVTR9QSwcIXJzT59QAAADGAAAAUEsDBBQACAgIAJJebk8AAAAAAAAAAAAAAAAJAAAATUVUQS1JTkYvTUFOSUZFU1QuTUZQSwECFAAUAAgICACCXm5PAAAAAAAAAAAAAAAAFAAAAHJvYy9ncmFkbGUvd3JhcHBlci9QSwMEFAAICAgAcl5uTwAAAAAAAAAAAAAAABkAAABvcmcvZ3JhZGxlL3dyYXBwZXIvV3JhcHBlckMAAAEAUEsHCPMAQYcDAAAAAwAAAFBLAwQUAAgICACCXm5PAAAAAAAAAAAAAAAAHgAAAG9yZy9ncmFkbGUvd3JhcHBlci9CdWlsZEFjdGlvbkMAAAEAUEsHCPMAQYcDAAAAAwAAAFBLAwQUAAgICABwXm5PAAAAAAAAAAAAAAAAHgAAAG9yZy9ncmFkbGUvd3JhcHBlci9HcmFkbGVXcmFwcGVyUEsHCPMAQYcDAAAAAwAAAFBLAwQUAAgICACCXm5PAAAAAAAAAAAAAAAAIwAAAG9yZy9ncmFkbGUvd3JhcHBlci9HcmFkbGVXcmFwcGVyTWFpbkMAAAEAUEsHCPMAQYcDAAAAAwAAAFBLAQIUABQACAgIAJJebk8AAAAAAAAAAAAAAAAJAAAAAAAAAAAAEADtQQAAAABNRVRBLUlORi9QSwECFAAUAAgICACCXm5PXJzT59QAAADGAAAAFAAAAAAAAAAAABAAAsEtAAAATUVUQS1JTkYvTUFOSUZFU1QuTUZQSwECFAAUAAgICACCXm5PAAAAAAAAAAAAAAAABwAAAAAAAAAAABAA/UE9AQAAb3JnL1BLAQIUABQACAgIAHJebk8AAAAAAAAAAAAAAAAUAAAAAAAAAAAAEADtQVwBAAByb2MvZ3JhZGxlL3dyYXBwZXIvUEsBAhQAFAAICAgAgl5uT/MAQYcDAAAAAwAAABkAAAAAAAAAAAAQAP1BnwEAAG9yZy9ncmFkbGUvd3JhcHBlci9XcmFwcGVyQ1BLAQIUABQACAgIAIJebk/zAEGHAwAAAAMAAAAeAAAAAAAAAAAAEAD9QdIBAABvcmcvZ3JhZGxlL3dyYXBwZXIvQnVpbGRBY3Rpb25DUEsBAhQAFAAICAgAcF5uT/MAQYcDAAAAAwAAAB4AAAAAAAAAAAAQAOxBBQIAAG9yZy9ncmFkbGUvd3JhcHBlci9HcmFkbGVXcmFwcGVyUEsBAhQAFAAICAgAgl5uT/MAQYcDAAAAAwAAACMAAAAAAAAAAAAQAOxBOAIAAG9yZy9ncmFkbGUvd3JhcHBlci9HcmFkbGVXcmFwcGVyTWFpbkNQSwUGAAAAAAgACACuAQAAbgIAAAAA";
    }
}

export default ProjectBuilder; 