const fs = require('fs');
const { exec } = require('child_process');

const WATCH_DIR = __dirname;
const DEBOUNCE_MS = 5000; // Wait 5 seconds after the last change before pushing
let timeoutId = null;

console.log(`👀 Watching ${WATCH_DIR} for changes...`);

function runGitSync() {
  console.log('🔄 Change detected. Preparing auto-push to GitHub...');
  
  exec('git add .', (err) => {
    if (err) {
      console.error('❌ Git add failed:', err);
      return;
    }
    
    const timestamp = new Date().toLocaleString();
    const commitMsg = `auto-update: ${timestamp}`;
    
    // Check if there are actual modifications to commit
    exec('git diff --cached --quiet', (exitCode) => {
      // If exitCode is null/0, it means no staged changes
      if (exitCode === null || exitCode === 0) {
        console.log('ℹ️ No staged changes to commit.');
        return;
      }
      
      exec(`git commit -m "${commitMsg}"`, (err, stdout) => {
        if (err) {
          console.error('❌ Git commit failed:', err);
          return;
        }
        console.log(`💾 Committed changes locally: "${commitMsg}"`);
        
        exec('git push', (err) => {
          if (err) {
            console.error('❌ Git push failed:', err);
            return;
          }
          console.log('🚀 Successfully pushed to GitHub! Website will update automatically via GitHub Actions.');
        });
      });
    });
  });
}

function handleChange(eventType, filename) {
  if (!filename) return;
  
  // Ignore node_modules, .git, stats.json, auto-sync.js, and package-lock.json
  if (filename.includes('node_modules') || 
      filename.includes('.git') || 
      filename.includes('stats.json') || 
      filename.includes('auto-sync.js') ||
      filename.includes('package-lock.json')) {
    return;
  }
  
  console.log(`📝 File changed: ${filename}`);
  
  if (timeoutId) clearTimeout(timeoutId);
  timeoutId = setTimeout(runGitSync, DEBOUNCE_MS);
}

// Watch recursively (supported natively on Windows)
fs.watch(WATCH_DIR, { recursive: true }, handleChange);
