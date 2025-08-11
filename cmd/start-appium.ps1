param(
    [string]$device = "Pixel_Tablet_API_34"
)

Start-Process powershell.exe -ArgumentList "appium --relaxed-security"
Start-Process -FilePath "$env:ANDROID_HOME/emulator/emulator.exe" -ArgumentList  "-avd $device" 
