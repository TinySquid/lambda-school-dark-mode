//Icon hover text
const TITLE_APPLY = "Enable Darkmode";
const TITLE_REMOVE = "Disable Darkmode";

//CSS location
const CSS_DARKMODE = "css/lambda-dark.css";

//Global var for managing extension state across tabs and pages.
let isEnabled = false;

//Saves the state into browser storage.
function saveState(state) {
  browser.storage.local.set({
    'isEnabled': state
  });
}

//Loads the 'isEnabled' property from browser extension storage
function loadState() {
  let storage = browser.storage.local.get('isEnabled');
  storage.then((data) => {
    isEnabled = data.isEnabled;
  })
}

//Toggle CSS based on extension 'isEnabled' boolean.
function toggleCSS(tab) {
  if (isEnabled) {
    disableCSS(tab);
  } else {
    enableCSS(tab);
  }
  //Update extension state
  saveState(isEnabled);
}

//Inserts darkmode CSS, updates 'isEnabled' state.
function enableCSS(tab) {
  browser.pageAction.setIcon({ tabId: tab.id, path: "icons/on.svg" });
  browser.pageAction.setTitle({ tabId: tab.id, title: TITLE_REMOVE });
  browser.tabs.insertCSS({ file: CSS_DARKMODE });
  isEnabled = true;
}

//Removes darkmode CSS, updates 'isEnabled' state.
function disableCSS(tab) {
  browser.pageAction.setIcon({ tabId: tab.id, path: "icons/off.svg" });
  browser.pageAction.setTitle({ tabId: tab.id, title: TITLE_APPLY });
  browser.tabs.removeCSS({ file: CSS_DARKMODE });
  isEnabled = false;
}

/*
Initialize page action by setting icon and title, then call pageAction.show.
*/
function initializePageAction(tab) {
  //Get ext state first.
  loadState();

  //Set or remove CSS based on state.
  if (isEnabled) {
    enableCSS(tab);
  } else {
    disableCSS(tab);
  }

  //Show page action icon.
  browser.pageAction.show(tab.id);
}

/*
When first loaded, initialize the page action for all tabs matching our url query.
*/
var matchingTabs = browser.tabs.query({ url: "*://learn.lambdaschool.com/*" });
matchingTabs.then((tabs) => {
  for (let tab of tabs) {
    initializePageAction(tab);
  }
});

/*
Each time a tab is updated, reset the page action for that tab only if it's url still matches learn.lambdaschool.com.
*/
browser.tabs.onUpdated.addListener((id, changeInfo, tab) => {
  if (tab.url.search("learn.lambdaschool.com") !== -1) {
    initializePageAction(tab);
  }
});

//Toggle CSS when the page action is clicked.
browser.pageAction.onClicked.addListener(toggleCSS);
