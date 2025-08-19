# PowerShell script to resolve merge conflicts by keeping develop branch content
$files = @(
    "pages\clinic-page.html",
    "pages\home.html", 
    "pages\phamarcy-capturing-page.html",
    "pages\processing-page.html"
)

foreach ($file in $files) {
    if (Test-Path $file) {
        Write-Host "Processing $file..."
        $content = Get-Content $file -Raw
        
        # Remove merge conflict markers and keep develop branch content
        $pattern = '(?s)<<<<<<< HEAD.*?=======\s*(.*?)>>>>>>> develop'
        $resolved = [regex]::Replace($content, $pattern, '$1')
        
        # Also handle any remaining HEAD sections that might not have develop counterparts
        $pattern2 = '(?s)<<<<<<< HEAD\s*(.*?)=======.*?>>>>>>> develop'
        $resolved = [regex]::Replace($resolved, $pattern2, '')
        
        # Remove any orphaned conflict markers
        $resolved = $resolved -replace '<<<<<<< HEAD', ''
        $resolved = $resolved -replace '=======', ''
        $resolved = $resolved -replace '>>>>>>> develop', ''
        
        Set-Content $file $resolved -Encoding UTF8
        Write-Host "Resolved conflicts in $file"
    }
}

Write-Host "All merge conflicts resolved!"
