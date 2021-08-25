//==============================================================================
/**
@file       pi.js
@brief      Philips Hue Plugin
@copyright  This source code is licensed under the MIT-style 
            license found in the LICENSE file.
**/
//==============================================================================

function PI(inContext, inLanguage, inStreamDeckVersion, inPluginVersion) {
  // Init PI
  var instance = this;

  // Hold instance of current property fields
  this.propertyFields = [];

  // Private function to return the action identifier
  function getAction() {
      var action;

      // Find out type of action
      if (instance instanceof TriggerPI) {
        action = 'com.codehq.obskur.trigger';
      }
      else if (instance instanceof StatefulPI) {
        action = 'com.codehq.obskur.stateful';
      }

      return action;
  }

  this.clearPropertyFields = function() {
    this.propertyFields.forEach((propEl) => {
      document.getElementById("pi").removeChild(propEl);
    });

    this.propertyFields = [];
  }

  // Public function to save the settings
  this.saveSettings = function() {
      saveSettings(getAction(), inContext, settings);
  }

  // Public function to send data to the plugin
  this.sendToPlugin = function(inData) {
      sendToPlugin(getAction(), inContext, inData);
  }
}