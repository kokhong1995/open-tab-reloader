// Declares a variable for holding the id of current tab.  
var tabId;

/**
 * Returns a JSON object containing days, hours, minutes, and seconds. 
 * @returns {object}
 */
function getInterval() {
    return {
        "days": document.getElementById("days").value,
        "hours": document.getElementById("hours").value,
        "minutes": document.getElementById("minutes").value,
        "seconds": document.getElementById("seconds").value
    };
}

/**
 * Determines whether to bypass the cache when reloading the tab. 
 * 1 represents true, 0 represents false. 
 * @returns {number}
 */
function isBypassCacheEnabled() {
    return document.getElementById('bypass-cache').checked == true ? 1 : 0;
}

/**
 * For debugging. 
 * @param {object} error 
 */
function onError(error) {
    // console.log(`Error@main: ${error}`);
}

/**
 * Updates GUI after receiving the message from background.js. 
 * @param {object} tab 
 */
function onMessageReceived(tab) {
    updateGUI(tab.action);

    /**
     * Closes the popped up window and exit 
     * since the tab reloading task is running in the background. 
     */
    if (document.getElementById("stop").disabled == false) window.close();
}

/**
 * Communicating with the background.js to start or stop reloading the tab. 
 * @param {object} tab
 */
function onPreferencesSaved(tab) {
    browser.runtime.sendMessage(tab).then(onMessageReceived, onError);
}

/**
 * Saves user's preferences and start/stop reloading the tab. 
 * @param {number} action
 * @param {number} interval
 * @param {number} isBypassCacheEnabled
 */
function handleTab(action, interval, isBypassCacheEnabled) {
    // Makes sure that the minimum value of time-interval is 5 seconds!
    if (interval.days < 1 && interval.hours < 1 && interval.minutes < 1 && interval.seconds < 1)
        interval.seconds = 5;

    // User's preferences about the tab. 
    let tab = {
        "action": action,
        "id": tabId,
        "days": interval.days,
        "hours": interval.hours,
        "minutes": interval.minutes,
        "seconds": interval.seconds,
        "isBypassCacheEnabled": isBypassCacheEnabled
    };

    // Saves user's preferences and handle the task. 
    browser.storage.local.set({ ["t" + tabId]: tab }).then(onPreferencesSaved(tab), onError);
}

/**
 * Updates graphical user interface based on the action. 
 * @param {number} action 
 */
function updateGUI(action) {
    // Some components must be disabled after starting tab reloading task. 
    let mustDisabled = action == 1 ? true : false;

    document.getElementById("days").disabled = mustDisabled;
    document.getElementById("hours").disabled = mustDisabled;
    document.getElementById("minutes").disabled = mustDisabled;
    document.getElementById("seconds").disabled = mustDisabled;
    document.getElementById("bypass-cache").disabled = mustDisabled;
    document.getElementById("start").disabled = mustDisabled;
    document.getElementById("stop").disabled = !mustDisabled;
}

/**
 * Restores user's preferences. 
 * @param {object[]} tabs 
 */
function onPreferencesRestored(tabs) {
    if (Object.keys(tabs).length != 0) {
        // Get current tab. 
        let tab = tabs["t" + tabId];

        // Restores user's preferences. 
        document.getElementById("days").value = (tab.days);
        document.getElementById("hours").value = (tab.hours);
        document.getElementById("minutes").value = (tab.minutes);
        document.getElementById("seconds").value = (tab.seconds);
        document.getElementById("bypass-cache").checked = tab.isBypassCacheEnabled;

        updateGUI(tab.action);
    }
}

/**
 * Begins the setup if the query is successfully executed. 
 * @param {object} tabs 
 */
function onSuccess(tabs) {
    for (let tab of tabs) {
        // Gets the id of current tab. 
        tabId = tab.id;

        // Try to restore settings if possible. 
        browser.storage.local.get("t" + tabId).then(onPreferencesRestored, onError);

        // Sets up buttons. 
        document.getElementById('start').addEventListener("click", (e) => {
            handleTab(1, getInterval(), isBypassCacheEnabled());
        });

        document.getElementById('stop').addEventListener("click", (e) => {
            handleTab(0, getInterval(), isBypassCacheEnabled());
        });
    }
}

browser.tabs.query({ currentWindow: true, active: true }).then(onSuccess, onError);
