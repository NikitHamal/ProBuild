// Manages Build UI elements like dialogs and progress updates
import NotificationManager from '../utils/NotificationManager.js'; // Assuming path

class BuildUIManager {
    constructor(notificationManager) {
        this.notificationManager = notificationManager || new NotificationManager(); // Use passed manager or create new
        this.currentDialog = null; // Track the currently open dialog
    }

    // --- Dialog Methods ---

    showBuildOptionsDialog(currentApp, buildCallback) {
        console.log("Showing build options dialog for:", currentApp.name);
        this.closeCurrentDialog();

        const dialog = document.createElement('div');
        dialog.className = 'dialog-overlay';
        // Simplified innerHTML for brevity - full HTML should be used
        dialog.innerHTML = `
          <div class="dialog" style="width: 550px; max-width: 90%;">
            <div class="dialog-header">
              <div class="dialog-title">Build APK Options</div>
            </div>
            <div class="dialog-content">
              <p>Select build options for ${currentApp.name}.apk</p>
              <div class="build-option">
                 <button class="dialog-btn build-debug-btn primary">Build Debug APK</button>
              </div>
              <div class="build-option">
                 <button class="dialog-btn build-release-btn primary">Build Release APK</button>
              </div>
               <div class="build-option">
                 <button class="dialog-btn build-signed-btn primary">Build Signed APK</button>
               </div>
            </div>
            <div class="dialog-actions">
              <button class="dialog-btn cancel-btn">Cancel</button>
            </div>
          </div>
        `; // Make sure to use the full original HTML structure
        
        document.body.appendChild(dialog);
        this.currentDialog = dialog;

        // Add event listeners
        const cancelBtn = dialog.querySelector('.cancel-btn');
        cancelBtn.addEventListener('click', () => dialog.remove());
        
        dialog.querySelector('.build-debug-btn').addEventListener('click', () => {
            dialog.remove();
            buildCallback('build-apk.yml', false); // Trigger debug build
        });
         dialog.querySelector('.build-release-btn').addEventListener('click', () => {
            dialog.remove();
            buildCallback('build-apk.yml', true);
        });
        dialog.querySelector('.build-signed-btn').addEventListener('click', () => {
            dialog.remove();
            buildCallback('build-signed-apk.yml', true);
        });
    }
    
    showGitHubConfigDialog(currentConfig, saveCallback) {
        console.log("Showing GitHub config dialog");
        this.closeCurrentDialog();
        
        const owner = currentConfig.owner || '';
        const repo = currentConfig.repo || '';
        const token = currentConfig.token || '';

        const dialog = document.createElement('div');
        dialog.className = 'dialog-overlay';
        // Simplified HTML - use full original structure
        dialog.innerHTML = `
          <div class="dialog">
            <div class="dialog-header">
              <div class="dialog-title">GitHub Repository Configuration</div>
            </div>
            <div class="dialog-content">
               <input type="text" id="github-owner" value="${owner}" placeholder="Owner">
               <input type="text" id="github-repo" value="${repo}" placeholder="Repo">
               <input type="password" id="github-token" value="${token}" placeholder="Token">
               <input type="checkbox" id="save-credentials" checked> Remember
            </div>
            <div class="dialog-actions">
              <button class="dialog-btn cancel-btn">Cancel</button>
              <button class="dialog-btn save-btn primary">Continue</button>
            </div>
          </div>
        `; // Make sure to use the full original HTML

        document.body.appendChild(dialog);
        this.currentDialog = dialog;

        const closeDialog = (result) => {
            dialog.remove();
            this.currentDialog = null;
            saveCallback(result ? result.config : null, result ? result.saveCredentials : false);
        };

        dialog.querySelector('.cancel-btn').addEventListener('click', () => closeDialog(null));
        
        dialog.querySelector('.save-btn').addEventListener('click', () => {
            const ownerVal = dialog.querySelector('#github-owner').value.trim();
            const repoVal = dialog.querySelector('#github-repo').value.trim();
            const tokenVal = dialog.querySelector('#github-token').value.trim();
            const saveCredentialsVal = dialog.querySelector('#save-credentials').checked;
            
            if (!ownerVal || !repoVal || !tokenVal) {
                // Add error indication
                this.notificationManager.showNotification('Please fill all GitHub fields.', 'warning');
                return;
            }
            closeDialog({ config: { owner: ownerVal, repo: repoVal, token: tokenVal }, saveCredentials: saveCredentialsVal });
        });
        
        dialog.addEventListener('click', (e) => { if (e.target === dialog) closeDialog(null); });
    }
    
