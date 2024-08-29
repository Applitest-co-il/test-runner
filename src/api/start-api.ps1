param(
    [string]$device = "Pixel_3a_API_34_extension_level_7_x86_64"
)

Start-Process powershell.exe -ArgumentList "appium --relaxed-security"
Start-Process -FilePath "$env:ANDROID_HOME/emulator/emulator.exe" -ArgumentList  "-avd $device" 
Start-Sleep 10
node  --inspect ./src/api/app.js
