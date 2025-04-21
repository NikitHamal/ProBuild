/**
 * Service to handle all GitHub API interactions
 */
class GitHubService {
    constructor(config = null) {
        if (config && config.token) {
            this.accessToken = config.token;
            // Store owner and repo if provided
            this.owner = config.owner || null;
            this.repo = config.repo || null;
        } else {
            this.accessToken = localStorage.getItem('github_token') || localStorage.getItem('githubToken');
            this.owner = localStorage.getItem('githubOwner');
            this.repo = localStorage.getItem('githubRepo');
        }
        
        this.username = localStorage.getItem('github_username');
        this.baseApiUrl = 'https://api.github.com';
    }

    // Singleton pattern
    static getInstance() {
        if (!GitHubService.instance) {
            GitHubService.instance = new GitHubService();
        }
        return GitHubService.instance;
    }

    getUsername() {
        return this.username;
    }

    /**
     * Makes a fetch request to GitHub API
     */
    async _fetchGitHubAPI(endpoint, method = 'GET', body = null, additionalHeaders = {}) {
        try {
            const headers = {
                'Authorization': `token ${this.accessToken}`,
                'Accept': 'application/vnd.github.v3+json',
                ...additionalHeaders
            };

            if (body && method !== 'GET' && !headers['Content-Type']) {
                headers['Content-Type'] = 'application/json';
            }

            const options = {
                method,
                headers,
                body: body ? JSON.stringify(body) : null
            };

            const response = await fetch(`${this.baseApiUrl}${endpoint}`, options);
            
            if (!response.ok) {
                const errorData = await response.json().catch(() => ({}));
                throw new Error(`GitHub API Error (${response.status}): ${errorData.message || response.statusText} for ${method} ${endpoint}`);
            }
            
            // Some endpoints return 204 No Content
            if (response.status === 204) {
                return {};
            }
            
            return await response.json();
        } catch (error) {
            console.error('Network or Fetch Error calling GitHub API:', error);
            throw error;
        }
    }
    
    /**
     * Checks if a file exists in a repository
     */
    async checkFileExists(owner, repo, path) {
        try {
            await this._fetchGitHubAPI(`/repos/${owner}/${repo}/contents/${path}`);
            return true;
        } catch (error) {
            if (error.message.includes('404')) {
                return false;
            }
            throw error;
        }
    }

    /**
     * Creates or updates a workflow file in the .github/workflows directory
     */
    async createWorkflowFile(owner, repo, filename, content) {
        const path = `.github/workflows/${filename}`;
        
        try {
            console.log(`Creating workflow file: ${filename}`);
            
            // First ensure the workflows directory exists
            await this._ensureDirectoryExists(owner, repo, '.github/workflows');
            
            // Then create the file
            return await this._createOrUpdateFile(
                owner, 
                repo, 
                path, 
                content, 
                `Add GitHub Actions workflow ${filename}`
            );
        } catch (error) {
            console.error(`Error creating workflow file ${filename}:`, error);
            throw error;
        }
    }
    
    /**
     * Updates an existing workflow file
     */
    async updateWorkflowFile(owner, repo, filename, content) {
        const path = `.github/workflows/${filename}`;
        
        try {
            console.log(`Updating existing workflow file: ${filename}`);
            
            // Get the file's SHA (required for updating)
            const fileData = await this._fetchGitHubAPI(`/repos/${owner}/${repo}/contents/${path}`);
            
            return await this._createOrUpdateFile(
                owner, 
                repo, 
                path, 
                content, 
                `Update GitHub Actions workflow ${filename}`,
                fileData.sha
            );
        } catch (error) {
            console.error(`Error updating workflow file ${filename}:`, error);
            // If the file doesn't exist, create it
            if (error.message.includes('404')) {
                return await this.createWorkflowFile(owner, repo, filename, content);
            }
            throw error;
        }
    }
    
    /**
     * Ensures a directory exists in the repository
     */
    async _ensureDirectoryExists(owner, repo, path) {
        try {
            // Try to get the directory
            await this._fetchGitHubAPI(`/repos/${owner}/${repo}/contents/${path}`);
            // Directory exists, nothing to do
            return true;
        } catch (error) {
            // If it's a 404, the directory doesn't exist
            if (error.message.includes('404')) {
                // Split the path to get parent directory
                const parts = path.split('/');
                const newDirName = parts.pop();
                const parentDir = parts.join('/');
                
                // If there's a parent directory, ensure it exists first (recursive)
                if (parentDir) {
                    await this._ensureDirectoryExists(owner, repo, parentDir);
                }
                
                // Create the directory with a placeholder file
                await this._createOrUpdateFile(
                    owner,
                    repo,
                    `${path}/.gitkeep`,
                    '', // Empty file
                    `Create directory: ${path}`
                );
                
                return true;
            }
            
            throw error;
        }
    }
    
