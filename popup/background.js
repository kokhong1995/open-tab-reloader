// Initializes an array for holding timeout requests. 
var requests = [];

/**
 * Cancels the timeout request if the tab was closed. 
 * @param {number} error 
 */
function onError(error) {
    // console.log(error);      // For debugging only.
    let tabId = String(error).replace(/[^0-9]/g, '');

    clearTimeout(requests[tabId]);
}

/**
 * Calls setTimeout function for reloading the tab. 
 * @param {number} tabId 
 * @param {number} interval 
 * @param {number} isBypassCacheEnabled 
 */
function onSuccess(tabId, interval, isBypassCacheEnabled) {
    requests[tabId] = setTimeout(
        function () { reloadTab(tabId, interval, isBypassCacheEnabled) }, interval);
}

/**
 * Reloads a specific tab based on the user's preferences. 
 * @param {number} tabId 
 * @param {number} interval 
 * @param {number} isBypassCacheEnabled 
 */
function reloadTab(tabId, interval, isBypassCacheEnabled) {
    if (isBypassCacheEnabled == 1) {
        browser.tabs
            .reload(tabId, { bypassCache: true })
            .then(onSuccess(tabId, interval, isBypassCacheEnabled), onError);
    }
    else {
        browser.tabs
            .reload(tabId)
            .then(onSuccess(tabId, interval, isBypassCacheEnabled), onError);
    }
}

/**
 * Receives tab details, start/stop reloading the tab then. 
 * Finally, notifies main.js to update GUI. 
 * @param {object} tab 
 * @param {*} sender 
 * @param {*} sendResponse 
 */
function listener(tab, sender, sendResponse) {
    if (tab.action == 1) {
        // Converts time-interval to milliseconds. 
        let daysInSeconds = parseInt(tab.days) * 24 * 60 * 60;
        let hoursInSeconds = parseInt(tab.hours) * 60 * 60;
        let minutesInSeconds = parseInt(tab.minutes) * 60;
        let seconds = parseInt(tab.seconds);
        let milliseconds = (daysInSeconds + hoursInSeconds + minutesInSeconds + seconds) * 1000;

        reloadTab(tab.id, milliseconds, tab.isBypassCacheEnabled);
    }
    else {
        clearTimeout(requests[tab.id]);
    }

    sendResponse({ "action": tab.action });
}

browser.runtime.onMessage.addListener(listener);
