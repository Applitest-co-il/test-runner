Remove-Item -LiteralPath "./dist" -Force -Recurse
New-Item -Path "./" -Name "dist" -ItemType "directory"
New-Item -Path "./dist" -Name "bin" -ItemType "directory"
New-Item -Path "./dist/bin" -Name "src" -ItemType "directory"
New-Item -Path "./dist/bin" -Name "downloads" -ItemType "directory"
New-Item -Path "./dist/bin" -Name "reports" -ItemType "directory"
New-Item -Path "./dist/bin" -Name "apps" -ItemType "directory"
Copy-Item -Path "./downloads/.keep" -Destination "./dist/bin/downloads"
Copy-Item -Path "./reports/.keep" -Destination "./dist/bin/reports" 
Copy-Item -Path "./src/*" -Destination "./dist/bin/src" -Recurse
Copy-Item -Path "./apps/*" -Destination "./dist/bin/apps" -Recurse
Copy-Item -Path "./package*" -Destination "./dist/bin" 
Copy-Item -Path "./LICENSE" -Destination "./dist/bin"
Compress-Archive -Path "./dist/bin/*" -DestinationPath "./dist/test-runner.zip"
