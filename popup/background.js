/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at https://mozilla.org/MPL/2.0/. */

// Initializes an array for holding timeout requests. 
var requests = [];

/**
 * This function will be called if the operation was successful. 
 */
 function onSuccess() {
    // console.log('The operation is successful.');     // For debugging only. 
}

/**
 * This function will be called if the operation was failed. 
 * @param {*} error 
 */
function onError(error) {
    // console.log(error);      // For debugging only.
}

/**
 * Cancels the timeout request and remove saved preferences. 
 * @param {object} item 
 */
function onTabFound(item) {
    if (Object.keys(item).length != 0) {
        // Gets tab ID. 
        let values = Object.values(item);
        let tabId = values[0]['id'];

        clearTimeout(requests[tabId]);
        browser.storage.sync.remove('t' + tabId).then(onSuccess, onError);
    }
}

/**
 * Checks if the saved preferences of the tab exist. 
 * @param {number} tabId 
 * @param {object} removeInfo 
 */
function handleRemoved(tabId, removeInfo) {
    browser.storage.local.get('t' + tabId).then(onTabFound, onError);
}

/**
 * Calls setTimeout function for reloading the tab. 
 * @param {number} tabId 
 * @param {number} interval 
 * @param {number} isBypassCacheEnabled 
 */
function onReloadSuccess(tabId, interval, isBypassCacheEnabled) {
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
            .then(onReloadSuccess(tabId, interval, isBypassCacheEnabled), onError);
    }
    else {
        browser.tabs
            .reload(tabId)
            .then(onReloadSuccess(tabId, interval, isBypassCacheEnabled), onError);
    }
}

/**
 * Receives tab details, start/stop reloading the tab then. 
 * Adds a listener for handling closed tab if the tab reloading task is active. 
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

        browser.tabs.onRemoved.addListener(handleRemoved);
    }
    else {
        clearTimeout(requests[tab.id]);
    }

    sendResponse({ "action": tab.action });
}

browser.runtime.onMessage.addListener(listener);
