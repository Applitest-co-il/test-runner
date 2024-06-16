# test-runner

This app allows to run appium tests send as json file in applitest manager format

## Pre-requisites

-   Install NodeJs and NPM - Follow [this link](https://nodejs.org/en)
-   Install Android Studio - Follow [this link](https://developer.android.com/studio)
-   Install Appium - Follow [this link](https://appium.io/docs/en/2.0/quickstart/install/)
-   Install Android driver - Follow all instruction in [this link](https://appium.io/docs/en/2.0/quickstart/uiauto2-driver/)
-   Install Appium Inspector - Follow [this link](https://github.com/appium/appium-inspector/releases)

## Running the app

-   Clone repository on your computer
-   Go to main directory of the project or Open terminal in visual code
-   npm install
-   npm run api
    It will launch necessary window and start the server on port 8282 and be ready to receive instructions from the client (i.e app manger UI)

_Note_: you might need to override the device you launch depending what simulator you have installed on your machine - this can be done by adding running "npm run api [device avd name]" instead of just "npm run api"
