# Google Cloud Run Deployment Script

# Color Codes
$GREEN = "[32m"
$RED = "[31m"
$RESET = "[0m"

function Print-Success {
    param($message)
    Write-Host "${GREEN}✔ $message${RESET}"
}

function Print-Error {
    param($message)
    Write-Host "${RED}✘ $message${RESET}"
}

# 1. gcloud CLI Check
if (-not (Get-Command gcloud -ErrorAction SilentlyContinue)) {
    Print-Error "gcloud CLI is not installed."
    Write-Host "Please install Google Cloud SDK from:"
    Write-Host "https://cloud.google.com/sdk/docs/install"
    exit 1
}

# 2. Project ID Check
$currentProject = gcloud config get-value project 2> $null
if ($currentProject) {
    Write-Host "Using current Project ID: $currentProject"
    $projectId = $currentProject
}

if (-not $projectId) {
    $projectId = Read-Host "Enter Google Cloud Project ID (e.g., lascon-manager)"
}

if (-not $projectId) {
    Print-Error "Project ID is required."
    exit 1
}

# 3. Project Setup
Write-Host "Setting up project..."
gcloud config set project $projectId

# 4. Service Name Setup
$serviceName = "lasconmanager"
$region = "asia-northeast3" # Seoul Region

# 5. Environment Variables
Write-Host "Checking environment variables..."

# Try reading .env file
if (Test-Path .env) {
    Write-Host "Found .env file. Loading variables..."
    try {
        $lines = Get-Content .env -Encoding UTF8 -ErrorAction Stop
    }
    catch {
        Write-Host "UTF8 read failed, trying default encoding..."
        $lines = Get-Content .env
    }

    foreach ($line in $lines) {
        if ($line -match '^\s*([^#=]+)\s*=\s*(.*)\s*$') {
            $name = $matches[1].Trim()
            $value = $matches[2].Trim()
            # Remove quotes if present
            $value = $value -replace '^["'']|["'']$', ''
            
            # Explicitly set variables we care about
            if ($name -eq "SUPABASE_URL") { $supabaseUrl = $value }
            if ($name -eq "SUPABASE_SERVICE_KEY") { $supabaseKey = $value }
            if ($name -eq "FRONTEND_URL") { $frontendUrl = $value }
            
            # Also set as script variable for generic usage if needed
            Set-Variable -Name $name -Value $value -Scope Script
            Write-Host "Loaded: $name"
        }
    }
}

if (-not $supabaseUrl) { $supabaseUrl = $env:SUPABASE_URL }
if (-not $supabaseKey) { $supabaseKey = $env:SUPABASE_SERVICE_KEY }
if (-not $frontendUrl) { $frontendUrl = $env:FRONTEND_URL }

if (-not $supabaseUrl) { $supabaseUrl = Read-Host "SUPABASE_URL" }
if (-not $supabaseKey) { $supabaseKey = Read-Host "SUPABASE_SERVICE_KEY" }
if (-not $frontendUrl -or $frontendUrl -like "*localhost*") { 
    $frontendUrl = "https://cont-mgmt.vercel.app"
    Write-Host "Setting FRONTEND_URL to production: $frontendUrl"
}

if (-not $supabaseUrl -or -not $supabaseKey) {
    Print-Error "Missing required environment variables."
    exit 1
}

# 6. Deploy
Write-Host "Starting deployment to Google Cloud Run..."
Write-Host "Building and deploying image... (This may take a while)"

# Build env vars string properly
$envVars = "SUPABASE_URL=$supabaseUrl,SUPABASE_SERVICE_KEY=$supabaseKey,FRONTEND_URL=$frontendUrl,NODE_ENV=production"

gcloud run deploy $serviceName `
    --source . `
    --region $region `
    --allow-unauthenticated `
    --quiet `
    --set-env-vars $envVars

if ($?) {
    Print-Success "Deployment complete!"
}
else {
    Print-Error "Deployment failed."
}
