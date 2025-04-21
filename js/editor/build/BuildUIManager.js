// Manages Build UI elements like dialogs and progress updates
import NotificationManager from '../utils/NotificationManager.js';
import DialogUtility from '../utils/DialogUtility.js'; // Import the new utility

class BuildUIManager {
    constructor(notificationManager) {
        this.notificationManager = notificationManager || new NotificationManager();
        this.currentDialog = null;
    }

    // --- Dialog Methods ---

    showBuildOptionsDialog(currentApp, buildCallback) {
        console.log("Showing build options dialog for:", currentApp.name);
        this.closeCurrentDialog();

        const contentHtml = `
            <div class="build-options-container">
                <p class="build-intro">Select build type for <strong>${currentApp.name}</strong> v${currentApp.versionName || '1.0.0'}</p>
                
                <div class="build-option-list">
                    <div class="build-option">
                        <div class="build-option-info">
                            <h3>Debug APK</h3>
                            <p>For testing only. Not optimized, includes debug information.</p>
                        </div>
                        <button class="dialog-btn build-debug-btn primary">Build Debug</button>
                    </div>
                    
                    <div class="build-option">
                        <div class="build-option-info">
                            <h3>Release APK</h3>
                            <p>Optimized build without debugging information. Not signed.</p>
                        </div>
                        <button class="dialog-btn build-release-btn primary">Build Release</button>
                    </div>
                    
                    <div class="build-option">
                        <div class="build-option-info">
                            <h3>Signed Release APK</h3>
                            <p>Production-ready APK with digital signature for distribution.</p>
                        </div>
                        <button class="dialog-btn build-signed-btn primary">Build Signed</button>
                    </div>
                </div>
            </div>
        `;
        const actionsHtml = `<button class="dialog-btn cancel-btn">Cancel</button>`;
        const dialog = DialogUtility.createDialog('Build Options', contentHtml, actionsHtml, '600px');
        this.currentDialog = dialog;

        // Add event listeners
        const cancelBtn = dialog.querySelector('.cancel-btn');
        cancelBtn.addEventListener('click', () => DialogUtility.closeDialog(dialog));
        
        dialog.querySelector('.build-debug-btn').addEventListener('click', () => {
            DialogUtility.closeDialog(dialog);
            buildCallback('build-apk.yml', false);
        });
        dialog.querySelector('.build-release-btn').addEventListener('click', () => {
            DialogUtility.closeDialog(dialog);
            buildCallback('build-apk.yml', true);
        });
        dialog.querySelector('.build-signed-btn').addEventListener('click', () => {
            DialogUtility.closeDialog(dialog);
            buildCallback('build-signed-apk.yml', true);
        });
    }
    
