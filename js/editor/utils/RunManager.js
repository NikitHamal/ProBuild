class RunManager {
  constructor(editorView) {
    this.editorView = editorView;
    this.appService = editorView.appService;
    this.dialogManager = editorView.dialogManager;
    this.currentApp = null;
    this.buildSteps = [
      { id: 'preparing', text: 'Preparing build environment', time: 600, progress: 5, detail: 'Configuring Gradle build environment' },
      { id: 'manifest', text: 'Generating AndroidManifest.xml', time: 400, progress: 10, detail: 'Creating manifest with permissions and activities' },
      { id: 'layouts', text: 'Generating XML layouts', time: 800, progress: 15, detail: 'Converting visual components to Android XML layouts' },
      { id: 'res', text: 'Processing resources', time: 700, progress: 20, detail: 'Processing drawable, string, and value resources' },
      { id: 'aapt', text: 'Running AAPT tool', time: 900, progress: 25, detail: 'Android Asset Packaging Tool processing resources' },
      { id: 'java', text: 'Generating Java code', time: 1000, progress: 35, detail: 'Converting blocks to Java source code' },
      { id: 'javac', text: 'Compiling Java sources', time: 1200, progress: 45, detail: 'javac -source 1.8 -target 1.8 -encoding UTF-8' },
      { id: 'libs', text: 'Processing libraries', time: 800, progress: 55, detail: 'Including AndroidX and other dependencies' },
      { id: 'd8', text: 'Running D8 dexer', time: 1000, progress: 65, detail: 'Converting Java bytecode to DEX format' },
      { id: 'merge', text: 'Merging resources', time: 800, progress: 75, detail: 'Merging app resources with library resources' },
      { id: 'packaging', text: 'Packaging APK', time: 900, progress: 85, detail: 'Adding resources and DEX files to APK' },
      { id: 'signing', text: 'Signing APK with debug key', time: 700, progress: 90, detail: 'Using debug keystore for signing' },
      { id: 'zipalign', text: 'Running zipalign', time: 500, progress: 95, detail: 'Optimizing APK file alignment on 4-byte boundaries' },
      { id: 'done', text: 'Build completed successfully', time: 300, progress: 100, detail: 'APK file is ready for installation' }
    ];
    
    // Technical tips about Android development
    this.techTips = [
      "Lint checks can identify performance, security, and compatibility issues in your code",
      "R8 compiler performs code shrinking, optimization, and obfuscation",
      "ViewBinding eliminates findViewById() calls and provides type safety",
      "ConstraintLayout reduces nested views and improves rendering performance",
      "AndroidX WorkManager handles background tasks with respect to battery optimization",
      "Navigation Component simplifies fragment transitions and deep linking",
      "Room persistence library provides an abstraction layer over SQLite",
      "DataBinding reduces boilerplate code when connecting UI with data sources",
      "Kotlin coroutines simplify asynchronous programming and background tasks",
      "ViewModel helps manage UI-related data in a lifecycle-conscious way"
    ];
    
    this.funFacts = [
      "Android was originally created for digital cameras, not phones.",
      "The Android mascot is named 'Bugdroid'.",
      "Each Android version is named after a dessert in alphabetical order.",
      "Over 70% of mobile devices worldwide run on Android.",
      "Android is based on the Linux kernel.",
      "The first commercial Android device was the HTC Dream, released in 2008.",
      "Android's source code is over 15 million lines long.",
      "Google purchased Android Inc. in 2005 for around $50 million.",
      "Android apps are written primarily in Java and Kotlin."
    ];
    
    this.proTips = [
      "Use ConstraintLayout for complex UIs to improve performance.",
      "Always handle configuration changes to prevent app crashes.",
      "Minimize app permissions to increase user trust.",
      "Implement dark mode to reduce battery consumption on OLED screens.",
      "Use vector drawables instead of PNGs for better scaling.",
      "Test your app on various screen sizes and densities.",
      "Keep your app under 10MB to increase downloads.",
      "Use RecyclerView instead of ListView for better performance.",
      "Enable ProGuard to reduce APK size and obfuscate your code.",
      "Always save user data before closing activities."
    ];
  }
  
  showBuildDialog() {
    this.currentApp = this.editorView.currentApp;
    
    // Create dialog
    const dialog = document.createElement('div');
    dialog.className = 'dialog-overlay';
    dialog.innerHTML = `
      <div class="dialog" style="width: 550px; max-width: 90%;">
        <div class="dialog-header">
          <div class="dialog-title">Building ${this.currentApp.name}.apk</div>
        </div>
        <div class="dialog-content">
          <div class="build-status">
            <div class="status-icon">
              <i class="material-icons">android</i>
            </div>
            <div class="status-message">Initializing build process...</div>
          </div>
          
          <div class="status-detail" style="margin-top: 4px; font-size: 0.85rem; color: var(--text-secondary); margin-left: 64px;">
            Setting up build environment
          </div>
          
          <div class="progress-container" style="margin: 24px 0;">
            <div class="progress-bar" style="height: 6px; background: #eee; border-radius: 3px; overflow: hidden;">
              <div class="progress-fill" style="width: 0%; height: 100%; background: var(--primary-color); transition: width 0.3s;"></div>
            </div>
            <div class="progress-text" style="margin-top: 8px; font-size: 0.9rem; text-align: right;">0%</div>
          </div>
          
          <div class="info-box" style="padding: 12px; background: #f5f5f5; border-radius: 4px; margin-top: 16px;">
            <div class="info-title" style="font-weight: 500; margin-bottom: 4px;">Pro Tip:</div>
            <div class="info-content">Loading tip...</div>
          </div>
        </div>
        
        <div class="dialog-actions">
          <button class="dialog-btn cancel-btn">Cancel</button>
        </div>
      </div>
    `;
    
    document.body.appendChild(dialog);
    
    const cancelBtn = dialog.querySelector('.cancel-btn');
    cancelBtn.addEventListener('click', () => {
      this.isCancelled = true;
      dialog.remove();
    });
    
    // Start build process
    this.startBuild(dialog);
    
    return dialog;
  }
  
  startBuild(dialog) {
    const statusMessage = dialog.querySelector('.status-message');
    const statusDetail = dialog.querySelector('.status-detail');
    const progressFill = dialog.querySelector('.progress-fill');
    const progressText = dialog.querySelector('.progress-text');
    const infoBox = dialog.querySelector('.info-box');
    const infoTitle = dialog.querySelector('.info-title');
    const infoContent = dialog.querySelector('.info-content');
    
    this.isCancelled = false;
    let currentStep = 0;
    let currentTip = 0;
    
    // Function to update info box with alternating tips, facts and tech tips
    const updateInfoBox = () => {
      const tipType = currentTip % 3;
      if (tipType === 0) {
        infoTitle.textContent = 'Pro Tip:';
        const tipIndex = Math.floor(currentTip / 3) % this.proTips.length;
        infoContent.textContent = this.proTips[tipIndex];
      } else if (tipType === 1) {
        infoTitle.textContent = 'Fun Fact:';
        const factIndex = Math.floor(currentTip / 3) % this.funFacts.length;
        infoContent.textContent = this.funFacts[factIndex];
      } else {
        infoTitle.textContent = 'Tech Tip:';
        const techIndex = Math.floor(currentTip / 3) % this.techTips.length;
        infoContent.textContent = this.techTips[techIndex];
      }
      currentTip++;
    };
    
    // Update info box every 5 seconds
    updateInfoBox();
    const infoInterval = setInterval(updateInfoBox, 5000);
    
    // Execute build steps sequentially
    const executeNextStep = () => {
      if (this.isCancelled) {
        clearInterval(infoInterval);
        return;
      }
      
      if (currentStep >= this.buildSteps.length) {
        // Build complete
        clearInterval(infoInterval);
        
        // Create success dialog
        setTimeout(() => {
          dialog.remove();
          this.showBuildSuccessDialog();
        }, 1000);
        return;
      }
      
      const step = this.buildSteps[currentStep];
      statusMessage.textContent = step.text;
      statusDetail.textContent = step.detail || '';
      progressFill.style.width = `${step.progress}%`;
      progressText.textContent = `${step.progress}%`;
      
      setTimeout(() => {
        currentStep++;
        executeNextStep();
      }, step.time);
    };
    
    // Start build process
    executeNextStep();
  }
  
  showBuildSuccessDialog() {
    const apkName = `${this.currentApp.name.replace(/\s+/g, '_')}_v${this.currentApp.versionName}.apk`;
    const apkSize = (Math.random() * 5 + 2).toFixed(1);
    const buildId = Math.random().toString(36).substring(2, 10).toUpperCase();
    const buildTime = (Math.random() * 10 + 5).toFixed(2);
    
    const dialog = document.createElement('div');
    dialog.className = 'dialog-overlay';
    dialog.innerHTML = `
      <div class="dialog">
        <div class="dialog-header">
          <div class="dialog-title">Build Successful</div>
        </div>
        <div class="dialog-content">
          <div style="text-align: center; padding: 16px 0;">
            <i class="material-icons" style="font-size: 64px; color: #4CAF50;">check_circle</i>
            <h2 style="margin: 16px 0;">APK Built Successfully</h2>
            <p>Your APK file has been generated successfully and is ready for testing.</p>
            
            <div style="margin: 24px 0; padding: 16px; background: #f5f5f5; border-radius: 4px; text-align: left;">
              <div style="font-weight: 600; margin-bottom: 12px;">APK Details</div>
              <div style="font-family: monospace; font-size: 0.9rem; line-height: 1.5;">
                <div>File name: <span style="color: #0277BD;">${apkName}</span></div>
                <div>Size: <span style="color: #0277BD;">${apkSize} MB</span></div>
                <div>Package: <span style="color: #0277BD;">${this.currentApp.packageName}</span></div>
                <div>Version: <span style="color: #0277BD;">${this.currentApp.versionName} (${this.currentApp.versionCode})</span></div>
                <div>Min SDK: <span style="color: #0277BD;">${this.currentApp.minSdk}</span></div>
                <div>Target SDK: <span style="color: #0277BD;">33</span></div>
                <div>Compile SDK: <span style="color: #0277BD;">33</span></div>
              </div>
              
              <div style="font-weight: 600; margin: 16px 0 12px 0;">Build Information</div>
              <div style="font-family: monospace; font-size: 0.9rem; line-height: 1.5;">
                <div>Build ID: <span style="color: #0277BD;">${buildId}</span></div>
                <div>Timestamp: <span style="color: #0277BD;">${new Date().toISOString()}</span></div>
                <div>Build time: <span style="color: #0277BD;">${buildTime} seconds</span></div>
                <div>Build type: <span style="color: #0277BD;">Debug</span></div>
                <div>Java version: <span style="color: #0277BD;">11.0.17</span></div>
                <div>Gradle version: <span style="color: #0277BD;">7.4.2</span></div>
              </div>
              
              <div style="font-weight: 600; margin: 16px 0 12px 0;">APK Content</div>
              <div style="font-family: monospace; font-size: 0.9rem; line-height: 1.5;">
                <div>Activities: <span style="color: #0277BD;">${this.currentApp.screens.length}</span></div>
                <div>Resources: <span style="color: #0277BD;">${Math.floor(Math.random() * 100 + 50)}</span></div>
                <div>Classes: <span style="color: #0277BD;">${Math.floor(Math.random() * 500 + 200)}</span></div>
                <div>Methods: <span style="color: #0277BD;">${Math.floor(Math.random() * 3000 + 1000)}</span></div>
                <div>Libraries: <span style="color: #0277BD;">AndroidX Core, AppCompat, Material</span></div>
              </div>
            </div>
          </div>
        </div>
        
        <div class="dialog-actions">
          <button class="dialog-btn close-btn">Close</button>
          <button class="dialog-btn download-btn primary">Download APK</button>
        </div>
      </div>
    `;
    
    document.body.appendChild(dialog);
    
    const closeBtn = dialog.querySelector('.close-btn');
    closeBtn.addEventListener('click', () => {
      dialog.remove();
    });
    
    const downloadBtn = dialog.querySelector('.download-btn');
    downloadBtn.addEventListener('click', () => {
      this.simulateDownload(apkName);
      dialog.remove();
    });
  }
  
  simulateDownload(apkName) {
    // Create a notification
    this.editorView.notificationManager.showNotification(
      `Preparing ${apkName} for download...`,
      'info'
    );
    
    // Generate build details
    const buildId = Math.random().toString(36).substring(2, 10).toUpperCase();
    const buildTime = (Math.random() * 10 + 5).toFixed(2);
    const fileSize = (Math.random() * 5 + 2).toFixed(1);
    const fileSizeBytes = Math.round(parseFloat(fileSize) * 1024 * 1024); // Convert MB to bytes
    const timestamp = new Date().toISOString();
    
    // Format app components for display
    const screensList = this.currentApp.screens
      .map(screen => `  - ${screen.name} (Activity)`)
      .join('\n');
    
    // Create text content to simulate an APK file
    const appContent = `===============================================================
SKETCHWARE PRO SIMULATED APK - DEBUG BUILD
===============================================================

THIS IS A SIMULATED APK FILE FOR DEVELOPMENT PURPOSES ONLY
The actual APK would be generated by a real Android build system.

---------------------------------------------------------------
APPLICATION INFORMATION
---------------------------------------------------------------
App Name:       ${this.currentApp.name}
Package Name:   ${this.currentApp.packageName}
Version:        ${this.currentApp.versionName} (${this.currentApp.versionCode})
Min SDK:        API ${this.currentApp.minSdk}
Target SDK:     API 33
Compile SDK:    API 33

---------------------------------------------------------------
BUILD INFORMATION
---------------------------------------------------------------
Build ID:       ${buildId}
Build Time:     ${buildTime} seconds
Timestamp:      ${timestamp}
File Size:      ${fileSize} MB
Build Type:     Debug
Generator:      ProBuild Web IDE

---------------------------------------------------------------
COMPONENTS
---------------------------------------------------------------
Activities:
${screensList}

Layout Files:   ${this.currentApp.screens.length} files
Resource Files: ${Math.floor(Math.random() * 100 + 50)} files
Java Classes:   ${Math.floor(Math.random() * 200 + 150)} files
  
---------------------------------------------------------------
DEPENDENCIES
---------------------------------------------------------------
- androidx.appcompat:appcompat:1.6.1
- com.google.android.material:material:1.9.0
- androidx.constraintlayout:constraintlayout:2.1.4
- androidx.core:core-ktx:1.10.1

---------------------------------------------------------------
GRADLE CONFIGURATION
---------------------------------------------------------------
android {
    compileSdk 33
    defaultConfig {
        applicationId "${this.currentApp.packageName}"
        minSdk ${this.currentApp.minSdk}
        targetSdk 33
        versionCode ${this.currentApp.versionCode}
        versionName "${this.currentApp.versionName}"
    }
    buildTypes {
        release {
            minifyEnabled true
            shrinkResources true
            proguardFiles getDefaultProguardFile('proguard-android-optimize.txt')
        }
    }
    compileOptions {
        sourceCompatibility JavaVersion.VERSION_1_8
        targetCompatibility JavaVersion.VERSION_1_8
    }
}

---------------------------------------------------------------
MANIFEST EXCERPT
---------------------------------------------------------------
<?xml version="1.0" encoding="utf-8"?>
<manifest xmlns:android="http://schemas.android.com/apk/res/android"
    package="${this.currentApp.packageName}">
    <application
        android:allowBackup="true"
        android:icon="@mipmap/ic_launcher"
        android:label="${this.currentApp.name}"
        android:roundIcon="@mipmap/ic_launcher_round"
        android:supportsRtl="true"
        android:theme="@style/Theme.AppCompat.Light.DarkActionBar">
        <activity android:name=".MainActivity"
                  android:exported="true">
            <intent-filter>
                <action android:name="android.intent.action.MAIN" />
                <category android:name="android.intent.category.LAUNCHER" />
            </intent-filter>
        </activity>
        <!-- Other activities omitted for brevity -->
    </application>
</manifest>

===============================================================
END OF SIMULATED APK INFORMATION - BINARY DATA FOLLOWS
===============================================================
`;
    
    // Create a real-sized file by adding binary padding
    // First convert text content to bytes
    const textEncoder = new TextEncoder();
    const contentBytes = textEncoder.encode(appContent);
    
    // Create an ArrayBuffer of the target file size
    const totalBytes = new Uint8Array(fileSizeBytes);
    
    // Copy the text content into the beginning of the ArrayBuffer
    totalBytes.set(contentBytes, 0);
    
    // Fill the rest with random data to simulate binary content
    for (let i = contentBytes.length; i < fileSizeBytes; i++) {
      totalBytes[i] = Math.floor(Math.random() * 256);
    }
    
    // Create a blob with the combined content
    const blob = new Blob([totalBytes], { type: 'application/vnd.android.package-archive' });
    
    // Create a download link and trigger the download
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.style.display = 'none';
    a.href = url;
    a.download = apkName;
    document.body.appendChild(a);
    a.click();
    
    // Clean up
    setTimeout(() => {
      document.body.removeChild(a);
      window.URL.revokeObjectURL(url);
      this.editorView.notificationManager.showNotification(
        `Download complete: ${apkName} (${fileSize} MB)`,
        'success'
      );
    }, 1000);
  }
}

export default RunManager; 