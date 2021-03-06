/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

/**
 * Display a loading screen on view initialization until
 * the View's normal template is rendered.
 */

define(function (require, exports, module) {
  'use strict';

  const loadingTemplate = require('stache!templates/loading');

  module.exports = {
    initialize () {
      var loadingHTML = loadingTemplate({});
      this.writeToDOM(loadingHTML);
    }
  };
});

