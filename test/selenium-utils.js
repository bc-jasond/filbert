const { Builder } = require('selenium-webdriver');
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

async function ensureSignedIn() {
  // check header for Signed in user name
  const header = await driver.findElement(By.css('header'));
  const loggedInUserLink = await header.findElement(By.id('signed-in-user'));
  const linkText = await loggedInUserLink.getText();
  if (linkText === username) {
    // already logged in
    return;
  }
  // log the user in
  await driver.get(getUrl('/signin-admin'));
  await driver.findElement(By.name('username')).sendKeys(username);
  await driver.findElement(By.name('password')).sendKeys(password);
  return driver.findElement(By.css('[type="submit"]')).click();
}

async function ensureSignedOut() {
  return driver.get(getUrl('/signout'));
}

module.exports = {
  getEnv,
  getChromedriverClient,
  cleanupClient,
  getUrl,
  ensureSignedIn,
  ensureSignedOut,
};
