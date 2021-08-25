//==============================================================================
/**
@file       statefulPI.js
@brief      Obskur Remote Control Plugin
@copyright  This source code is licensed under the MIT-style 
            license found in the LICENSE file.
**/
//==============================================================================

function StatefulPI(inContext, inLanguage, inStreamDeckVersion, inPluginVersion) {
  // Init ScenePI
  var instance = this;

  var initializing = true;

  // Inherit from PI
  PI.call(this, inContext, inLanguage, inStreamDeckVersion, inPluginVersion);

  // Loads all state actions
  this.loadStates = function() {

    var statesEl = document.getElementsByClassName('state');

    while(statesEl.length > 0) {
      statesEl[0].parentNode.removeChild(statesEl[0]);
    }

    if (Object.keys(stateActions).length > 1) {
      console.log('One or more routes detected.');

      $('#obskur-item').show();
      $('#obskur-alert').hide();
      $('#obskur-load').hide();
      
      let optGroups = [];

      Object.keys(stateActions).forEach((stateKey, index) => {
         var stateAction = stateActions[stateKey];
        
          var option = document.createElement('option');
          var label = document.createTextNode(stateAction.stateName);
          option.setAttribute('value', stateAction.stateName);
          option.setAttribute('class', 'state');
          option.setAttribute('index', index);
          option.appendChild(label);

          document.getElementById('obskur-select').appendChild(option);
      });

      // Remove no-states option
      document.getElementById('no-options').remove();

      // Add search function to dropdown
      var stateSelect = $('#obskur-select').selectize({
        sortField: 'text',
        onChange: stateChanged
      });
      
      // Check if the state action is already configured
      if (settings.stateAction !== undefined) {
                
        // Select the currently configured event
        stateSelect[0].selectize.setValue(settings.stateAction.stateName);
        console.log("Option: " + settings.stateAction.stateName);
      }
      else {
        console.log("No option saved.");
      }
    }
    else {
        console.log('No connection detected');

        $('#obskur-alert summary').text('No state actions found. Cannot find Obskur.');

        $('#obskur-alert').show();
        $('#obskur-load').hide();
        $('#obskur-item').hide();
    }

    document.getElementById('pi').style.display = 'block';
  }

  // Load property fields
  this.loadProperties = function() {

      this.clearPropertyFields();
      let stateAction = settings.stateAction;
      let propValues;

      if(!stateAction) return;

      if('updatedProps' in settings.stateAction) {
        propValues = settings.stateAction['updatedProps'];
      }

      // Add entries for each property
      stateAction.stateActionProps.forEach(prop => {
      let propValue;

      if(propValues) {
        if(prop.name in propValues) {
          propValue = propValues[prop.name];
        }
      }

      // Clone property from template
      let propertyEl = document.getElementById('property-template').cloneNode(true);
      propertyEl.removeAttribute("id");
      propertyEl.removeAttribute("style");

      // Set the template's label to key
      let label = propertyEl.getElementsByClassName('sdpi-item-label')[0];
      label.appendChild(document.createTextNode(prop.name));

      // Set basic variables for input
      let input = propertyEl.getElementsByClassName('sdpi-item-value')[0];
      input.setAttribute("name", prop.name);
      input.setAttribute("class", "sdpi-item-value stateProp");

      // Set input field based on type
      switch (prop.value) {
        case "string":
          propertyEl.setAttribute("type", "textarea");
          input.setAttribute("type", "text");
          input.required = true;

          if(propValue) input.setAttribute("value", propValue);
          break;

        case "number":
          propertyEl.setAttribute("type", "textarea");
          input.setAttribute("type", "number");

          input.setAttribute("pattern", "[0-9]+");
          input.required = true;

          if(propValue) input.setAttribute("value", propValue);
          break;

        case "boolean":
          propertyEl.setAttribute("type", "checkbox");
          input.setAttribute("type", "checkbox");
          input.setAttribute("id", "chk" + prop.name);

          let chkLabel = document.createElement("label");
          chkLabel.setAttribute("for", "chk" 
            + prop.name);
          chkLabel.appendChild(document.createElement("span"));
          chkLabel.appendChild(document.createTextNode("Enabled"));
          input.insertAdjacentHTML('afterend', chkLabel.outerHTML);

          if(propValue) input.checked = propValue;
          break;

        default:
          break;
      }

      // Add event listener to element
      propertyEl.addEventListener('change', propertyChanged);

      // Append to DOM
      document.getElementById("pi").append(propertyEl);

      // Store in property list
      this.propertyFields.push(propertyEl);
    });
  }

  // State action select changed
  function stateChanged(inEvent) {
    console.log(inEvent);
    if (inEvent === 'no-states') {
      // do nothing
    }
    else {
      // Get the state action information
      let stateAction = stateActions[inEvent];

      // Save the new route settings
      settings.stateAction = stateAction;
      //settings.stateAction.updatedProps = stateAction;
      instance.saveSettings();

      // Reload properties
      instance.loadProperties();

      console.log("State action: " + JSON.stringify(stateActions[inEvent]));

      if(!initializing) {
        console.log("State action sending update");

        // Inform the plugin that a trigger is set
        instance.sendToPlugin({ 'piEvent': 'setSettings', 
        'settings' : settings});
      }
      else {
        initializing = false;
      }
      
    }
  }

  // Property changed
  function propertyChanged(inEvent) {
    var propName = inEvent.target.name;
    var propValue;
    
    if(inEvent.target.type == "text" 
      || inEvent.target.type == "number") {
      propValue = inEvent.target.value;
    }
    else if(inEvent.target.type == "checkbox") {
      propValue = inEvent.target.checked;
    }
    
    // If updated properties does not exist, add it
    if(!(settings.stateAction['updatedProps'])) {
      settings.stateAction['updatedProps'] = {};
    }

    // Update property and save settings
    settings.stateAction.updatedProps[propName] = propValue;
    instance.saveSettings();

    // Inform the plugin that a trigger is set
    instance.sendToPlugin({ 'piEvent': 'setSettings', 
    'settings' : settings});
  }
}