    /**
     * Creates or updates a file in the repository
     */
    async _createOrUpdateFile(owner, repo, path, content, message, sha = null) {
        const endpoint = `/repos/${owner}/${repo}/contents/${path}`;
        const method = sha ? 'PUT' : 'POST';
        const body = {
            message,
            content: typeof content === 'string' ? btoa(unescape(encodeURIComponent(content))) : content,
            branch: 'main'
        };
        
        if (sha) {
            body.sha = sha;
        }
        
        return await this._fetchGitHubAPI(endpoint, method, body);
    }
    
    /**
     * Pushes multiple files to a repository in a single commit
     */
    async pushProjectFiles(owner, repo, files) {
        try {
            console.log(`Preparing to push ${files.length} project files...`);
            
            // Get the latest commit SHA
            const masterRef = await this._fetchGitHubAPI(`/repos/${owner}/${repo}/git/refs/heads/main`);
            const latestCommitSha = masterRef.object.sha;
            console.log(`Latest commit SHA: ${latestCommitSha}`);
            
            // Get the tree SHA from the commit
            const latestCommit = await this._fetchGitHubAPI(`/repos/${owner}/${repo}/git/commits/${latestCommitSha}`);
            const baseTreeSha = latestCommit.tree.sha;
            console.log(`Base tree SHA: ${baseTreeSha}`);
            
            // Create a new tree with all the files
            const tree = files.map(file => {
                const item = {
                    path: file.path,
                    mode: '100644', // Regular file
                    type: 'blob'
                };
                
                if (file.encoding === 'base64') {
                    // Already Base64 encoded
                    item.content = file.content;
                } else {
                    // Regular content, needs encoding
                    item.content = file.content;
                }
                
                return item;
            });
            
            const newTree = await this._fetchGitHubAPI(`/repos/${owner}/${repo}/git/trees`, 'POST', {
                base_tree: baseTreeSha,
                tree
            });
            console.log(`Created new tree SHA: ${newTree.sha}`);
            
            // Create a new commit
            const newCommit = await this._fetchGitHubAPI(`/repos/${owner}/${repo}/git/commits`, 'POST', {
                message: 'Update Android project files',
                tree: newTree.sha,
                parents: [latestCommitSha]
            });
            console.log(`Created new commit SHA: ${newCommit.sha}`);
            
            // Update the reference to point to the new commit
            await this._fetchGitHubAPI(`/repos/${owner}/${repo}/git/refs/heads/main`, 'PATCH', {
                sha: newCommit.sha,
                force: true
            });
            console.log('Successfully pushed project files by updating main branch reference.');
            
            return true;
        } catch (error) {
            console.error('Error pushing project files:', error);
            throw error;
        }
    }
    
    /**
     * Checks if a workflow file exists and creates or updates it accordingly
     */
    async checkAndPushWorkflowFile(filename, content) {
        if (!this.accessToken) {
            throw new Error('GitHub access token is not configured');
        }
        
        try {
            if (!this.owner || !this.repo) {
                throw new Error('GitHub repository owner or name is not configured');
            }
            
            console.log(`Checking and pushing workflow file: ${filename}`);
            const path = `.github/workflows/${filename}`;
            
            // Check if the file exists
            const fileExists = await this.checkFileExists(this.owner, this.repo, path);
            
            if (fileExists) {
                // Update existing file
                return await this.updateWorkflowFile(this.owner, this.repo, filename, content);
            } else {
                // Create new file
                return await this.createWorkflowFile(this.owner, this.repo, filename, content);
            }
        } catch (error) {
            console.error(`Error in checkAndPushWorkflowFile for ${filename}:`, error);
            throw error;
        }
    }
    
    /**
     * Checks and pushes project files to the repository
     */
    async checkAndPushProjectFiles(files) {
        if (!this.accessToken) {
            throw new Error('GitHub access token is not configured');
        }
        
        try {
            if (!this.owner || !this.repo) {
                throw new Error('GitHub repository owner or name is not configured');
            }
            
            return await this.pushProjectFiles(this.owner, this.repo, files);
        } catch (error) {
            console.error('Error in checkAndPushProjectFiles:', error);
            throw error;
        }
    }
    
    /**
     * Triggers a workflow dispatch event to run a workflow
     */
    async triggerWorkflow(owner, repo, workflow_id) {
        try {
            console.log(`Triggering workflow: ${workflow_id}`);
            
            await this._fetchGitHubAPI(
                `/repos/${owner}/${repo}/actions/workflows/${workflow_id}/dispatches`,
                'POST',
                { ref: 'main' }
            );
            
            return true;
        } catch (error) {
            console.error(`Error triggering workflow ${workflow_id}:`, error);
            throw error;
        }
    }
    
