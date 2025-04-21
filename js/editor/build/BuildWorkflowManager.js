import ProjectBuilder from './ProjectBuilder.js';
import GitHubService from './GitHubService.js';
import BuildUIManager from './BuildUIManager.js';
import NotificationManager from '../../ui/NotificationManager.js';

// Orchestrates the build process
class BuildWorkflowManager {
    constructor(editorView) {
        this.editorView = editorView;
        this.appService = editorView.appService;
        
        // Use editorView's notificationManager if available, or create a new instance
        this.notificationManager = editorView.notificationManager || NotificationManager.getInstance();
        this.buildUIManager = new BuildUIManager(this.notificationManager);
        
        // GitHub config (managed here, passed to GitHubService)
        this.githubConfig = {
            owner: localStorage.getItem('githubOwner') || null,
            repo: localStorage.getItem('githubRepo') || null,
            token: localStorage.getItem('githubToken') || null
        };
        this.githubService = null; // Initialized when config is confirmed
        
        this.currentApp = null;
        this.isMonitoring = false;
        this.monitorInterval = null;
    }

    // --- Main entry point --- 
    startBuildProcess() {
        this.currentApp = this.editorView.currentApp;
        if (!this.currentApp) {
            this.notificationManager.showNotification('No app selected for build.', 'error');
            return;
        }
        
        this.buildUIManager.showBuildOptionsDialog(this.currentApp, 
            // Callback function when a build type is selected
            (workflowFile, isRelease) => {
                 this.initiateBuild(workflowFile, isRelease);
            }
        );
    }

    // --- Build Steps ---
    async initiateBuild(workflowFile, isRelease) {
        try {
            const confirmedConfig = await this.confirmGitHubConfig();
            if (!confirmedConfig) {
                this.notificationManager.showNotification('Build cancelled: GitHub configuration required.', 'info');
                return;
            }
            
            this.githubService = new GitHubService(this.githubConfig);
            const prepDialog = this.buildUIManager.showPreparationDialog();

            // 1. Collect project files
            this.buildUIManager.updatePreparationStatus('collecting');
            const projectBuilder = new ProjectBuilder(this.currentApp);
            const projectFiles = await projectBuilder.collectProjectFiles(); // Ensure this uses appData correctly
            if (!projectFiles) {
                this.buildUIManager.closeCurrentDialog();
                this.notificationManager.showNotification('Build failed: Could not collect project files.', 'error');
                return;
            }

            // 2. Check/Push Workflow File
            this.buildUIManager.updatePreparationStatus('workflow');
            const workflowContent = projectBuilder.workflowContents[workflowFile]; // Get content from ProjectBuilder
            await this.githubService.checkAndPushWorkflowFile(workflowFile, workflowContent);

            // 3. Check/Push Project Files
            this.buildUIManager.updatePreparationStatus('pushing');
            await this.githubService.checkAndPushProjectFiles(projectFiles);

            // 4. Trigger Workflow
            await this.githubService.triggerWorkflow(this.githubConfig.owner, this.githubConfig.repo, workflowFile);
            
            // 5. Find the latest workflow run (the one we just triggered)
            const runData = await this.githubService.findLatestWorkflowRun(
                this.githubConfig.owner,
                this.githubConfig.repo,
                workflowFile
            );
            
            this.buildUIManager.closeCurrentDialog(); // Close preparation dialog
            this.notificationManager.showNotification('Build triggered on GitHub Actions.', 'info');
            
            // 6. Monitor Workflow Run
            await this.monitorWorkflow(workflowFile, isRelease, runData);

        } catch (error) {
            console.error('Build initiation failed:', error);
            this.buildUIManager.closeCurrentDialog();
            this.notificationManager.showNotification(`Build Error: ${error.message}`, 'error');
            this.githubService = null; // Reset service on error
        }
    }
    
