const { Builder, By, until } = require('selenium-webdriver');
const chrome = require('selenium-webdriver/chrome');
const ChildProcess = require('child_process');

// ENV constants
const {
  env: {
    SELENIUM_CHROMEDRIVER_LOCATION: chromedriverLocation = '/usr/local/bin/chromedriver',
    SELENIUM_BASEURL: baseUrl = 'http://localhost:8080',
    SELENIUM_USERNAME: username = 'test',
    SELENIUM_PASSWORD: password = '1234', // $2b$10$wZfnw2d6XV4cmIMaN0uwy.vHVhBxvXKafo4cH9LbARt5jaNuJVCw2
  },
} = process;

let chromedriverDaemon;
let driver;

function getUrl(uri = '') {
  return `${baseUrl}${uri}`;
}

function startChromedriverDaemon() {
  function formatLog(output) {
    return output
      .toString()
      .split('\n')
      .map((s) => `chromedriver: ${s}`)
      .join('\n');
  }
  // start chromedriver
  chromedriverDaemon = ChildProcess.spawn(chromedriverLocation);
  chromedriverDaemon.stdout.on('data', (data) => {
    console.log(formatLog(data));
  });
  chromedriverDaemon.stderr.on('data', (data) => {
    console.error(formatLog(data));
  });
  chromedriverDaemon.on('error', (err) => {
    console.error('chromedriver: Failed to start.', err);
  });
  return chromedriverDaemon;
}

async function killChromedriverDaemon(daemon) {
  // wait until chromedriver daemon closes or it won't receive the SIGTERM
  if (!(daemon instanceof ChildProcess.ChildProcess)) return;
  await new Promise((resolve) => {
    daemon.on('close', (code) => {
      console.log(`chromedriver: Exited with code ${code}`);
      resolve();
    });
    // TODO: doesn't work
    daemon.kill();
  });
}

beforeAll(async () => {
  // start chromedriver daemon on host
  chromedriverDaemon = startChromedriverDaemon();
  // initialize chromedriver client
  chrome.setDefaultService(
    new chrome.ServiceBuilder(chromedriverLocation).build()
  );
  // wire up chrome client to Selenium webdriver
  driver = await new Builder().forBrowser('chrome').build();
});

afterAll(async () => {
  // kill chromedriver daemon
  await killChromedriverDaemon(chromedriverDaemon);

  if (!(driver instanceof chrome.Driver)) return;
  // close the browser window
  driver.close();
});

describe('filbert - My First Selenium Test... with Jest', () => {
  test("user gets 'homepage' when visiting /", async (done) => {
    await driver.get(getUrl());
    const url = await driver.getCurrentUrl();
    expect(url.includes('homepage')).toBeTruthy();
    done();
  });
  test('user can login with Admin credentials', async (done) => {
    await driver.get(getUrl('/signin-admin'));
    await driver.findElement(By.name('username')).sendKeys(username);
    await driver.findElement(By.name('password')).sendKeys(password);
    await driver.findElement(By.css('[type="submit"]')).click();
    await driver.wait(until.urlContains('private'));
    const url = await driver.getCurrentUrl();
    expect(url.includes('private')).toBeTruthy();
    done();
  });
});
