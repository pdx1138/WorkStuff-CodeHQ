//==============================================================================
/**
@file       statefulAction.js
@brief      Oariant Remote Control Plugin
@copyright  This source code is licensed under the MIT-style license found in the LICENSE file.
**/
//==============================================================================

// Prototype which represents a stateful action that regularly checks the state of a value in Obskur
function StatefulAction(inContext, inSettings) {
    // Init StatefulAction
    var instance = this;

    // Inherit from Action
    Action.call(this, inContext, inSettings);

    // Update the state
    setDefaults();

    // Public function called on key up event
    this.onKeyUp = function(inContext, inSettings, inCoordinates, inUserDesiredState, inState) {

        console.log("Stateful trigger pressed!");

        if(inSettings === undefined) {
            inSettings = instance.getSettings();
        }

        if(!('stateAction' in inSettings)) {
            log('No action configured');
            showAlert(inContext);
            return;
        }

        if(inSettings.stateAction.hasTriggerDelegate) {
            let state = inSettings.stateAction;
            triggerStateAction(state.stateName, state.updatedProps);
        }
    };

    function setDefaults() {
        var settings = instance.getSettings();
        var context = instance.getContext();

        if(!('stateAction' in settings)) return;
        
        if(Object.keys(stateActions).length < 1) return;

        saveSettings('com.codehq.obskur.stateful', context, settings);
    };
}