    async confirmGitHubConfig() {
        if (this.githubConfig.owner && this.githubConfig.repo && this.githubConfig.token) {
            return true; // Already configured
        }
        
        return new Promise((resolve) => {
            this.buildUIManager.showGitHubConfigDialog(this.githubConfig, 
                (newConfig, saveCredentials) => {
                    if (newConfig) {
                        this.githubConfig = newConfig;
                        if (saveCredentials) {
                            localStorage.setItem('githubOwner', newConfig.owner);
                            localStorage.setItem('githubRepo', newConfig.repo);
                            localStorage.setItem('githubToken', newConfig.token);
                        }
                        resolve(true);
                    } else {
                        resolve(false); // User cancelled
                    }
            });
        });
    }

    async monitorWorkflow(workflowFile, isRelease, runData) {
        if (!this.githubService) return;
        
        try {
            if (!runData || !runData.id) {
                this.notificationManager.showNotification('Unable to find the triggered workflow run.', 'error');
                return;
            }
            
            const progressDialog = this.buildUIManager.showBuildProgressDialog(runData, () => {
                // Cancel callback
                this.cancelBuild(runData.id);
            });
            
            this.isMonitoring = true;
            let attempts = 0;
            const maxAttempts = 180; // ~30 mins
            
            this.monitorInterval = setInterval(async () => {
                if (!this.isMonitoring || attempts >= maxAttempts) {
                    clearInterval(this.monitorInterval);
                    this.monitorInterval = null;
                    if (attempts >= maxAttempts) {
                         this.notificationManager.showNotification('Build timed out while monitoring.', 'warning');
                         this.buildUIManager.closeCurrentDialog();
                    }
                    return;
                }
                
                attempts++;
                
                try {
                    const currentRunData = await this.githubService.getWorkflowRunStatus(runData.id);
                    let jobsData = null;
                    if (currentRunData.status === 'in_progress' && currentRunData.jobs_url) {
                        jobsData = await this.githubService.getWorkflowJobs(currentRunData.jobs_url);
                    }
                    
                    this.buildUIManager.updateBuildProgressUI(progressDialog, currentRunData, jobsData);
                    
                    if (currentRunData.status === 'completed') {
                        this.isMonitoring = false;
                        clearInterval(this.monitorInterval);
                        this.monitorInterval = null;
                        
                        // Handle completion/failure
                        this.handleBuildCompletion(workflowFile, isRelease, currentRunData);
                    }
                } catch (error) {
                    console.error('Error during workflow monitoring poll:', error);
                    // Keep polling, but maybe notify?
                    // this.notificationManager.showNotification('Issue checking build status.', 'warning');
                }
            }, 10000); // Poll every 10 seconds

        } catch (error) {
             console.error('Error starting workflow monitoring:', error);
             this.notificationManager.showNotification(`Monitoring Error: ${error.message}`, 'error');
             this.isMonitoring = false;
        }
    }

    handleBuildCompletion(workflowFile, isRelease, runData) {
        const buildType = isRelease ? (workflowFile === 'build-signed-apk.yml' ? 'signed release' : 'release') : 'debug';
        
        // Update artifact names to match what's in the workflow files
        let expectedArtifactName = 'debug-apk'; // Default for build-apk.yml debug
        if (workflowFile === 'build-apk.yml' && isRelease) {
            expectedArtifactName = 'release-apk'; // Adjusted name
        } else if (workflowFile === 'build-signed-apk.yml') {
            expectedArtifactName = 'signed-apk';
        }
        
         const buildInfo = {
            type: buildType,
            appName: this.currentApp.name,
            versionName: this.currentApp.versionName,
            buildUrl: runData.html_url,
            runId: runData.id,
            conclusion: runData.conclusion,
            timestamp: runData.updated_at || runData.created_at,
            config: this.githubConfig,
            workflowFile: workflowFile,
            isRelease: isRelease,
            expectedArtifactName: expectedArtifactName
        };
        
        if (runData.conclusion === 'success') {
            this.buildUIManager.showBuildCompletedDialog(buildInfo, 
                () => this.downloadBuildArtifact(runData.id, expectedArtifactName), // Download callback
                () => window.open(runData.html_url, '_blank') // View logs callback
            );
        } else {
             this.buildUIManager.showBuildFailedDialog(buildInfo,
                () => this.retryBuild(workflowFile, isRelease, runData.id), // Retry callback
                () => window.open(runData.html_url, '_blank') // View logs callback
            );
        }
    }

