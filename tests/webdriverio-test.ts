import { Accessibility } from '../src/models/accessibility';
import { Browser, remote } from 'webdriverio';

async function main() {
    const browser: Browser = await remote({
        capabilities: {
            browserName: 'chrome'
        },
        logLevel: 'error'
    });

    const accessibility = new Accessibility(browser);

    await browser.navigateTo('https://applitest.co.il');
    console.log(await browser.getTitle());

    const axTreeBeforeClick = await accessibility.getAxTree('aria/What kind of applications is it for?');
    console.log(`Before click: \n${JSON.stringify(axTreeBeforeClick, null, 2)}`);

    let item = await browser.$('aria/What kind of applications is it for?');
    await item.click();

    console.log(`Selector: ${item.selector}`);

    const axTree = await accessibility.getAxTree('aria/What kind of applications is it for?');
    console.log(`After click: \n${JSON.stringify(axTree, null, 2)}`);
    let axPropValue = await accessibility.getAxProperty('aria/What kind of applications is it for?', 'expanded');
    console.log(`Expanded property value: ${axPropValue}`);
    axPropValue = await accessibility.getAxProperty('aria/What kind of applications is it for?', 'focused', true);
    console.log(`Focused property value: ${axPropValue}`);

    item = await browser.$('aria/How much does it cost?');
    await item.click();
    axPropValue = await accessibility.getAxProperty('aria/What kind of applications is it for?', 'expanded');
    console.log(`Expanded property value after clicking another item: ${axPropValue}`);
    axPropValue = await accessibility.getAxProperty('aria/What kind of applications is it for?', 'focused', true);
    console.log(`Focused property value after clicking another item: ${axPropValue}`);

    const axTreeAfterSecondClick = await accessibility.getAxTree('aria/What kind of applications is it for?');
    console.log(`After second click: \n${JSON.stringify(axTreeAfterSecondClick, null, 2)}`);

    await browser.deleteSession();
}

main();
