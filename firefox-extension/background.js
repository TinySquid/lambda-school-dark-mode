//pageAction icon state
const ICON_ON = "icons/lambda-48.png";
const ICON_OFF = "icons/lambda-48-off.png";

//pageAction hover text
const TITLE_APPLY = "Lambda School Darkmode (off)";
const TITLE_REMOVE = "Lambda School Darkmode (on)";

//CSS location
const CSS_DARK_MODE = "css/lambda-dark.css";

//Global var for managing extension state across tabs and pages.
let isEnabled = false;

/*
  A Singleton Pattern restricts the instantiation of a class to one "single" instance.
  In JS, const will prevent changing the state, and making it a closure inside of an IIFE means it can never be re-defined or instantiated again.
*/
const state = (function () {
  let iState = false;

  return {
    save(newState) {
      browser.storage.local.set({
        'isEnabled': newState
      });
      iState = newState;
    },

    load() {
      //Firefox storage API returns a promise
      let storage = browser.storage.local.get('isEnabled');
      storage.then(data => {
        iState = data.isEnabled;
      })

    },

    get() {
      return iState;
    }
  }
}());

//Toggle CSS based on extension 'isEnabled' boolean.
function toggleCSS(tab) {
  if (isEnabled) {
    disableCSS(tab);
  } else {
    enableCSS(tab);
  }
  //Update extension state
  state.save(isEnabled);
}

//Inserts darkmode CSS, updates 'isEnabled' state.
function enableCSS(tab) {
  browser.pageAction.setIcon({ tabId: tab.id, path: ICON_ON });
  browser.pageAction.setTitle({ tabId: tab.id, title: TITLE_REMOVE });
  browser.tabs.insertCSS({ file: CSS_DARKMODE });
  isEnabled = true;
}

//Removes darkmode CSS, updates 'isEnabled' state.
function disableCSS(tab) {
  browser.pageAction.setIcon({ tabId: tab.id, path: ICON_OFF });
  browser.pageAction.setTitle({ tabId: tab.id, title: TITLE_APPLY });
  browser.tabs.removeCSS({ file: CSS_DARKMODE });
  isEnabled = false;
}

/*
Initialize page action by setting icon and title, then call pageAction.show.
*/
function initializePageAction(tab) {
  //Get ext state first.
  state.load();

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
