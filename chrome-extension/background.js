//Icon hover text
const TITLE_APPLY = "Enable Darkmode";
const TITLE_REMOVE = "Disable Darkmode";

//CSS location
const CSS_DARKMODE = "css/lambda-dark.css";

//Global var for managing extension state across tabs and pages.
let isEnabled = false;
let lambdaTabs = [];


function saveState(state) {
  chrome.storage.local.set({
    'isEnabled': state
  });
}

//Loads the 'isEnabled' property from browser extension storage
function loadState() {
  chrome.storage.local.get('isEnabled', data => {
    isEnabled = data.isEnabled;
  });
}

//Toggle CSS based on extension 'isEnabled' boolean.
function toggleCSS(tab) {
  if (isEnabled) {
    // lambdaTabs.forEach(tab => {
    //   disableCSS(tab);
    //   chrome.tabs.reload(tab);
    //   console.log(`tab ${tab} disabled darkmode.`);
    // });
    disableCSS(tab.id);
    console.log(`tab ${tab.id} disabled darkmode.`);
    chrome.tabs.reload(tab.id);
  } else {
    // lambdaTabs.forEach(tab => {
    //   enableCSS(tab);
    //   console.log(`tab ${tab} enabled darkmode.`);
    // });
    enableCSS(tab.id);
    console.log(`tab ${tab.id} enabled darkmode.`);
  }

  //Update extension state
  saveState(isEnabled);
}

//Inserts darkmode CSS, updates 'isEnabled' state.
function enableCSS(tabId) {
  chrome.pageAction.setIcon({ 'tabId': tabId, 'path': "icons/on.png" });
  chrome.pageAction.setTitle({ 'tabId': tabId, 'title': TITLE_REMOVE });
  chrome.tabs.insertCSS({ file: CSS_DARKMODE });
  isEnabled = true;
}

//Removes darkmode CSS, updates 'isEnabled' state.
function disableCSS(tabId) {
  chrome.pageAction.setIcon({ 'tabId': tabId, 'path': "icons/off.png" });
  chrome.pageAction.setTitle({ 'tabId': tabId, 'title': TITLE_APPLY });
  isEnabled = false;
}

/*
Initialize page action by setting icon and title, then call pageAction.show.
*/
function initializePageAction(tabId) {
  //Set or remove CSS based on state.
  if (isEnabled) {
    enableCSS(tabId);
  } else {
    disableCSS(tabId);
  }

  //Show page action icon.
  chrome.pageAction.show(tabId);
}

chrome.tabs.onCreated.addListener(tab => {
  if (tab.url.search("learn.lambdaschool.com") !== -1) {
    if (!lambdaTabs.includes(tab.id)) {
      lambdaTabs.push(tab.id);
      console.log(`New tab added to tracker: (tab) ${tab.id}.`);
    }
    //Get ext state first.
    loadState();
    initializePageAction(tab.id);
  }
})

chrome.tabs.onUpdated.addListener((id, changeInfo, tab) => {
  if (lambdaTabs.includes(tab.id)) {
    loadState();
    console.log(`Tracked tab update event: (tab) ${tab.id}.`);
    initializePageAction(tab.id);
  } else if (tab.url.search("learn.lambdaschool.com") !== -1) {
    loadState();
    console.log(`Existing tab navigated to tracked site: (tab) ${tab.id}.`);
    initializePageAction(tab.id);
  }
});

chrome.tabs.onHighlighted.addListener(highlightInfo => {
  // loadState();
  // let tabIds = highlightInfo.tabIds;
  // if (lambdaTabs.includes(tabIds[0])) {
  //   initializePageAction(tabIds[0]);
  // }
});

chrome.tabs.onRemoved.addListener((tabId, removeInfo) => {
  if (lambdaTabs.includes(tabId)) {
    let removedTab = lambdaTabs.splice(lambdaTabs.indexOf(tabId), 1);
    console.log(`Untrack closed tab ID ${tabId} (removed: ${removedTab})`);
  }
})

//Find tabs with matching url string.
chrome.tabs.query({ url: "*://learn.lambdaschool.com/*" }, tabs => {
  for (let tab of tabs) {
    if (!lambdaTabs.includes(tab.id)) {
      lambdaTabs.push(tab.id);
      console.log(`Existing tab added to tracker: (tab) ${tab.id}.`);
      initializePageAction(tab.id);
    }
  }
});

chrome.pageAction.onClicked.addListener(toggleCSS);