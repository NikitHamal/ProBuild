// Handles all interaction with the GitHub API

class GitHubService {
    constructor(config) {
        this.owner = config.owner;
        this.repo = config.repo;
        this.token = config.token;
        if (!this.owner || !this.repo || !this.token) {
             throw new Error('GitHubService requires owner, repo, and token.');
        }
    }
    
    // --- GitHub API Interaction Methods ---
    
    async _fetchGitHubAPI(endpoint, options = {}) {
        const url = `https://api.github.com/repos/${this.owner}/${this.repo}/${endpoint}`;
        const defaultHeaders = {
            'Authorization': `Bearer ${this.token}`,
            'Accept': 'application/vnd.github.v3+json'
        };
        if (options.method === 'POST' || options.method === 'PUT' || options.method === 'PATCH') {
            defaultHeaders['Content-Type'] = 'application/json';
        }

        const fetchOptions = {
            ...options,
            headers: {
                ...defaultHeaders,
                ...options.headers
            }
        };

        try {
            const response = await fetch(url, fetchOptions);
            // Handle rate limiting explicitly? (403 with specific message)
            if (!response.ok) {
                const errorData = await response.json().catch(() => ({ message: response.statusText }));
                const errorMessage = `GitHub API Error (${response.status}): ${errorData.message || 'Unknown error'} for ${options.method || 'GET'} ${url}`;
                console.error(errorMessage, errorData);
                throw new Error(errorMessage);
            }
            // Handle 204 No Content for dispatch/cancel/rerun
            if (response.status === 204) {
                 return null; // Or return true?
            }
            return await response.json();
        } catch (error) {
             console.error(`Network or Fetch Error calling GitHub API: ${error.message}`);
             throw error; // Re-throw original error
        }
    }
    
    async _fetchGitHubRaw(url, options = {}) {
         // Helper for downloading artifacts, might need different error handling
         const fetchOptions = {
             ...options,
             headers: {
                'Authorization': `Bearer ${this.token}`,
                ...options.headers
             }
         };
         try {
             const response = await fetch(url, fetchOptions);
              if (!response.ok) {
                 const errorText = await response.text();
                 console.error('GitHub Raw Fetch Error:', response.status, errorText);
                 throw new Error(`Failed to fetch ${url}: ${response.statusText}`);
             }
             return response; // Return the raw response (e.g., for blob())
         } catch (error) {
              console.error(`Network or Fetch Error on raw download: ${error.message}`);
              throw error;
         }
    }

    async checkAndPushWorkflowFile(workflowFileName, workflowContent) {
        const workflowPath = `.github/workflows/${workflowFileName}`;
        try {
            let fileSha = null;
            try {
                const existingFileData = await this._fetchGitHubAPI(`contents/${workflowPath}`);
                fileSha = existingFileData.sha;
                const currentContent = atob(existingFileData.content);
                if (currentContent === workflowContent) {
                    console.log(`Workflow file ${workflowFileName} is up to date.`);
                    return true; // No update needed
                }
                console.log(`Updating existing workflow file: ${workflowFileName}`);
            } catch (error) {
                 if (error.message.includes('404')) {
                    console.log(`Workflow file ${workflowFileName} not found, creating...`);
                     // Need to ensure directory exists first
                     try {
                         await this._fetchGitHubAPI('contents/.github/workflows');
                     } catch (dirError) {
                          if (dirError.message.includes('404')) {
                              console.log('Creating .github/workflows directory...');
                              await this._fetchGitHubAPI('contents/.github/workflows/.gitkeep', {
                                  method: 'PUT',
                                  body: JSON.stringify({
                                      message: 'Create workflows directory',
                                      content: btoa(''),
                                      branch: 'main'
                                  })
                              });
                               // Small delay after creating directory
                               await new Promise(resolve => setTimeout(resolve, 1000));
                          } else {
                              throw dirError; // Re-throw other directory check errors
                          }
                     }
                 } else {
                     throw error; // Re-throw other errors during file check
                 }
            }

            // Create or Update the file
            await this._fetchGitHubAPI(`contents/${workflowPath}`, {
                method: 'PUT',
                body: JSON.stringify({
                    message: fileSha ? `Update ${workflowFileName}` : `Create ${workflowFileName}`,
                    content: btoa(workflowContent),
                    sha: fileSha, // Required for update, ignored for create
                    branch: 'main'
                })
            });
            console.log(`Successfully ${fileSha ? 'updated' : 'created'} workflow file: ${workflowFileName}`);
            await new Promise(resolve => setTimeout(resolve, 1000)); // Delay after push
            return true;
        } catch (error) {
             console.error(`Error checking/pushing workflow file ${workflowFileName}:`, error);
             throw error; // Let BuildWorkflowManager handle user notification
        }
    }

