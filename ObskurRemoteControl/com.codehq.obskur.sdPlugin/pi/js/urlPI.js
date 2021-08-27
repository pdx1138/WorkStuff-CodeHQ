//==============================================================================
/**
@file       UrlPI.js
@brief      Obskur Remote Control Plugin
@copyright  This source code is licensed under the MIT-style 
            license found in the LICENSE file.
**/
//==============================================================================

function UrlPI(inContext, inLanguage, inStreamDeckVersion, inPluginVersion) {
  // Init ScenePI
  var instance = this;

  // Inherit from PI
  PI.call(this, inContext, inLanguage, inStreamDeckVersion, inPluginVersion);

  // Loads all routes
  this.loadRoutes = function() {

    var urlEl = document.getElementsByClassName('url');

    while(urlEl.length > 0) {
      urlEl[0].parentNode.removeChild(urlEl[0]);
    }

    if (Object.keys(triggerRoutes).length > 1) {
      console.log('One or more routes detected.');

      $('#obskur-item').show();
      $('#obskur-alert').hide();
      $('#obskur-load').hide();
      
      let optGroups = [];

      Object.keys(triggerRoutes).forEach((routeKey, index) => {
        var route = triggerRoutes[routeKey];
        if(route.routePath != "/api") {
          // Parse string for InRoute, create optGroup if not included
          // Add name of route in camel case
          let parsedRoute = parseRouteString(route.routePath);

          if(!optGroups.includes(parsedRoute[0])) {
            optGroups.push(parsedRoute[0]);
            var optGroup = "<optgroup id='optgroup-" 
              + parsedRoute[0].toLowerCase() 
              + "' label='" + parsedRoute[0] 
              + "'></optgroup>";
            document.getElementById('no-options').insertAdjacentHTML('beforebegin', optGroup);
          }
        
          var option = document.createElement('option');
          var label = document.createTextNode(parsedRoute[1]);
          option.setAttribute('value', parsedRoute[1]);
          option.setAttribute('class', 'route');
          option.setAttribute('index', index);
          option.appendChild(label);

          document.getElementById('optgroup-' + parsedRoute[0].toLowerCase()).appendChild(option);
        }
      });

      // Remove no-routes option
      document.getElementById('no-options').remove();

      // Add search function to dropdown
      var triggerSelect = $('#obskur-select').selectize({
        sortField: 'text',
        onChange: triggerChanged
      });
      
      // Check if the route is already configured
      if (settings.route !== undefined) {
        let settingsParsedRoute = parseRouteString(settings.route.routePath);
        
        // Select the currently configured event
        triggerSelect[0].selectize.setValue(settingsParsedRoute[1]);
        console.log("Route: " + settings.route.routePath 
          + ", Option: " + settingsParsedRoute[1]);
      }
      else {
        // Clears all input from dropdown
        triggerSelect[0].selectize.clear();

        console.log("No option saved.");
      }

      
    }
    else {
        console.log('No connection detected');

        $('#obskur-alert summary').text('No routes found. Cannot find Obskur.');

        $('#obskur-alert').show();
        $('#obskur-load').hide();
        $('#obskur-item').hide();
    }

    document.getElementById('pi').style.display = 'block';
  }

  // Load property fields
  this.loadProperties = function() {

    this.clearPropertyFields();
    let route = settings.route;
    let propValues;

    if(!route) return;

    if('updatedProps' in settings.route) {
      propValues = settings.route['updatedProps'];
    }

    // Add entries for each property
    route.routeProps.forEach(prop => {
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
      input.setAttribute("class", "sdpi-item-value routeProp");

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

  // Trigger select changed
  function triggerChanged(inEvent) {
    console.log(inEvent);
    if (inEvent === 'no-options') {
      // do nothing
    }
    else {
      let updatedProps = {};
      if(settings.route) updatedProps = settings.route.updatedProps;

      // Save the new route settings
      let route = triggerRoutes[inEvent];
      settings.route = route;
      settings.route.updatedProps = updatedProps;
      instance.saveSettings();

      // Reload properties
      instance.loadProperties();

      // Inform the plugin that a trigger is set
      instance.sendToPlugin({ 'piEvent': 'setSettings', 
        'settings' : settings});
    }
  }

  // Property changed
  function propertyChanged(inEvent) {
    var propName = inEvent.target.name;
    alert(propName)
    var propValue;
    
    if(inEvent.target.type == "text" 
      || inEvent.target.type == "number") {
      propValue = inEvent.target.value;
    }
    else if(inEvent.target.type == "checkbox") {
      propValue = inEvent.target.checked;
    }
    
    // If updated properties does not exist, add it
    if(!(settings.route['updatedProps'])) {
      settings.route['updatedProps'] = {};
    }

    // Update property and save settings
    settings.route.updatedProps[propName] = propValue;
    instance.saveSettings();

    // Inform the plugin that a trigger is set
    instance.sendToPlugin({ 'piEvent': 'setSettings', 
    'settings' : settings});
  }
}