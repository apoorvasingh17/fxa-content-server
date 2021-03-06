/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

define(function (require, exports, module) {
  'use strict';

  const { assert } = require('chai');
  const AuthErrors = require('lib/auth-errors');
  const Relier = require('models/reliers/sync');
  const TestHelpers = require('../../../lib/helpers');
  const Translator = require('lib/translator');
  const WindowMock = require('../../../mocks/window');

  const CONTEXT = 'fx_desktop_v1';
  const COUNTRY = 'RO';
  const SYNC_MIGRATION = 'sync11';
  const SYNC_SERVICE = 'sync';

  describe('models/reliers/sync', () => {
    let err;
    let relier;
    let translator;
    let windowMock;

    function fetchExpectError () {
      return relier.fetch()
        .then(assert.fail, function (_err) {
          err = _err;
        });
    }

    beforeEach(() => {
      translator = new Translator('en-US', ['en-US']);
      windowMock = new WindowMock();

      relier = new Relier({
        context: CONTEXT
      }, {
        translator: translator,
        window: windowMock
      });
    });

    describe('fetch', () => {
      it('populates model from the search parameters', () => {
        windowMock.location.search = TestHelpers.toSearchString({
          context: CONTEXT,
          country: COUNTRY,
          customizeSync: 'true',
          migration: SYNC_MIGRATION,
          service: SYNC_SERVICE,
          signin: 'signin-code',
          signinCodes: 'true'
        });

        return relier.fetch()
          .then(() => {
            assert.equal(relier.get('context'), CONTEXT);
            assert.equal(relier.get('country'), COUNTRY);
            assert.equal(relier.get('migration'), SYNC_MIGRATION);
            assert.equal(relier.get('service'), SYNC_SERVICE);
            assert.isTrue(relier.get('customizeSync'));
            assert.equal(relier.get('signinCode'), 'signin-code');
            assert.isTrue(relier.get('enableSigninCodes'));
          });
      });

      describe('context query parameter', () => {
        describe('missing', () => {
          beforeEach(() => {
            windowMock.location.search = TestHelpers.toSearchString({});

            return relier.fetch();
          });

          it('falls back to passed in `context', () => {
            assert.equal(relier.get('context'), CONTEXT);
          });
        });

        describe('emtpy', () => {
          beforeEach(() => {
            windowMock.location.search = TestHelpers.toSearchString({
              context: ''
            });

            return fetchExpectError();
          });

          it('errors correctly', () => {
            assert.isTrue(AuthErrors.is(err, 'INVALID_PARAMETER'));
            assert.equal(err.param, 'context');
          });
        });

        describe('whitespace', () => {
          beforeEach(() => {
            windowMock.location.search = TestHelpers.toSearchString({
              context: ' '
            });

            return fetchExpectError();
          });

          it('errors correctly', () => {
            assert.isTrue(AuthErrors.is(err, 'INVALID_PARAMETER'));
            assert.equal(err.param, 'context');
          });
        });
      });

      describe('country query parameter', () => {
        describe('missing', () => {
          beforeEach(() => {
            windowMock.location.search = TestHelpers.toSearchString({});

            return relier.fetch();
          });

          it('does not set a country, it\'ll be retrieved via a call to /sms/status', () => {
            assert.isFalse(relier.has('country'));
          });
        });

        describe('emtpy', () => {
          beforeEach(() => {
            windowMock.location.search = TestHelpers.toSearchString({
              country: ''
            });

            return fetchExpectError();
          });

          it('errors correctly', () => {
            assert.isTrue(AuthErrors.is(err, 'INVALID_PARAMETER'));
            assert.equal(err.param, 'country');
          });
        });

        describe('invalid', () => {
          beforeEach(() => {
            windowMock.location.search = TestHelpers.toSearchString({
              country: 'AR'
            });

            return fetchExpectError();
          });

          it('errors correctly', () => {
            assert.isTrue(AuthErrors.is(err, 'INVALID_PARAMETER'));
            assert.equal(err.param, 'country');
          });
        });

        describe('whitespace', () => {
          beforeEach(() => {
            windowMock.location.search = TestHelpers.toSearchString({
              country: ' '
            });

            return fetchExpectError();
          });

          it('errors correctly', () => {
            assert.isTrue(AuthErrors.is(err, 'INVALID_PARAMETER'));
            assert.equal(err.param, 'country');
          });
        });
      });

      describe('customizeSync query parameter', () => {
        describe('missing', () => {
          beforeEach(() => {
            windowMock.location.search = TestHelpers.toSearchString({
              context: CONTEXT
            });

            return relier.fetch();
          });

          it('succeeds', () => {
            assert.isFalse(relier.get('customizeSync'));
          });
        });

        describe('emtpy', () => {
          beforeEach(() => {
            windowMock.location.search = TestHelpers.toSearchString({
              context: CONTEXT,
              customizeSync: ''
            });

            return fetchExpectError();
          });

          it('errors correctly', () => {
            assert.isTrue(AuthErrors.is(err, 'INVALID_PARAMETER'));
            assert.equal(err.param, 'customizeSync');
          });
        });

        describe('whitespace', () => {
          beforeEach(() => {
            windowMock.location.search = TestHelpers.toSearchString({
              context: CONTEXT,
              customizeSync: ' '
            });

            return fetchExpectError();
          });

          it('errors correctly', () => {
            assert.isTrue(AuthErrors.is(err, 'INVALID_PARAMETER'));
            assert.equal(err.param, 'customizeSync');
          });
        });

        describe('not a boolean', () => {
          beforeEach(() => {
            windowMock.location.search = TestHelpers.toSearchString({
              context: CONTEXT,
              customizeSync: 'not a boolean'
            });

            return fetchExpectError();
          });

          it('errors correctly', () => {
            assert.isTrue(AuthErrors.is(err, 'INVALID_PARAMETER'));
            assert.equal(err.param, 'customizeSync');
          });
        });
      });

      describe('signin query parameter', () => {
        describe('missing', () => {
          beforeEach(() => {
            windowMock.location.search = TestHelpers.toSearchString({
              context: CONTEXT
            });

            return relier.fetch();
          });

          it('succeeds', () => {
            assert.isUndefined(relier.get('signinCode'));
          });
        });

        describe('emtpy', () => {
          beforeEach(() => {
            windowMock.location.search = TestHelpers.toSearchString({
              context: CONTEXT,
              signin: ''
            });

            return relier.fetch();
          });

          it('succeeds', () => {
            assert.isUndefined(relier.get('signinCode'));
          });
        });

        describe('whitespace', () => {
          beforeEach(() => {
            windowMock.location.search = TestHelpers.toSearchString({
              context: CONTEXT,
              signin: ' '
            });

            return relier.fetch();
          });

          it('succeeds', () => {
            assert.isUndefined(relier.get('signinCode'));
          });
        });

        describe('a string', () => {
          beforeEach(() => {
            windowMock.location.search = TestHelpers.toSearchString({
              context: CONTEXT,
              signin: 'signin-code'
            });

            return relier.fetch();
          });

          it('succeeds', () => {
            assert.equal(relier.get('signinCode'), 'signin-code');
          });
        });
      });

      describe('signinCodes query parameter', () => {
        describe('missing', () => {
          beforeEach(() => {
            windowMock.location.search = TestHelpers.toSearchString({
              context: CONTEXT
            });

            return relier.fetch();
          });

          it('succeeds', () => {
            assert.isFalse(relier.get('enableSigninCodes'));
          });
        });

        describe('emtpy', () => {
          beforeEach(() => {
            windowMock.location.search = TestHelpers.toSearchString({
              context: CONTEXT,
              signinCodes: ''
            });

            return fetchExpectError();
          });

          it('errors correctly', () => {
            assert.isTrue(AuthErrors.is(err, 'INVALID_PARAMETER'));
            assert.equal(err.param, 'signinCodes');
          });
        });

        describe('whitespace', () => {
          beforeEach(() => {
            windowMock.location.search = TestHelpers.toSearchString({
              context: CONTEXT,
              signinCodes: ' '
            });

            return fetchExpectError();
          });

          it('errors correctly', () => {
            assert.isTrue(AuthErrors.is(err, 'INVALID_PARAMETER'));
            assert.equal(err.param, 'signinCodes');
          });
        });

        describe('not a boolean', () => {
          beforeEach(() => {
            windowMock.location.search = TestHelpers.toSearchString({
              context: CONTEXT,
              signinCodes: 'not a boolean'
            });

            return fetchExpectError();
          });

          it('errors correctly', () => {
            assert.isTrue(AuthErrors.is(err, 'INVALID_PARAMETER'));
            assert.equal(err.param, 'signinCodes');
          });
        });

        describe('true', () => {
          beforeEach(() => {
            windowMock.location.search = TestHelpers.toSearchString({
              context: CONTEXT,
              signinCodes: 'true'
            });

            return relier.fetch();
          });

          it('succeeds', () => {
            assert.isTrue(relier.get('enableSigninCodes'));
          });
        });

        describe('false', () => {
          beforeEach(() => {
            windowMock.location.search = TestHelpers.toSearchString({
              context: CONTEXT,
              signinCodes: 'false'
            });

            return relier.fetch();
          });

          it('succeeds', () => {
            assert.isFalse(relier.get('enableSigninCodes'));
          });
        });
      });

      it('translates `service` to `serviceName`', () => {
        windowMock.location.search = TestHelpers.toSearchString({
          context: CONTEXT,
          service: SYNC_SERVICE
        });

        return relier.fetch()
          .then(() => {
            assert.equal(relier.get('serviceName'), 'Firefox Sync');
          });
      });
    });

    describe('isSync', () => {
      it('returns `true`', () => {
        assert.isTrue(relier.isSync());
      });
    });

    describe('isCustomizeSyncChecked', () => {
      it('returns true if `customizeSync=true`', () => {
        windowMock.location.search = TestHelpers.toSearchString({
          context: CONTEXT,
          customizeSync: 'true'
        });

        return relier.fetch()
          .then(() => {
            assert.isTrue(relier.isCustomizeSyncChecked());
          });
      });

      it('returns false if `customizeSync=false`', () => {
        windowMock.location.search = TestHelpers.toSearchString({
          context: CONTEXT,
          customizeSync: 'false'
        });

        return relier.fetch()
          .then(() => {
            assert.isFalse(relier.isCustomizeSyncChecked());
          });
      });
    });

    describe('wantsKeys', () => {
      it('always returns true', () => {
        assert.isTrue(relier.wantsKeys());
      });
    });
  });
});

