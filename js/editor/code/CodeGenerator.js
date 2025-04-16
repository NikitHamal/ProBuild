class CodeGenerator {
  constructor(codeManager) {
    this.codeManager = codeManager;
    this.editorView = codeManager.editorView;
    this.currentApp = codeManager.currentApp;
  }
  
  generateFile(fileId, screen) {
    switch (fileId) {
      case 'main':
        return this.generateJavaActivity(screen);
      case 'layout':
        return this.generateLayoutXml(screen);
      case 'strings':
        return this.generateStringsXml();
      case 'colors':
        return this.generateColorsXml();
      case 'manifest':
        return this.generateManifestXml();
      default:
        return '// File not supported';
    }
  }
  
  generateJavaActivity(screen) {
    const packageName = this.currentApp.packageName || 'com.example.app';
    const screenName = screen.name;
    const components = screen.components || [];
    
    let declarations = '';
    let findViewsCode = '';
    let initListenersCode = '';
    
    // Generate code for each component
    components.forEach(component => {
      const { type, id, properties } = component;
      const componentId = id || `component_${Date.now()}`;
      
      // Skip components without proper IDs
      if (!componentId) return;
      
      // Convert component type to Java class name
      const componentClass = this.getComponentClassName(type);
      if (!componentClass) return;
      
      // Add declaration
      declarations += `    private ${componentClass} ${componentId};\n`;
      
      // Add findViewById
      findViewsCode += `        ${componentId} = findViewById(R.id.${componentId});\n`;
      
      // Add event listeners if needed
      if (type === 'button') {
        initListenersCode += `
        ${componentId}.setOnClickListener(new View.OnClickListener() {
            @Override
            public void onClick(View v) {
                // TODO: Implement button click handler
            }
        });
`;
      }
    });
    
    return `package ${packageName};

import android.os.Bundle;
import android.view.View;
import android.widget.*;
import androidx.appcompat.app.AppCompatActivity;

public class ${screenName} extends AppCompatActivity {

${declarations}
    @Override
    protected void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        setContentView(R.layout.activity_${screenName.toLowerCase()});
        
        // Initialize Views
${findViewsCode}
        
        // Set up listeners
${initListenersCode}
    }
    
    // Add your methods here
}
`;
  }
  
  generateLayoutXml(screen) {
    const screenName = screen.name;
    const components = screen.components || [];
    
    let componentsXml = '';
    
    // Generate XML for each component
    components.forEach(component => {
      const { type, id, properties } = component;
      const componentId = id || `component_${Date.now()}`;
      
      // Skip components without proper IDs
      if (!componentId) return;
      
      // Convert component type to XML tag
      const xmlTag = this.getComponentXmlTag(type);
      if (!xmlTag) return;
      
      // Generate attributes
      let attributes = `
        android:id="@+id/${componentId}"
        android:layout_width="${properties.width || 'wrap_content'}"
        android:layout_height="${properties.height || 'wrap_content'}"`;
      
      // Add text attribute if applicable
      if (properties.text) {
        attributes += `
        android:text="${properties.text}"`;
      }
      
      // Add hint attribute if applicable
      if (type === 'edittext' && properties.hint) {
        attributes += `
        android:hint="${properties.hint}"`;
      }
      
      // Add other common attributes
      if (properties.textSize) {
        attributes += `
        android:textSize="${properties.textSize}sp"`;
      }
      
      if (properties.textColor) {
        attributes += `
        android:textColor="${properties.textColor}"`;
      }
      
      if (properties.margin) {
        attributes += `
        android:layout_margin="${properties.margin}"`;
      }
      
      if (properties.padding) {
        attributes += `
        android:padding="${properties.padding}"`;
      }
      
      if (properties.bgColor && properties.bgColor !== '#FFFFFF') {
        attributes += `
        android:background="${properties.bgColor}"`;
      }
      
      // Add component XML
      componentsXml += `
    <${xmlTag}${attributes} />
`;
    });
    
    // If there are no components, add a TextView as a placeholder
    if (!componentsXml) {
      componentsXml = `
    <TextView
        android:id="@+id/textView1"
        android:layout_width="wrap_content"
        android:layout_height="wrap_content"
        android:layout_gravity="center"
        android:text="Hello World!"
        android:textSize="24sp" />
`;
    }
    
    return `<?xml version="1.0" encoding="utf-8"?>
<LinearLayout xmlns:android="http://schemas.android.com/apk/res/android"
    xmlns:app="http://schemas.android.com/apk/res-auto"
    xmlns:tools="http://schemas.android.com/tools"
    android:layout_width="match_parent"
    android:layout_height="match_parent"
    android:orientation="vertical"
    android:padding="16dp"
    tools:context=".${screenName}">
${componentsXml}
</LinearLayout>
`;
  }
  
  generateStringsXml() {
    const appName = this.currentApp.name || 'My App';
    
    return `<?xml version="1.0" encoding="utf-8"?>
<resources>
    <string name="app_name">${appName}</string>
    
    <!-- Add your strings here -->
    <string name="welcome_message">Welcome to ${appName}!</string>
    <string name="action_settings">Settings</string>
</resources>
`;
  }
  
  generateColorsXml() {
    const customColors = this.currentApp.customColors || {
      colorAccent: '#2196F3',
      colorPrimary: '#3F51B5',
      colorPrimaryDark: '#303F9F',
      colorControlHighlight: '#E0E0E0'
    };
    
    return `<?xml version="1.0" encoding="utf-8"?>
<resources>
    <color name="colorPrimary">${customColors.colorPrimary}</color>
    <color name="colorPrimaryDark">${customColors.colorPrimaryDark}</color>
    <color name="colorAccent">${customColors.colorAccent}</color>
    <color name="colorControlHighlight">${customColors.colorControlHighlight}</color>
    
    <!-- Add your colors here -->
    <color name="white">#FFFFFF</color>
    <color name="black">#000000</color>
    <color name="gray">#757575</color>
    <color name="light_gray">#F5F5F5</color>
</resources>
`;
  }
  
  generateManifestXml() {
    const packageName = this.currentApp.packageName || 'com.example.app';
    const appName = this.currentApp.name || 'My App';
    const versionCode = this.currentApp.versionCode || '1';
    const versionName = this.currentApp.versionName || '1.0';
    const minSdk = this.currentApp.minSdk || '21';
    
    // Generate screen activities
    let activitiesXml = '';
    
    if (this.currentApp.screens && this.currentApp.screens.length > 0) {
      this.currentApp.screens.forEach((screen, index) => {
        const isMainActivity = index === 0;
        
        let intentFilter = '';
        if (isMainActivity) {
          intentFilter = `
            <intent-filter>
                <action android:name="android.intent.action.MAIN" />
                <category android:name="android.intent.category.LAUNCHER" />
            </intent-filter>`;
        }
        
        activitiesXml += `
        <activity
            android:name=".${screen.name}"
            android:exported="true">${intentFilter}
        </activity>`;
      });
    }
    
    return `<?xml version="1.0" encoding="utf-8"?>
<manifest xmlns:android="http://schemas.android.com/apk/res/android"
    package="${packageName}"
    android:versionCode="${versionCode}"
    android:versionName="${versionName}">

    <uses-sdk
        android:minSdkVersion="${minSdk}"
        android:targetSdkVersion="33" />

    <application
        android:allowBackup="true"
        android:icon="@mipmap/ic_launcher"
        android:label="@string/app_name"
        android:roundIcon="@mipmap/ic_launcher_round"
        android:supportsRtl="true"
        android:theme="@style/AppTheme">${activitiesXml}
    </application>

</manifest>
`;
  }
  
  getComponentClassName(type) {
    // Map component types to Java class names
    const componentMap = {
      'textview': 'TextView',
      'button': 'Button',
      'edittext': 'EditText',
      'imageview': 'ImageView',
      'checkbox': 'CheckBox',
      'radiobutton': 'RadioButton',
      'switch': 'Switch',
      'progressbar': 'ProgressBar',
      'seekbar': 'SeekBar',
      'spinner': 'Spinner',
      'listview': 'ListView',
      'webview': 'WebView',
      'linearlayout-h': 'LinearLayout',
      'linearlayout-v': 'LinearLayout',
      'scrollview-h': 'HorizontalScrollView',
      'scrollview-v': 'ScrollView',
      'cardview': 'CardView'
    };
    
    return componentMap[type] || null;
  }
  
  getComponentXmlTag(type) {
    // Map component types to XML tags
    const componentMap = {
      'textview': 'TextView',
      'button': 'Button',
      'edittext': 'EditText',
      'imageview': 'ImageView',
      'checkbox': 'CheckBox',
      'radiobutton': 'RadioButton',
      'switch': 'Switch',
      'progressbar': 'ProgressBar',
      'seekbar': 'SeekBar',
      'spinner': 'Spinner',
      'listview': 'ListView',
      'webview': 'WebView',
      'linearlayout-h': 'LinearLayout',
      'linearlayout-v': 'LinearLayout',
      'scrollview-h': 'HorizontalScrollView',
      'scrollview-v': 'ScrollView',
      'cardview': 'androidx.cardview.widget.CardView'
    };
    
    return componentMap[type] || null;
  }
}

export default CodeGenerator; 