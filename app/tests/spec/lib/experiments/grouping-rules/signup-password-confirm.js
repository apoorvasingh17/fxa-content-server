/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

define(function (require, exports, module) {
  'use strict';

  const { assert } = require('chai');
  const Experiment = require('lib/experiments/grouping-rules/signup-password-confirm');
  const sinon = require('sinon');

  describe('lib/experiments/grouping-rules/signup-password-confirm', () => {
    let experiment;

    beforeEach(() => {
      experiment = new Experiment();
    });

    describe('sampleRate', () => {
      it('returns 1 for development', () => {
        assert.equal(Experiment.sampleRate('development'), 1);
      });

      it('returns 0.1 for everyone else', () => {
        assert.equal(Experiment.sampleRate('production'), 0.1);
      });
    });

    describe('choose', () => {
      it('delegates to bernoulliTrial', () => {
        sinon.stub(experiment, 'bernoulliTrial', () => true);

        assert.isTrue(experiment.choose({ env: 'production', uniqueUserId: 'user-id' }));
        assert.isTrue(experiment.bernoulliTrial.calledOnce);
        assert.isTrue(experiment.bernoulliTrial.calledWith(0.1, 'user-id'));
      });

      describe('forceExperiment set', () => {
        describe('to name', () => {
          it('returns true if group is `treatment`', () => {
            assert.isTrue(experiment.choose({
              forceExperiment: 'signupPasswordConfirm',
              forceExperimentGroup: 'treatment',
              uniqueUserId: 'user-id'
            }));
          });

          it('returns false if group is anything else', () => {
            assert.isFalse(experiment.choose({
              forceExperiment: 'signupPasswordConfirm',
              forceExperimentGroup: 'frobnicate',
              uniqueUserId: 'user-id'
            }));
          });
        });

        describe('to other experiment', () => {
          it('delegates to rate', () => {
            sinon.stub(experiment, 'bernoulliTrial', () => true);

            assert.isTrue(experiment.choose({
              forceExperiment: 'sendSms',
              forceExperimentGroup: 'treatment',
              uniqueUserId: 'user-id'
            }));
            assert.isTrue(experiment.bernoulliTrial.calledOnce);
          });
        });
      });
    });
  });
});