    showBuildProgressDialog(runData, cancelCallback) {
        console.log("Showing build progress dialog for run:", runData.id);
        this.closeCurrentDialog();
        
        const dialog = document.createElement('div');
        dialog.className = 'dialog-overlay';
        // Simplified HTML - Use full original structure
        dialog.innerHTML = `
          <div class="dialog build-progress-dialog" style="width: 600px;">
            <div class="dialog-header"><div class="dialog-title">Building APK</div></div>
            <div class="dialog-content">
              <div class="build-status">
                 <div class="status-header">
                     <span class="status-badge pending">Initializing</span>
                     <span class="status-time">Started: ${new Date(runData.created_at || Date.now()).toLocaleTimeString()}</span>
                 </div>
                 <div class="progress-container"><div class="progress-bar"><div class="progress-fill" style="width: 0%"></div></div><div class="progress-label">0%</div></div>
                 <div class="status-details"><div class="status-title">Build Status</div><div class="status-message">Preparing...</div></div>
                 <div class="build-log-container"><div class="build-log-title">Build Log</div><div class="build-log">Connecting...</div></div>
              </div>
            </div>
            <div class="dialog-actions">
              <button class="dialog-btn cancel-build-btn">Cancel Build</button>
              <a href="${runData.html_url}" target="_blank" class="dialog-btn view-on-github-btn">View on GitHub</a>
            </div>
          </div>
        `; // Use full original HTML structure
        
        dialog.querySelector('.cancel-build-btn').addEventListener('click', cancelCallback);
        
        document.body.appendChild(dialog);
        this.currentDialog = dialog;
        return dialog; // Return dialog element for updates
    }

