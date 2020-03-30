const { Builder, By, until, WebDriver } = require('selenium-webdriver');
const chrome = require('selenium-webdriver/chrome');

// ENV constants
let {
  env: {
    SELENIUM_CHROMEDRIVER_LOCATION: chromedriverLocation = '/usr/local/bin/chromedriver',
    SELENIUM_BASEURL: baseUrl = 'http://localhost:8080',
    SELENIUM_USERNAME: username = 'test',
    SELENIUM_PASSWORD: password = '1234', // $2b$10$wZfnw2d6XV4cmIMaN0uwy.vHVhBxvXKafo4cH9LbARt5jaNuJVCw2
  },
} = process;

const dummyDriver = new WebDriver();

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

async function sendKeysOneAtATime(string, elem) {
  const letters = string.split('');
  while (letters.length > 1) {
    await elem.sendKeys(letters.shift());
    await dummyDriver.sleep(150);
  }
  return elem.sendKeys(letters.shift());
}

module.exports = {
  getEnv,
  getChromedriverClient,
  cleanupClient,
  getUrl,
  ensureSignedIn,
  ensureSignedOut,
  sendKeysOneAtATime,
};
