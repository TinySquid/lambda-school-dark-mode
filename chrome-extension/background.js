//pageAction icon state
const ICON_ON = "icons/lambda-48.png";
const ICON_OFF = "icons/lambda-48-off.png";

//pageAction hover text
const TITLE_APPLY = "Lambda School Darkmode (off)";
const TITLE_REMOVE = "Lambda School Darkmode (on)";

//CSS location
const CSS_DARK_MODE = "css/lambda-dark.css";

//Singleton for extension state (enabled/disabled)
/*
  A Singleton Pattern restricts the instantiation of a class to one "single" instance.
  In JS, const will prevent changing the state, and making it a closure inside of an IIFE means it can never be re-defined or instantiated again.
*/
const state = (function () {
  let iState = false;

  return {
    save(newState) {
      chrome.storage.local.set({
        'isEnabled': newState
      });
      iState = newState;
    },

    load() {
      chrome.storage.local.get('isEnabled', data => {
        iState = data.isEnabled;
      });
    },

    get() {
      return iState;
    }
  }
}());

//Maintains list of open Lambda School tabs.
let tabTracker = [];

//Get state from browser storage.
state.load();

//Find tabs with matching url string.
chrome.tabs.query({ url: "*://learn.lambdaschool.com/*" }, tabs => {
  for (let tab of tabs) {

    //Add UNIQUE tabs to tabTracker.
    if (tabTracker.findIndex(({ id }) => id === tab.id) === -1) {
      tabTracker.push({ id: tab.id, state: state.get() });

      //Enable dark mode on state bool value.
      if (state.get()) {
        enableCSS(tab.id);
      }

      //Enable page action for tracked tab.
      showPageAction(tab.id);
    }
  }
});

/**
 * 
 * @param {object} tab - Toggles our CSS for the tab in which the extension icon was clicked. 
 */
function toggleCSS(tab) {
  if (state.get()) {
    disableCSS(tab.id);
  } else {
    enableCSS(tab.id);
  }
}

/**
 * 
 * @param {integer} tabId - Inserts the dark mode style sheet. 
 */
function enableCSS(tabId) {
  //Change extension icon and title in toolbar.
  chrome.pageAction.setIcon({ 'tabId': tabId, 'path': ICON_ON });
  chrome.pageAction.setTitle({ 'tabId': tabId, 'title': TITLE_REMOVE });

  //Insert our dark mode style sheet.
  chrome.tabs.insertCSS({ file: CSS_DARK_MODE });

  //Enable page action for tracked tab.
  showPageAction(tabId);

  //Extension was enabled for a tab, so enable for all tabs.
  state.save(true);

  //Update tracked tab state property.
  let tabIdx = tabTracker.findIndex(({ id }) => id === tabId);
  tabTracker[tabIdx].state = state.get();
}

/**
 * 
 * @param {integer} tabId - Removes dark mode style sheet. 
 */
function disableCSS(tabId) {
  //Change extension icon and title in toolbar.
  chrome.pageAction.setIcon({ 'tabId': tabId, 'path': ICON_OFF });
  chrome.pageAction.setTitle({ 'tabId': tabId, 'title': TITLE_APPLY });

  //Extension was disabled for a tab, so disable for all tabs.
  state.save(false);

  //Update tracked tab state property.
  let tabIdx = tabTracker.findIndex(({ id }) => id === tabId);
  tabTracker[tabIdx].state = state.get();

  //Because Chrome doesn't have a .removeCSS method, we will just reload the tab to trigger the onUpdated listener.
  chrome.tabs.reload(tabId);

  //Enable page action for tracked tab.
  showPageAction(tabId);
}

/**
 * 
 * @param {integer} tabId - Adds extension icon to the toolbar.
 */
function showPageAction(tabId) {
  chrome.pageAction.show(tabId);
}

//Attach listener to tab creation event.
//Add tab to tracker if it's url matches the search string.
//Insert dark mode style sheet if extension is active.
chrome.tabs.onCreated.addListener(tab => {
  if (tab.url.search("learn.lambdaschool.com") !== -1) {
    state.load();
    if (tabTracker.findIndex(({ id }) => id === tab.id) === -1) {
      tabTracker.push({ id: tab.id, state: state.get() });
    }
    if (state.get()) {
      enableCSS(tab.id);
    }
  }
});


//Attach listener to tab update event.
//Add tab to tracker if user navigated to learn.lambdaschoo.com.
//Insert dark mode style sheet if extension is active.
chrome.tabs.onUpdated.addListener((id, changeInfo, tab) => {
  if (tab.url.search("learn.lambdaschool.com") !== -1) {
    state.load();
    if (tabTracker.findIndex(({ id }) => id === tab.id) === -1) {
      tabTracker.push({ id: tab.id, state: state.get() });
    }

    if (state.get()) {
      enableCSS(tab.id);
    }

    showPageAction(tab.id);
  }
});

//Attach listener to active tab event.
//Insert/remove dark mode style sheet if needed.
chrome.tabs.onHighlighted.addListener(highlightInfo => {
  let tabId = highlightInfo.tabIds[0];
  let tabIdx = tabTracker.findIndex(({ id }) => id === tabId);

  state.load();

  if (tabIdx >= 0) {
    if (state.get() && tabTracker[tabIdx].state) {
      enableCSS(tabId);
    } else if (state.get() === true && tabTracker[tabIdx].state === false) {
      enableCSS(tabId);
    } else if (state.get() === false && tabTracker[tabIdx].state === true) {
      disableCSS(tabId);
    } else {
      //Do nothing.
    }
  }
});

//Remove a previously tracked tab that has just been closed.
chrome.tabs.onRemoved.addListener((tabId, removeInfo) => {
  tabTracker = tabTracker.filter(tab => tab.id !== tabId);
});

//Callback for when the pageAction (extension icon in toolbar) is clicked.
chrome.pageAction.onClicked.addListener(toggleCSS);