    showGitHubConfigDialog(currentConfig, saveCallback) {
        console.log("Showing GitHub config dialog");
        this.closeCurrentDialog();
        
        const owner = currentConfig.owner || '';
        const repo = currentConfig.repo || '';
        const token = currentConfig.token || '';

        const contentHtml = `
            <div class="github-config-form">
                <div class="form-group">
                    <label for="github-owner">GitHub Username or Organization</label>
                    <input type="text" id="github-owner" value="${owner}" placeholder="e.g., your-username">
                </div>
                
                <div class="form-group">
                    <label for="github-repo">Repository Name</label>
                    <input type="text" id="github-repo" value="${repo}" placeholder="e.g., my-app">
                </div>
                
                <div class="form-group">
                    <label for="github-token">Personal Access Token</label>
                    <input type="password" id="github-token" value="${token}" placeholder="ghp_xxxxxxxxxxxx">
                    <small class="help-text">Needs repo and workflow permissions</small>
                </div>
                
                <div class="form-group">
                    <label>
                        <input type="checkbox" id="save-credentials" checked> 
                        Remember these credentials
                    </label>
                </div>
            </div>
        `;
        const actionsHtml = `
            <button class="dialog-btn cancel-btn">Cancel</button>
            <button class="dialog-btn save-btn primary">Continue</button>
        `;
        const dialog = DialogUtility.createDialog('GitHub Repository Configuration', contentHtml, actionsHtml, '500px');
        this.currentDialog = dialog;

        const closeDialog = (result) => {
            DialogUtility.closeDialog(dialog);
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
                this.notificationManager.showNotification('Please fill all GitHub fields.', 'warning');
                return;
            }
            closeDialog({ config: { owner: ownerVal, repo: repoVal, token: tokenVal }, saveCredentials: saveCredentialsVal });
        });
        
        DialogUtility.addCloseOnClickOutside(dialog, () => closeDialog(null));
    }
    
    showBuildProgressDialog(runData, cancelCallback) {
        console.log("Showing build progress dialog for run:", runData.id);
        this.closeCurrentDialog();
        
        const contentHtml = `
            <div class="build-status">
                <div class="status-header">
                    <span class="status-badge pending">Initializing</span>
                    <span class="status-time">Started: ${new Date(runData.created_at || Date.now()).toLocaleTimeString()}</span>
                </div>
                <div class="progress-container"><div class="progress-bar"><div class="progress-fill" style="width: 0%"></div></div><div class="progress-label">0%</div></div>
                <div class="status-details"><div class="status-title">Build Status</div><div class="status-message">Preparing...</div></div>
                <div class="build-log-container"><div class="build-log-title">Build Log</div><div class="build-log">Connecting...</div></div>
            </div>
        `;
        const actionsHtml = `
            <button class="dialog-btn cancel-build-btn">Cancel Build</button>
            <a href="${runData.html_url}" target="_blank" class="dialog-btn view-on-github-btn">View on GitHub</a>
        `;
        const dialog = DialogUtility.createDialog('Building APK', contentHtml, actionsHtml, '600px');
        dialog.classList.add('build-progress-dialog');
        this.currentDialog = dialog;
        dialog.querySelector('.cancel-build-btn').addEventListener('click', cancelCallback);
        return dialog;
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
        
        const contentHtml = `
            <div class="build-success">
                <div class="success-icon">
                    <i class="material-icons" style="font-size: 64px; color: #0f9d58;">check_circle</i>
                </div>
                <h2 class="success-title">${buildInfo.type.charAt(0).toUpperCase() + buildInfo.type.slice(1)} APK Build Successful</h2>
                
                <div class="build-details">
                    <div class="detail-row">
                        <div class="detail-label">App:</div>
                        <div class="detail-value">${buildInfo.appName} v${buildInfo.versionName}</div>
                    </div>
                    <div class="detail-row">
                        <div class="detail-label">Build ID:</div>
                        <div class="detail-value">
                            <a href="${buildInfo.buildUrl}" target="_blank">${buildInfo.runId}</a>
                        </div>
                    </div>
                    <div class="detail-row">
                        <div class="detail-label">Completed:</div>
                        <div class="detail-value">${new Date(buildInfo.timestamp).toLocaleString()}</div>
                    </div>
                    <div class="detail-row">
                        <div class="detail-label">File:</div>
                        <div class="detail-value">${buildInfo.appName}_${buildInfo.type}_${buildInfo.versionName}.apk</div>
                    </div>
                </div>
            </div>
        `;
        const actionsHtml = `
            <button class="dialog-btn close-btn">Close</button>
            <a href="${buildInfo.buildUrl}" target="_blank" class="dialog-btn open-github-btn">View on GitHub</a>
            <button class="dialog-btn download-btn primary">Download APK</button>
        `;
        const dialog = DialogUtility.createDialog('Build Successful', contentHtml, actionsHtml, '550px');
        this.currentDialog = dialog;
        dialog.querySelector('.download-btn').addEventListener('click', downloadCallback);
        dialog.querySelector('.close-btn').addEventListener('click', () => this.closeCurrentDialog());
    }

    showBuildFailedDialog(buildInfo, retryCallback, viewLogsCallback) {
        console.log("Showing build failed dialog:", buildInfo);
        this.closeCurrentDialog();

        const contentHtml = `
            <div class="build-failed">
                <div class="failure-icon">
                    <i class="material-icons" style="font-size: 64px; color: #ea4335;">error_outline</i>
                </div>
                <h2 class="failure-title">Build Failed</h2>
                
                <div class="build-details">
                    <div class="detail-row">
                        <div class="detail-label">App:</div>
                        <div class="detail-value">${buildInfo.appName} v${buildInfo.versionName}</div>
                    </div>
                    <div class="detail-row">
                        <div class="detail-label">Type:</div>
                        <div class="detail-value">${buildInfo.type}</div>
                    </div>
                    <div class="detail-row">
                        <div class="detail-label">Error:</div>
                        <div class="detail-value">${buildInfo.conclusion || 'failure'}</div>
                    </div>
                    <div class="detail-row">
                        <div class="detail-label">Timestamp:</div>
                        <div class="detail-value">${new Date(buildInfo.timestamp).toLocaleString()}</div>
                    </div>
                </div>
                
                <div class="error-help">
                    <p>View the build logs on GitHub for detailed error information.</p>
                </div>
            </div>
        `;
        const actionsHtml = `
            <button class="dialog-btn close-btn">Close</button>
            <a href="${buildInfo.buildUrl}" target="_blank" class="dialog-btn view-logs-btn primary">View Logs</a>
            <button class="dialog-btn retry-btn primary">Retry Build</button>
        `;
        const dialog = DialogUtility.createDialog('Build Failed', contentHtml, actionsHtml, '550px');
        this.currentDialog = dialog;
        dialog.querySelector('.retry-btn').addEventListener('click', retryCallback);
        dialog.querySelector('.close-btn').addEventListener('click', () => this.closeCurrentDialog());
    }
    
    showPreparationDialog() {
        this.closeCurrentDialog();
        const contentHtml = `
            <div class="preparation-status">
                <div class="preparation-icon">
                    <i class="material-icons" style="font-size: 32px; color: #4285f4;">cloud_upload</i>
                </div>
                <p>Preparing your project for build...</p>
                <div class="build-steps">
                    <div class="step" data-step="collecting" data-status="current">
                        <div class="step-status">
                            <i class="material-icons step-icon">hourglass_top</i>
                            <span>Collecting project files</span>
                        </div>
                    </div>
                    <div class="step" data-step="workflow" data-status="pending">
                        <div class="step-status">
                            <i class="material-icons step-icon">schedule</i>
                            <span>Checking workflow file</span>
                        </div>
                    </div>
                    <div class="step" data-step="pushing" data-status="pending">
                        <div class="step-status">
                            <i class="material-icons step-icon">schedule</i>
                            <span>Pushing project files</span>
                        </div>
                    </div>
                </div>
            </div>
        `;
        const actionsHtml = '';
        const prepDialog = DialogUtility.createDialog('Preparing Build', contentHtml, actionsHtml, '500px');
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
        DialogUtility.closeDialog(this.currentDialog);
        this.currentDialog = null;
    }
}

export default BuildUIManager; 