    updateBuildProgressUI(dialog, runData, jobsData) {
        if (!dialog || !runData) return;
        // console.log("Updating progress UI for run:", runData.id, runData.status);
        
        // Update status badge
        const statusBadge = dialog.querySelector('.status-badge');
        if (statusBadge) {
            statusBadge.className = 'status-badge'; // Reset classes
            let statusText = runData.status;
            let statusClass = 'pending';
            if (runData.status === 'in_progress') { statusClass = 'running'; statusText='Running'; }
            else if (runData.status === 'queued') { statusClass = 'pending'; statusText='Queued'; }
            else if (runData.status === 'completed') {
                statusText = runData.conclusion || 'Unknown';
                if (runData.conclusion === 'success') { statusClass = 'success'; statusText='Success'; }
                else if (runData.conclusion === 'failure') { statusClass = 'failed'; statusText='Failed'; }
                else if (runData.conclusion === 'cancelled') { statusClass = 'cancelled'; statusText='Cancelled'; }
                else { statusClass = 'neutral'; }
            }
            statusBadge.classList.add(statusClass);
            statusBadge.textContent = statusText;
        }
        
        // Update times
        const statusTime = dialog.querySelector('.status-time');
         if (statusTime) {
            const startedAt = runData.created_at ? new Date(runData.created_at) : null;
            const updatedAt = runData.updated_at ? new Date(runData.updated_at) : null;
            let timeText = startedAt ? `Started: ${startedAt.toLocaleTimeString()}` : '';
            if (updatedAt && runData.status === 'completed') {
                const duration = (updatedAt - startedAt) / 1000;
                let durationText = duration < 60 ? `${Math.round(duration)}s` : `${Math.floor(duration / 60)}m ${Math.round(duration % 60)}s`;
                timeText += ` • Duration: ${durationText}`;
            }
            statusTime.textContent = timeText;
        }
        
        // Update progress bar and log
        const progressBar = dialog.querySelector('.progress-fill');
        const progressLabel = dialog.querySelector('.progress-label');
        const buildLog = dialog.querySelector('.build-log');
        const statusMessage = dialog.querySelector('.status-message');
        
        if (progressBar && progressLabel && buildLog && statusMessage) {
            let progress = 0;
            if (runData.status === 'completed') progress = 100;
            else if (runData.status === 'queued') progress = 5;
            else if (runData.status === 'in_progress') {
                 if (jobsData && jobsData.jobs && jobsData.jobs.length > 0) {
                    const buildJob = jobsData.jobs[0]; // Assuming first job is the main one
                    if (buildJob && buildJob.steps) {
                        const totalSteps = buildJob.steps.length;
                        const completedSteps = buildJob.steps.filter(s => s.status === 'completed').length;
                        progress = totalSteps > 0 ? Math.round((completedSteps / totalSteps) * 100) : 50; // Estimate if no steps
                        
                        // Update Log
                        buildLog.innerHTML = ''; // Clear
                        let currentStepName = 'Processing...';
                        buildJob.steps.forEach(step => {
                            const stepStatus = step.conclusion || step.status;
                            let icon = 'schedule';
                            if (stepStatus === 'completed' && step.conclusion === 'success') icon = 'check_circle';
                            else if (stepStatus === 'completed' && step.conclusion === 'failure') icon = 'error';
                            else if (stepStatus === 'in_progress') { icon = 'hourglass_top'; currentStepName = step.name; }
                            else if (stepStatus === 'queued') icon = 'schedule';
                            else if (stepStatus === 'skipped') icon = 'skip_next';
                            else if (stepStatus === 'cancelled') icon = 'cancel';
                            
                            buildLog.innerHTML += `<div class="log-step ${stepStatus} ${step.conclusion || ''}">
                              <i class="material-icons step-icon">${icon}</i>
                              <span class="step-name">${step.name}</span>
                              <span class="step-status">${stepStatus}${step.conclusion ? ' ('+step.conclusion+')' : ''}</span>
                            </div>`;
                        });
                        statusMessage.textContent = currentStepName;
                    } else {
                         progress = 50; // In progress but no steps yet?
                         statusMessage.textContent = 'Starting build steps...';
                    }
                 } else {
                     progress = 25; // In progress, waiting for jobs
                     statusMessage.textContent = 'Waiting for job details...';
                 }
            }
             progressBar.style.width = `${progress}%`;
             progressLabel.textContent = `${progress}%`;
        }
    }
    
    showBuildCompletedDialog(buildInfo, downloadCallback, viewLogsCallback) {
        console.log("Showing build completed dialog:", buildInfo);
        this.closeCurrentDialog();
        
        const dialog = document.createElement('div');
        dialog.className = 'dialog-overlay';
        // Simplified HTML - Use full original structure
        dialog.innerHTML = `
            <div class="dialog" style="width: 550px;">
               <div class="dialog-header"><div class="dialog-title">Build Successful</div></div>
               <div class="dialog-content" style="text-align: center;">
                  <i class="material-icons" style="font-size: 64px; color: #4CAF50;">check_circle</i>
                  <h2>${buildInfo.type.charAt(0).toUpperCase() + buildInfo.type.slice(1)} APK Built</h2>
                  <p>APK: ${buildInfo.appName}_${buildInfo.type}_${buildInfo.versionName}.apk (inside ${buildInfo.expectedArtifactName}.zip)</p>
                  <p>Build ID: <a href="${buildInfo.buildUrl}" target="_blank">${buildInfo.runId}</a></p>
                  <p>Timestamp: ${new Date(buildInfo.timestamp).toLocaleString()}</p>
               </div>
               <div class="dialog-actions">
                   <button class="dialog-btn close-btn">Close</button>
                   <a href="${buildInfo.buildUrl}" target="_blank" class="dialog-btn open-github-btn">View Build Run</a>
                   <button class="dialog-btn download-btn primary">Download Artifact (.zip)</button> 
               </div>
            </div>
        `; // Use full original HTML structure
        
        dialog.querySelector('.download-btn').addEventListener('click', downloadCallback);
        dialog.querySelector('.close-btn').addEventListener('click', () => this.closeCurrentDialog());

        document.body.appendChild(dialog);
        this.currentDialog = dialog;
    }

