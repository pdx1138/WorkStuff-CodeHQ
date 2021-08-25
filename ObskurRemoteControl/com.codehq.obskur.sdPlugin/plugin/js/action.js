//==============================================================================
/**
@file       action.js
@brief      Obskur Remote Control Plugin
@copyright  This source code is licensed under the MIT-style license found in the LICENSE file.
**/
//==============================================================================

// Protype which represents an action
function Action(inContext, inSettings) {
  // Init Action
  var instance = this;

  // Private variable containing the context of the action
  var context = inContext;

  // Private variable containing the settings of the action
  var settings = inSettings;

  // Public function returning the context
  this.getContext = function() {
      return context;
  };

  // Public function returning the settings
  this.getSettings = function() {
      return settings;
  };

  // Public function for settings the settings
  this.setSettings = function(inSettings) {
      settings = inSettings;
  };
}