'use strict'; 
//==============================================================================
/**
@file       main.js
@brief      Obskur Remote Control Plugin
@copyright  This source code is licensed under the MIT-style license found in the LICENSE file.
**/
//==============================================================================

// Global web socket
let websocket = null;

// Global settings
let globalSettings = {};

// Array storing all of the trigger routes
let triggerRoutes = {};

// Array storing all of the stateAction objects
let stateActions = {};

// URL for fetching the Http route
const fetchUrl = "http://127.0.0.1:5050";

// Obskur web socket
let obskurWs = null;

// Obskur port
let obskurPort = 5051;

// Rate of updates to obskur
let updateRate = 1000;

// Setup the websocket and handle communication
function connectElgatoStreamDeckSocket(inPort, inPluginUUID, inRegisterEvent, inInfo) {
    // Create array of currently used actions
    const actions = {};

    // Open the web socket to Stream Deck
    // Use 127.0.0.1 because Windows needs 300ms to resolve localhost
    websocket = new WebSocket('ws://127.0.0.1:' + inPort);

    // Open the web socket to Obskur
    obskurWs = new WebSocket('ws://127.0.0.1:' + obskurPort);

    // Web socket is connected
    websocket.onopen = function() {
        // Register plugin to Stream Deck
        registerPluginOrPI(inRegisterEvent, inPluginUUID);

        // Request the global settings of the plugin
        requestGlobalSettings(inPluginUUID);
    }

    // Web socket received a message
    websocket.onmessage = function(inEvent) {
        // Parse parameter from string to object
        var jsonObj = JSON.parse(inEvent.data);

        // Extract payload information
        var event = jsonObj['event'];
        var action = jsonObj['action'];
        var context = jsonObj['context'];
        var jsonPayload = jsonObj['payload'];
        var settings;

        // Key up event
        if(event === 'keyUp') {
            settings = jsonPayload['settings'];
            var coordinates = jsonPayload['coordinates'];
            var userDesiredState = jsonPayload['userDesiredState'];
            var state = jsonPayload['state'];

            // Send onKeyUp event to actions
            if (context in actions) {
                actions[context].onKeyUp(context, settings, coordinates, userDesiredState, state);
            }
        }
        else if(event === 'willAppear') {
            settings = jsonPayload['settings'];

            // Add current instance is not in actions array
            if (!(context in actions)) {
                // Add current instance to array
                if(action === 'com.codehq.obskur.trigger') {
                    actions[context] = new TriggerAction(context, settings);
                }
                else if(action === 'com.codehq.obskur.stateful') {
                    actions[context] = new StatefulAction(context, settings);
                }
            }
        }
        else if(event === 'willDisappear') {
            // Remove current instance from array
            if (context in actions) {
                delete actions[context];
            }
        }
        else if(event === 'didReceiveGlobalSettings') {
            // Set global settings
            globalSettings = jsonPayload['settings'];
        }
        else if(event === 'didReceiveSettings') {
            settings = jsonPayload['settings'];

            // Set settings
            if (context in actions) {
                actions[context].setSettings(settings);
            }
        }
        else if(event === 'propertyInspectorDidAppear') {
            if(action == 'com.codehq.obskur.trigger') {
                getAction('/api')
                .then(data => {
                    triggerRoutes = updateTriggerRoutes(data.routes);
                    console.log("Routes: " + triggerRoutes);
                    sendToPropertyInspector(action, context, triggerRoutes);
                })
                .catch(error => {
                    console.log('Error: ' + error);

                    triggerRoutes = {};
                    sendToPropertyInspector(action, context, triggerRoutes);
                });
            }
            else if(action === 'com.codehq.obskur.stateful') {
                getAction('/api/stateful')
                .then(data => {
                    // Update state actions
                    stateActions = updateStateActions(stateActions, data.stateActions);

                    console.log("State Actions: " + JSON.stringify(stateActions));

                    sendToPropertyInspector(action, context, stateActions);
                })
                .catch(error => {
                    console.log('Error: ' + error);

                    stateActions = {};

                    sendToPropertyInspector(action, context, stateActions);
                });
            }
        }
        else if(event === 'sendToPlugin') {
            var piEvent = jsonPayload['piEvent'];
            settings = jsonPayload['settings'];

            console.log(settings);

            if (piEvent === 'setSettings') {
                if(context in actions) {
                    actions[context].setSettings(settings);
                    
                    // Send changes to obskur if stateful
                    if(action === 'com.codehq.obskur.stateful') {
                        var state = settings.stateAction;
                        stateActions[state.stateName] = state;

                        if(!('updatedProps' in stateActions[state.stateName])) {
                            stateActions[state.stateName].updatedProps = {};
                        }

                        updateStateAction(state.stateName, 
                             state.updatedProps);
                    }
                }
            }
        }
    };

    // obskur web socket connected to a socket
    obskurWs.onopen = function() {
        console.log("Connected? " + obskurWs.readyState);
    }

    // obskur web socket received a message
    obskurWs.onmessage = function(inEvent) {
        // Parse parameter from string to object
        var jsonObj = JSON.parse(inEvent.data);

        console.log(jsonObj);

        var state = jsonObj['state'];
        var event = jsonObj['event'];
        var properties = jsonObj['properties'];

        if(event === 'updateToPlugin') {
            console.log("Receiving event from Obskur.");

            if(state in stateActions) {
                
                let propertiesToUpdate = stringArrayToPropertyArray(properties);

                let stateUpdatedProps = stateActions[state].updatedProps;

                if(!(stateUpdatedProps)) {
                    stateUpdatedProps = {};
                }

                propertiesToUpdate.forEach(property => {
                    stateUpdatedProps[property.name] = property.value;
                });

                stateActions[state].updatedProps = stateUpdatedProps;
            }
        }
    };
}

function updateTriggerRoutes(routesArr) {
    var routes = triggerRoutes;

    routesArr.forEach(route => {
        var parsedRoutePath = parseRouteString(route.routePath);

        routes[parsedRoutePath[1]] = {};
        routes[parsedRoutePath[1]]['routePath'] = route.routePath;
        routes[parsedRoutePath[1]]['routeProps'] = route.routeProps
            .map(prop => {
                var parsedProperty = parsePropertyString(prop);

                var newProp = {};
                newProp['name'] = parsedProperty[0];
                newProp['value'] = parsedProperty[1];
                return newProp;
            });
    });

    return routes;
}

function updateStateActions(states, stateActArr) {
    var updatedStates = {};

    stateActArr.forEach(stateAction => {
        let stateName = stateAction.stateName;

        updatedStates[stateName] = {};
        updatedStates[stateName]['stateName'] = stateName;
        updatedStates[stateName]['stateActionProps'] = stateAction.stateActionProps
            .map(prop => {
                var parsedProperty = parsePropertyString(prop);

                var newProp = {};
                newProp['name'] = parsedProperty[0];
                newProp['value'] = parsedProperty[1];
                return newProp;
            });
        updatedStates[stateName]['hasTriggerDelegate'] = stateAction.hasTriggerDelegate;

        if(states[stateName]) {
            updatedStates[stateName]['updatedProps'] = states[stateName].updatedProps;
        }

    });

    console.log("Updated states: " + JSON.stringify(updatedStates));

    return updatedStates;
}
