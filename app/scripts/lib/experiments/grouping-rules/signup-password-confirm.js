/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

define((require, exports, module) => {
  'use strict';

  const BaseGroupingRule = require('./base');

  const GROUP = 'treatment';

  module.exports = class SignupPasswordConfirmGroupingRule extends BaseGroupingRule {
    constructor () {
      super();
      this.name = 'signupPasswordConfirm';
    }

    choose (subject = {}) {
      if (! subject.uniqueUserId && subject.forceExperiment !== this.name) {
        return false;
      }

      if (subject.forceExperiment === this.name) {
        return subject.forceExperimentGroup === GROUP;
      }

      const sampleRate = SignupPasswordConfirmGroupingRule.sampleRate(subject.env);
      return this.bernoulliTrial(sampleRate, subject.uniqueUserId);
    }

    /**
     * Get the sample rate for `env`
     *
     * @static
     * @param {String} env
     * @returns {Number}
     */
    static sampleRate (env) {
      return env === 'development' ? 1.0 : 0.1;
    }
  };
});