    async checkAndPushProjectFiles(projectFiles) {
        if (!projectFiles || projectFiles.length === 0) {
            throw new Error('No project files provided to push.');
        }
        console.log(`Preparing to push ${projectFiles.length} project files...`);
        try {
            // 1. Get Reference to main branch
            const refData = await this._fetchGitHubAPI('git/refs/heads/main');
            const latestCommitSha = refData.object.sha;
            console.log(`Latest commit SHA: ${latestCommitSha}`);

            // 2. Get the Tree of the latest commit
            const commitData = await this._fetchGitHubAPI(`git/commits/${latestCommitSha}`);
            const baseTreeSha = commitData.tree.sha;
            console.log(`Base tree SHA: ${baseTreeSha}`);

            // 3. Create Tree Items (Blobs)
            const treeItems = projectFiles.map(file => ({
                path: file.path,
                mode: '100644', // File mode
                type: 'blob',
                content: file.encoding === 'base64' ? file.content : btoa(unescape(encodeURIComponent(file.content))) // Ensure proper encoding for non-ASCII
            }));

            // 4. Create a new Tree
            const newTreeData = await this._fetchGitHubAPI('git/trees', {
                method: 'POST',
                body: JSON.stringify({
                    base_tree: baseTreeSha, // Use base_tree for efficiency
                    tree: treeItems
                })
            });
            const newTreeSha = newTreeData.sha;
            console.log(`Created new tree SHA: ${newTreeSha}`);

            // 5. Create a new Commit
            const newCommitData = await this._fetchGitHubAPI('git/commits', {
                method: 'POST',
                body: JSON.stringify({
                    message: 'Update project files via ProBuild',
                    tree: newTreeSha,
                    parents: [latestCommitSha]
                })
            });
            const newCommitSha = newCommitData.sha;
            console.log(`Created new commit SHA: ${newCommitSha}`);

            // 6. Update the Reference (fast-forward main branch)
            await this._fetchGitHubAPI('git/refs/heads/main', {
                method: 'PATCH',
                body: JSON.stringify({
                    sha: newCommitSha,
                    force: false // Set to true only if absolutely necessary
                })
            });
            console.log('Successfully pushed project files by updating main branch reference.');
            return true;
        } catch (error) {
             console.error('Error pushing project files via Git Data API:', error);
             throw error;
        }
    }

    async triggerWorkflow(workflowFileName) {
        console.log(`Triggering workflow: ${workflowFileName}`);
        try {
            await this._fetchGitHubAPI(`actions/workflows/${workflowFileName}/dispatches`, {
                method: 'POST',
                body: JSON.stringify({ ref: 'main', inputs: {} })
            });
            console.log(`Workflow ${workflowFileName} triggered successfully.`);
             await new Promise(resolve => setTimeout(resolve, 2000)); // Delay after trigger
            return true;
        } catch (error) {
            console.error(`Error triggering workflow ${workflowFileName}:`, error);
            throw error;
        }
    }
    
    async findLatestWorkflowRun(workflowFileName) {
        console.log(`Finding latest run for workflow: ${workflowFileName}`);
        const maxAttempts = 10;
        const delay = 3000; // 3 seconds
        for (let attempt = 1; attempt <= maxAttempts; attempt++) {
            try {
                 // Query specifically for workflow_dispatch events, sorted by creation time
                 // GitHub API sorts descending by created_at by default
                const runsData = await this._fetchGitHubAPI(`actions/workflows/${workflowFileName}/runs?event=workflow_dispatch&per_page=1`); 
                if (runsData && runsData.workflow_runs && runsData.workflow_runs.length > 0) {
                    console.log("Found latest workflow run:", runsData.workflow_runs[0].id);
                    return runsData.workflow_runs[0]; 
                }
            } catch (error) {
                 console.error(`Attempt ${attempt}: Error fetching workflow runs for ${workflowFileName}:`, error);
                 // Don't throw here, allow retries
            }
            if (attempt < maxAttempts) {
                console.log(`Workflow run not found yet, retrying in ${delay / 1000}s...`);
                await new Promise(resolve => setTimeout(resolve, delay));
            }
        }
        throw new Error(`Could not find triggered workflow run for ${workflowFileName} after ${maxAttempts} attempts.`);
    }

