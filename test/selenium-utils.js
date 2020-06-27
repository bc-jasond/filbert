const { Builder, By, until, WebDriver } = require('selenium-webdriver');
const chrome = require('selenium-webdriver/chrome');

// ENV constants
let {
  env: {
    SELENIUM_CHROMEDRIVER_LOCATION: chromedriverLocation = '/usr/local/bin/chromedriver',
    SELENIUM_BASEURL: baseUrl = 'http://localhost:8080',
    SELENIUM_USERNAME: username = 'test',
    // $2b$10$wZfnw2d6XV4cmIMaN0uwy.vHVhBxvXKafo4cH9LbARt5jaNuJVCw2
    SELENIUM_PASSWORD: password = '1234',
  },
} = process;

function getEnv() {
  return {
    chromedriverLocation,
    baseUrl,
    username,
    password,
  };
}

function getChromedriverClient() {
  // initialize chromedriver client
  chrome.setDefaultService(
    new chrome.ServiceBuilder(chromedriverLocation).build()
  );
  // wire up chrome client to Selenium webdriver
  return new Builder().forBrowser('chrome').build();
}

function cleanupClient(driver) {
  if (!(driver instanceof chrome.Driver)) {
    return;
  }
  // close the browser window
  driver.close();
}

function getUrl(uri = '') {
  return `${baseUrl}${uri}`;
}

async function ensureSignedIn(driver) {
  // check header for Signed in user name
  await driver.get(getUrl('/'));
  let loggedInUserLink = await driver.wait(
    until.elementLocated(By.id('signed-in-user')),
    10000
  );
  const linkText = await loggedInUserLink.getText();
  if (linkText === username) {
    // already logged in
    return;
  }
  // log the user in
  await driver.get(getUrl('/signin-admin'));
  await driver.findElement(By.name('username')).sendKeys(username);
  await driver.findElement(By.name('password')).sendKeys(password);
  await driver.findElement(By.css('[type="submit"]')).click();
  return driver.wait(until.elementLocated(By.id('signed-in-user')), 10000);
}

function ensureSignedOut() {
  return driver.get(getUrl('/signout'));
}

async function selectRangeOfText(
  driver,
  actions,
  element,
  startOffset,
  endOffset
) {
  const elementText = await element.getText();
  const selectionText = elementText.slice(startOffset, endOffset);
  const startOffsetText = elementText.slice(0, startOffset);
  const getTextWidth = () => {
    const [text, font] = arguments;
    const canvas = document.createElement('canvas');
    const context = canvas.getContext('2d');
    context.font = font;
    const metrics = context.measureText(text);
    return Math.floor(metrics.width);
  };

  const fontCssValue = await element.getCssValue('font');

  // for selection width - get length of selected text
  const selectionWidth = await driver.executeScript(
    getTextWidth,
    selectionText,
    fontCssValue
  );
  // for starting X coord - get length of text to the left of selected text
  const selectionStartOffset = await driver.executeScript(
    getTextWidth,
    startOffsetText,
    fontCssValue
  );

  const offset = await element.getRect();
  const x = await parseInt(await offset.x, 10);
  // need to move the y axis down or it will act as if selecting the whole line on a vertical selection
  const y = await parseInt((await offset.y) + (await offset.height) / 2, 10);
  await actions
    .move({
      x: x + selectionStartOffset,
      y,
    })
    .press()
    .move({
      x: x + selectionStartOffset + selectionWidth,
      y,
    })
    .release()
    .perform();
}

module.exports = {
  getEnv,
  getChromedriverClient,
  cleanupClient,
  getUrl,
  ensureSignedIn,
  ensureSignedOut,
  selectRangeOfText,
};
