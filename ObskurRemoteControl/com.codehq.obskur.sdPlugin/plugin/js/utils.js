//==============================================================================
/**
@file       utils.js
@brief      Obskur Remote Control Plugin
@copyright  This source code is licensed under the MIT-style license found in the LICENSE file.
**/
//==============================================================================

// Register the plugin or PI
function registerPluginOrPI(inEvent, inUUID) {
  if (websocket) {
      var json = {
          'event': inEvent,
          'uuid': inUUID
      };

      websocket.send(JSON.stringify(json));
  }
}

// Save settings
function saveSettings(inAction, inUUID, inSettings) {
  if (websocket) {
      const json = {
          'action': inAction,
          'event': 'setSettings',
          'context': inUUID,
          'payload': inSettings
       };

       websocket.send(JSON.stringify(json));
  }
}

// Save global settings
function saveGlobalSettings(inUUID) {
  if (websocket) {
      const json = {
          'event': 'setGlobalSettings',
          'context': inUUID,
          'payload': globalSettings
       };

       websocket.send(JSON.stringify(json));
  }
}

// Request global settings for the plugin
function requestGlobalSettings(inUUID) {
  if (websocket) {
      var json = {
          'event': 'getGlobalSettings',
          'context': inUUID
      };

      websocket.send(JSON.stringify(json));
  }
}

// Log to the global log file
function log(inMessage) {
  // Log to the developer console
  var time = new Date();
  var timeString = time.toLocaleDateString() + ' ' + time.toLocaleTimeString();
  console.log(timeString, inMessage);

  // Log to the Stream Deck log file
  if (websocket) {
      var json = {
          'event': 'logMessage',
          'payload': {
              'message': inMessage
          }
      };

      websocket.send(JSON.stringify(json));
  }
}

// Show alert icon on the key
function showAlert(inUUID) {
  if (websocket) {
      var json = {
          'event': 'showAlert',
          'context': inUUID
      };

      websocket.send(JSON.stringify(json));
  }
}

// Set the state of a key
function setState(inContext, inState) {
  if (websocket) {
      var json = {
          'event': 'setState',
          'context': inContext,
          'payload': {
              'state': inState
          }
      };

      websocket.send(JSON.stringify(json));
  }
}

// Set data to PI
function sendToPropertyInspector(inAction, inContext, inData) {

  console.log("Sending to PI");
  
  if (websocket) {
      var json = {
          'action': inAction,
          'event': 'sendToPropertyInspector',
          'context': inContext,
          'payload': inData
      };

      console.log("Data getting sent: " + JSON.stringify(inData));

      websocket.send(JSON.stringify(json));
  }
}

// Set data to plugin
function sendToPlugin(inAction, inContext, inData) {
  if (websocket) {
      var json = {
          'action': inAction,
          'event': 'sendToPlugin',
          'context': inContext,
          'payload': inData
      };

      websocket.send(JSON.stringify(json));
  }
}

// Set data from Obskur to plugin
function sendObskurUpdateToPropertyInspector(inState, inData) {
  console.log("Sending update from obskur to property inspector.");

  if (websocket) {
      console.log("Update getting sent to property inspector. " + inData);

      var json = {
          'state': inState,
          'event': 'sendObskurToPropertyInspector',
          'properties': inData
      };

      websocket.send(JSON.stringify(json));
  }
}

// Call state action's trigger on Obskur side
function triggerStateAction(inState, inData) {
  console.log("Trigger state action.");

  if (obskurWs) {
      console.log("Trigger data sent: " + inData);

      var json = {
          'state': inState,
          'event': 'obskurTrigger',
          'properties': objectToStringArray(inData)
      };

      obskurWs.send(JSON.stringify(json));
  }
}

// Update state action on obskur side
function updateStateAction(inState, inData) {
  console.log("Update state action.");

  if (obskurWs) {
    console.log("Update data sent: " + inData);

    var json = {
        'state': inState,
        'event': 'obskurUpdate',
        'properties': objectToStringArray(inData)
    };

    console.log('Sent update to obskur!');

    obskurWs.send(JSON.stringify(json));
  }
}

// Load the localizations
function getLocalization(inLanguage, inCallback) {
  var url = '../' + inLanguage + '.json';
  var xhr = new XMLHttpRequest();
  xhr.open('GET', url, true);

  xhr.onload = function() {
      if (xhr.readyState === XMLHttpRequest.DONE) {
          try {
              data = JSON.parse(xhr.responseText);
              var localization = data['Localization'];
              inCallback(true, localization);
          }
          catch(e) {
              inCallback(false, 'Localizations is not a valid json.');
          }
      }
      else {
          inCallback(false, 'Could not load the localizations.');
      }
  };

  xhr.onerror = function() {
      inCallback(false, 'An error occurred while loading the localizations.');
  };

  xhr.ontimeout = function() {
      inCallback(false, 'Localization timed out.');
  };

  xhr.send();
}

// Perform fetch request with specific Post route and return response as JSON
async function postAction(data, route) {
  const response = await fetch(fetchUrl + route, {
      method: 'POST',
      headers: {
          'Accept': '*/*',
          'Content-Type': 'application/json'
      },
      body: JSON.stringify(data)
  });

  return response;
}

// Performs a GET request
async function getAction(route) {
  const response = await fetch(fetchUrl + route, {
    method: 'GET',
    headers: {
        'Accept': '*/*',
        'Content-Type': 'application/json'
    }
  });

  return response.json();
}

// Parses property string into array
function parsePropertyString(propertyString) {
  let parsedProperty = propertyString.replace(/ +/g, "").split(':');
  return parsedProperty;
}

// Parses route string into array
function parseRouteString(routeString) {
  let routeArr = routeString.split('/').map(str => {
    return str.replace(str.charAt(0), str.charAt(0).toUpperCase());
  });

  let optGroup = routeArr[1];

  let newRouteString = routeArr.slice(2).join('/');

  let parsedRoute = [optGroup, newRouteString];

  return parsedRoute; 
}

// Converts properties object to string array
function objectToStringArray(object) {
  let stringArr = [];

  for (const key in object) {
    stringArr.push(`${key}: ${object[key]}`);
  }

  return stringArr;
}

// Converts properties string array to object
function stringArrayToPropertyArray(stringArr) {
  let propertyArray = [];

  stringArr.forEach(string => {
    // [0] = name, [1] = type, [2] = value
    let parsedStringArr = parsePropertyString(string);
    let newProperty = {};

    switch (parsedStringArr[1]) {
      case 'string':
        newProperty['name'] = parsedStringArr[0];
        newProperty['value'] = parsedStringArr[2];
        break;

      case 'number':
        newProperty['name'] = parsedStringArr[0];
        newProperty['value'] = Number.parseFloat(parsedStringArr[2]);
        break;

      case 'boolean':
        newProperty['name'] = parsedStringArr[0];
        newProperty['value'] = (parsedStringArr[2] == 'true');
        break;

      default:
        break;
    }

    propertyArray.push(newProperty);
     
  });

  return propertyArray;
}