    async cancelBuild(runId) {
        this.isMonitoring = false; // Stop monitoring immediately
        if (this.monitorInterval) {
            clearInterval(this.monitorInterval);
            this.monitorInterval = null;
        }
        
        if (!this.githubService) return;
        
        const confirmed = confirm('Are you sure you want to cancel the build on GitHub Actions?');
        if (confirmed) {
            try {
                await this.githubService.cancelWorkflowRun(runId);
                this.buildUIManager.closeCurrentDialog();
                this.notificationManager.showNotification('Build cancellation requested.', 'info');
            } catch (error) {
                this.notificationManager.showNotification(`Failed to cancel build: ${error.message}`, 'error');
            }
        } else {
             this.isMonitoring = true; // Resume monitoring if cancelled
        }
    }
    
    async downloadBuildArtifact(runId, artifactName) {
         if (!this.githubService) return;
         this.notificationManager.showNotification(`Fetching artifact '${artifactName}'...`, 'info');
         try {
             // First ensure the workflow run has been completed
             const runStatus = await this.githubService.getWorkflowRunStatus(
                 this.githubConfig.owner, 
                 this.githubConfig.repo, 
                 runId
             );
             
             if (runStatus !== 'completed') {
                 this.notificationManager.showNotification('Build is still in progress. Please wait until it completes.', 'warning');
                 return;
             }
             
             // Get all artifacts from the run
             const artifactsData = await this.githubService._fetchGitHubAPI(`actions/runs/${runId}/artifacts`);
             if (!artifactsData || !artifactsData.artifacts || artifactsData.artifacts.length === 0) {
                 this.notificationManager.showNotification('No artifacts found for this build.', 'warning');
                 return;
             }
             
             // Find the specific artifact by name
             const artifact = artifactsData.artifacts.find(a => a.name === artifactName);
             if (!artifact) {
                 this.notificationManager.showNotification(`Artifact '${artifactName}' not found in this build.`, 'warning');
                 return;
             }
             
             const artifactInfo = {
                 name: artifact.name,
                 url: artifact.archive_download_url
             };
             
             if (artifactInfo && artifactInfo.url) {
                 const blob = await this.githubService.downloadArtifact(artifactInfo.url);
                 
                 // Trigger browser download
                 const downloadUrl = window.URL.createObjectURL(blob);
                 const a = document.createElement('a');
                 a.style.display = 'none';
                 a.href = downloadUrl;
                 a.download = `${artifactInfo.name}.zip`; // Always downloaded as zip
                 document.body.appendChild(a);
                 a.click();
                 window.URL.revokeObjectURL(downloadUrl);
                 a.remove();
                 this.notificationManager.showNotification(`Downloaded ${a.download}. Remember to unzip it.`, 'success');
                 
             } else {
                 this.notificationManager.showNotification(`Artifact '${artifactName}' not found or download link expired.`, 'warning');
             }
         } catch (error) {
              this.notificationManager.showNotification(`Artifact download failed: ${error.message}`, 'error');
         }
    }
    
    async retryBuild(workflowFile, isRelease, failedRunId) {
        if (!this.githubService) return;
        this.notificationManager.showNotification('Retrying build...', 'info');
        try {
            // Option 1: Rerun the failed workflow (might not have latest code)
            // await this.githubService.rerunWorkflow(failedRunId);
            
            // Option 2: Trigger a completely new build (preferred to ensure latest code)
            await this.initiateBuild(workflowFile, isRelease);
            
        } catch (error) {
             this.notificationManager.showNotification(`Retry failed: ${error.message}`, 'error');
        }
    }
}

export default BuildWorkflowManager; 