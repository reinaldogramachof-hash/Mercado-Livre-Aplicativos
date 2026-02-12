$files = Get-ChildItem -Path "_matriz\*\index.html"
foreach ($file in $files) {
    $content = Get-Content $file.FullName
    $newContent = $content | Where-Object { 
        $_ -notmatch 'plena-lock.js' -and 
        $_ -notmatch 'plena_demo.js' -and 
        $_ -notmatch 'plena-toolbar.js'
    }
    
    if ($content.Count -ne $newContent.Count) {
        $newContent | Set-Content $file.FullName
        Write-Host "Cleaned: $($file.FullName)"
    }
}