    /**
     * Finds the latest workflow run after triggering a workflow
     * This method will wait for a new run to appear after triggering
     */
    async findLatestWorkflowRun(owner, repo, workflow_id) {
        console.log(`Finding latest workflow run for ${workflow_id}...`);
        
        // First get the timestamp before we triggered the workflow
        const beforeTime = new Date().toISOString();
        
        // Wait a few seconds to allow the workflow to start
        await new Promise(resolve => setTimeout(resolve, 5000));
        
        // Try to find the new run, with retry logic
        const maxRetries = 10;
        const retryDelay = 3000; // 3 seconds
        
        for (let attempt = 1; attempt <= maxRetries; attempt++) {
            try {
                console.log(`Attempt ${attempt} to find new workflow run...`);
                
                // Get all runs for this workflow
                const runs = await this.getWorkflowRuns(owner, repo, workflow_id);
                
                if (runs && runs.length > 0) {
                    // Look for runs created after we triggered the workflow
                    const newRuns = runs.filter(run => {
                        const runCreatedAt = new Date(run.created_at).toISOString();
                        return runCreatedAt > beforeTime;
                    });
                    
                    if (newRuns.length > 0) {
                        console.log(`Found ${newRuns.length} new workflow run(s), using the most recent one`);
                        return newRuns[0]; // Return the most recent run
                    }
                }
                
                // If we didn't find a new run yet, wait and retry
                if (attempt < maxRetries) {
                    console.log(`No new runs found yet, waiting ${retryDelay/1000} seconds to retry...`);
                    await new Promise(resolve => setTimeout(resolve, retryDelay));
                }
            } catch (error) {
                console.error(`Error finding workflow run (attempt ${attempt}):`, error);
                if (attempt >= maxRetries) {
                    throw error;
                }
                await new Promise(resolve => setTimeout(resolve, retryDelay));
            }
        }
        
        // If we reach here, we couldn't find a new run
        throw new Error(`Could not find a new workflow run for ${workflow_id} after ${maxRetries} attempts`);
    }
    
    /**
     * Gets the workflow runs for a specific workflow
     */
    async getWorkflowRuns(owner, repo, workflow_id) {
        try {
            const result = await this._fetchGitHubAPI(
                `/repos/${owner}/${repo}/actions/workflows/${workflow_id}/runs`
            );
            
            return result.workflow_runs || [];
        } catch (error) {
            console.error(`Error getting workflow runs for ${workflow_id}:`, error);
            throw error;
        }
    }
    
    /**
     * Gets the status of a specific workflow run
     */
    async getWorkflowRunStatus(owner, repo, run_id) {
        try {
            const result = await this._fetchGitHubAPI(
                `/repos/${owner}/${repo}/actions/runs/${run_id}`
            );
            
            return result.status;
        } catch (error) {
            console.error(`Error getting workflow run status for ${run_id}:`, error);
            throw error;
        }
    }
    
    /**
     * Gets the artifacts for a specific workflow run
     */
    async getWorkflowRunArtifacts(owner, repo, run_id) {
        try {
            const result = await this._fetchGitHubAPI(
                `/repos/${owner}/${repo}/actions/runs/${run_id}/artifacts`
            );
            
            return result.artifacts || [];
        } catch (error) {
            console.error(`Error getting workflow run artifacts for ${run_id}:`, error);
            throw error;
        }
    }
    
    /**
     * Downloads an artifact from the given URL
     */
    async downloadArtifact(url) {
        try {
            console.log(`Downloading artifact from URL: ${url}`);
            
            const response = await fetch(url, {
                headers: {
                    'Authorization': `token ${this.accessToken}`,
                    'Accept': 'application/vnd.github.v3+json'
                }
            });
            
            if (!response.ok) {
                throw new Error(`Failed to download artifact: ${response.status} ${response.statusText}`);
            }
            
            return await response.blob();
        } catch (error) {
            console.error('Error downloading artifact:', error);
            throw error;
        }
    }
    
    /**
     * Gets the download URL for a specific artifact
     */
    async getArtifactDownloadUrl(owner, repo, artifact_id) {
        try {
            // GitHub doesn't provide a direct download URL via the API
            // Instead, we construct a URL to the GitHub website
            return `https://github.com/${owner}/${repo}/actions/artifacts/${artifact_id}/zip`;
        } catch (error) {
            console.error(`Error getting artifact download URL for ${artifact_id}:`, error);
            throw error;
        }
    }
}

export default GitHubService; 