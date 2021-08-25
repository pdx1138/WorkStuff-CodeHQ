//==============================================================================
/**
@file       triggerAction.js
@brief      Obskur Remote Control Plugin
@copyright  This source code is licensed under the MIT-style license found in the LICENSE file.
**/
//==============================================================================

// Prototype which represents an action that triggers an event
function TriggerAction(inContext, inSettings) {
    // Init TriggerAction
    var instance = this;

    // Inherit from Action
    Action.call(this, inContext, inSettings);

    // Update the state
    setDefaults();

    // Public function called on key up event
    this.onKeyUp = function(inContext, inSettings, inCoordinates, inUserDesiredState, inState) {

            if(inSettings === undefined) {
                inSettings = instance.getSettings();
            }

            if(!('route' in inSettings)) {
                log('No route configured');
                showAlert(inContext);
                return;
            }

            let body;

            if(!('updatedProps' in inSettings.route)) {
                body = {};
            }
            else {
                body = inSettings.route.updatedProps;
            }

            postAction(body, inSettings['route'].routePath)
                .then(response => {
                    // If response is not OK, then throw error
                    if(!response.ok) {
                        throw new Error('Something wrong with response');
                    }
                })
                .catch(error => {
                    console.error('Problem occurred: ', error);
            });
    };

    function setDefaults() {
        var settings = instance.getSettings();
        var context = instance.getContext();

        if(!('route' in settings)) return;
        
        if(Object.keys(triggerRoutes).length < 1) return;

        saveSettings('com.codehq.obskur.trigger', context, settings);
    }
}