    async getWorkflowRunStatus(runId) {
        console.log(`Getting status for run: ${runId}`);
        return this._fetchGitHubAPI(`actions/runs/${runId}`);
    }
    
    async getWorkflowJobs(jobsUrl) {
         // Need to fetch from the absolute URL provided by GitHub
         console.log(`Fetching jobs from: ${jobsUrl}`);
          try {
            const response = await fetch(jobsUrl, {
                 headers: { 
                    'Authorization': `Bearer ${this.token}`,
                    'Accept': 'application/vnd.github.v3+json'
                 }
            });
             if (!response.ok) {
                const errorData = await response.json().catch(() => ({ message: response.statusText }));
                const errorMessage = `GitHub API Error (${response.status}) fetching jobs: ${errorData.message || 'Unknown error'}`;
                console.error(errorMessage, errorData);
                throw new Error(errorMessage);
            }
            return await response.json();
        } catch (error) {
             console.error(`Network or Fetch Error calling GitHub Jobs API: ${error.message}`);
             throw error; // Re-throw original error
        }
    }

    async cancelWorkflowRun(runId) {
        console.log(`Requesting cancellation for run: ${runId}`);
        try {
             await this._fetchGitHubAPI(`actions/runs/${runId}/cancel`, { method: 'POST' });
             console.log(`Cancellation requested for run ${runId}.`);
             return true;
        } catch (error) {
             console.error(`Error cancelling workflow run ${runId}:`, error);
             // Check if it was already cancelled or completed?
             // API might return 409 Conflict if already stopped.
             if (!error.message.includes('409')) {
                throw error; // Re-throw if not a 409
             }
             console.log(`Run ${runId} likely already stopped.`);
             return false; // Indicate it wasn't actively cancelled by this call
        }
    }
    
    async getArtifactDownloadUrl(runId, artifactName) {
        console.log(`Getting download URL for artifact: ${artifactName} from run: ${runId}`);
        try {
             const artifactsData = await this._fetchGitHubAPI(`actions/runs/${runId}/artifacts`);
             if (artifactsData && artifactsData.artifacts && artifactsData.artifacts.length > 0) {
                 const targetArtifact = artifactsData.artifacts.find(artifact => artifact.name === artifactName);
                 if (targetArtifact) {
                     console.log("Found artifact:", targetArtifact.name, "URL:", targetArtifact.archive_download_url);
                     return { name: targetArtifact.name, url: targetArtifact.archive_download_url };
                 }
             }
             console.log(`Artifact '${artifactName}' not found for run ${runId}`);
             return null; // Artifact not found
        } catch (error) {
             console.error(`Error fetching artifacts for run ${runId}:`, error);
             throw error;
        }
    }

    async downloadArtifact(artifactUrl) {
        // Uses the _fetchGitHubRaw helper
        console.log(`Downloading artifact from: ${artifactUrl}`);
        try {
            const response = await this._fetchGitHubRaw(artifactUrl); // Gets raw response
            return await response.blob(); // Return the Blob
        } catch(error) {
             console.error(`Error downloading artifact blob from ${artifactUrl}:`, error);
             throw error;
        }
    }
    
    async rerunWorkflow(runId) {
        console.log(`Requesting re-run for workflow run: ${runId}`);
         try {
             await this._fetchGitHubAPI(`actions/runs/${runId}/rerun`, { method: 'POST' });
             console.log(`Re-run requested successfully for run ${runId}.`);
             return true;
        } catch (error) {
             console.error(`Error re-running workflow run ${runId}:`, error);
             throw error;
        }
    }
}

export default GitHubService; 