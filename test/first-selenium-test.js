const {Builder} = require('selenium-webdriver');
const chrome = require('selenium-webdriver/chrome');
chrome.setDefaultService(new chrome.ServiceBuilder('/usr/local/bin/chromedriver').build());

(async function myFunction() {
  let driver = await new Builder().forBrowser('chrome').build();
  //your code inside this block
  
  await driver.get('https://filbert.xyz');
  const url = await driver.getCurrentUrl();
  console.log("URL is: ", url)
})();