    showBuildFailedDialog(buildInfo, retryCallback, viewLogsCallback) {
        console.log("Showing build failed dialog:", buildInfo);
        this.closeCurrentDialog();

        const dialog = document.createElement('div');
        dialog.className = 'dialog-overlay';
        // Simplified HTML - Use full original structure
        dialog.innerHTML = `
           <div class="dialog" style="width: 550px;">
              <div class="dialog-header"><div class="dialog-title">Build Failed</div></div>
              <div class="dialog-content" style="text-align: center;">
                 <i class="material-icons" style="font-size: 64px; color: #f44336;">error_outline</i>
                 <h2>Build Failed</h2>
                 <p>Type: ${buildInfo.type}</p>
                 <p>Conclusion: ${buildInfo.conclusion || 'failure'}</p>
                 <p>Build ID: <a href="${buildInfo.buildUrl}" target="_blank">${buildInfo.runId}</a></p>
                 <p>Timestamp: ${new Date(buildInfo.timestamp).toLocaleString()}</p>
                 <p>Check logs on GitHub for details.</p>
              </div>
              <div class="dialog-actions">
                  <button class="dialog-btn cancel-btn">Close</button>
                  <a href="${buildInfo.buildUrl}" target="_blank" class="dialog-btn primary">View Logs</a>
                  <button class="dialog-btn retry-btn primary">Retry Build</button>
              </div>
           </div>
        `; // Use full original HTML structure
        
        dialog.querySelector('.retry-btn').addEventListener('click', retryCallback);
        dialog.querySelector('.cancel-btn').addEventListener('click', () => this.closeCurrentDialog());
        
        document.body.appendChild(dialog);
        this.currentDialog = dialog;
    }
    
    showPreparationDialog() {
        this.closeCurrentDialog();
        const prepDialog = document.createElement('div');
        prepDialog.className = 'dialog-overlay';
        prepDialog.innerHTML = `
            <div class="dialog">
                <div class="dialog-header">
                    <div class="dialog-title">
                        <i class="material-icons" style="vertical-align: middle; margin-right: 8px;">sync</i>
                        Preparing Build
                    </div>
                </div>
                <div class="dialog-content">
                    <div class="status-box">
                        <p>Collecting project files and preparing for build...</p>
                        <div class="build-steps">
                            <div class="step" data-step="collecting" data-status="current"><div class="step-status"><i class="material-icons step-icon">hourglass_top</i><span>Collecting project files</span></div></div>
                             <div class="step" data-step="workflow" data-status="pending"><div class="step-status"><i class="material-icons step-icon">schedule</i><span>Checking workflow file</span></div></div>
                             <div class="step" data-step="pushing" data-status="pending"><div class="step-status"><i class="material-icons step-icon">schedule</i><span>Pushing project files</span></div></div>
                        </div>
                    </div>
                </div>
            </div>
        `;
        document.body.appendChild(prepDialog);
        this.currentDialog = prepDialog;
        return prepDialog;
    }
    
    updatePreparationStatus(stepName) {
        if (!this.currentDialog) return;
        const stepsContainer = this.currentDialog.querySelector('.build-steps');
        if (!stepsContainer) return;
        
        const steps = stepsContainer.querySelectorAll('.step');
        let currentStepReached = false;
        steps.forEach(step => {
            const statusDiv = step.querySelector('.step-status');
            const icon = statusDiv.querySelector('.step-icon');
            
            if (step.dataset.step === stepName) {
                icon.textContent = 'hourglass_top';
                step.dataset.status = 'current';
                currentStepReached = true;
            } else if (!currentStepReached) {
                icon.textContent = 'check_circle';
                step.dataset.status = 'done';
            } else {
                 icon.textContent = 'schedule';
                 step.dataset.status = 'pending';
            }
        });
    }

    closeCurrentDialog() {
        if (this.currentDialog) {
            this.currentDialog.remove();
            this.currentDialog = null;
        }
    }
}

export default BuildUIManager; 