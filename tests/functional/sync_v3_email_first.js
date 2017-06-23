/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

define([
  'intern',
  'intern!object',
  'tests/lib/helpers',
  'tests/functional/lib/helpers',
  'tests/functional/lib/selectors'
], function (intern, registerSuite, TestHelpers, FunctionalHelpers, selectors) {
  'use strict';

  const config = intern.config;
  const PAGE_URL = `${config.fxaContentRoot}email?context=fx_desktop_v3&service=sync&forceAboutAccounts=true&automatedBrowser=true`;

  let email;
  const PASSWORD = '12345678';

  const clearBrowserState = FunctionalHelpers.clearBrowserState;
  const click = FunctionalHelpers.click;
  const closeCurrentWindow = FunctionalHelpers.closeCurrentWindow;
  const createUser = FunctionalHelpers.createUser;
  const noPageTransition = FunctionalHelpers.noPageTransition;
  const openPage = FunctionalHelpers.openPage;
  const openVerificationLinkInNewTab = FunctionalHelpers.openVerificationLinkInNewTab;
  const testElementExists = FunctionalHelpers.testElementExists;
  const testElementValueEquals = FunctionalHelpers.testElementValueEquals;
  const testIsBrowserNotified = FunctionalHelpers.testIsBrowserNotified;
  const type = FunctionalHelpers.type;
  const visibleByQSA = FunctionalHelpers.visibleByQSA;

  registerSuite({
    name: 'Firefox Desktop Sync v3 email first',

    beforeEach: function () {
      email = TestHelpers.createEmail('sync{id}');

      return this.remote
        .then(clearBrowserState({ force: true }));
    },

    'signup': function () {
      return this.remote
        .then(openPage(PAGE_URL, selectors.ENTER_EMAIL.HEADER, {
          webChannelResponses: {
            'fxaccounts:can_link_account': { ok: true }
          }
        }))
        .then(visibleByQSA(selectors.ENTER_EMAIL.SUB_HEADER))
        .then(type(selectors.ENTER_EMAIL.EMAIL, email))
        .then(click(selectors.ENTER_EMAIL.SUBMIT))
    //    .then(testIsBrowserNotified('fxaccounts:can_link_account'))

        .then(testElementValueEquals(selectors.SIGNUP_PASSWORD.EMAIL_NOT_EDITABLE, email))
        .then(type(selectors.SIGNUP_PASSWORD.PASSWORD, PASSWORD))
        .then(type(selectors.SIGNUP_PASSWORD.VPASSWORD, PASSWORD))
        .then(type(selectors.SIGNUP_PASSWORD.AGE, 21))
        .then(click(selectors.SIGNUP_PASSWORD.SUBMIT))

        .then(testElementExists(selectors.CHOOSE_WHAT_TO_SYNC.HEADER))
        .then(click(selectors.CHOOSE_WHAT_TO_SYNC.SUBMIT))

        .then(testElementExists(selectors.CONFIRM_SIGNUP.HEADER))
        .then(testIsBrowserNotified('fxaccounts:login'))

        .then(openVerificationLinkInNewTab(email, 0))
        .switchToWindow('newwindow')
          .then(testElementExists(selectors.CONNECT_ANOTHER_DEVICE.HEADER))
          .then(closeCurrentWindow())

        // We do not expect the verification poll to occur. The poll
        // will take a few seconds to complete if it erroneously occurs.
        // Add an affordance just in case the poll happens unexpectedly.
        .then(noPageTransition(selectors.CONFIRM_SIGNUP.HEADER, 5000));
    },

    'signin verified': function () {
      return this.remote
        .then(createUser(email, PASSWORD, { preVerified: true }))
        .then(openPage(PAGE_URL, selectors.ENTER_EMAIL.HEADER, {
          webChannelResponses: {
            'fxaccounts:can_link_account': { ok: true }
          }
        }))
        .then(visibleByQSA(selectors.ENTER_EMAIL.SUB_HEADER))
        .then(type(selectors.ENTER_EMAIL.EMAIL, email))
        .then(click(selectors.ENTER_EMAIL.SUBMIT))
  //      .then(testIsBrowserNotified('fxaccounts:can_link_account'))

        .then(testElementExists(selectors.SIGNIN_PASSWORD.HEADER))
        .then(testElementValueEquals(selectors.SIGNIN_PASSWORD.EMAIL_NOT_EDITABLE, email))
        .then(type(selectors.SIGNIN_PASSWORD.PASSWORD, PASSWORD))
        .then(click(selectors.SIGNIN_PASSWORD.SUBMIT))

        .then(testElementExists(selectors.CONFIRM_SIGNIN.HEADER))
        .then(testIsBrowserNotified('fxaccounts:login'))

        .then(openVerificationLinkInNewTab(email, 0))
        .switchToWindow('newwindow')
          .then(testElementExists(selectors.SIGNIN_COMPLETE.HEADER))
          .then(closeCurrentWindow())

        // We do not expect the verification poll to occur. The poll
        // will take a few seconds to complete if it erroneously occurs.
        // Add an affordance just in case the poll happens unexpectedly.
        .then(noPageTransition(selectors.CONFIRM_SIGNIN.HEADER, 5000));
    }/*,

    'signin unverified': function () {
      return this.remote
        .then(createUser(email, PASSWORD, { preVerified: false }))
        .then(openPage(PAGE_URL, selectors.ENTER_EMAIL.HEADER, {
          webChannelResponses: {
            'fxaccounts:can_link_account': { ok: true }
          }
        }))
        .then(visibleByQSA(selectors.ENTER_EMAIL.SUB_HEADER))
        .then(type(selectors.ENTER_EMAIL.EMAIL, email))
        .then(click(selectors.ENTER_EMAIL.SUBMIT))
//        .then(testIsBrowserNotified('fxaccounts:can_link_account'))

        // The /account/status endpoint does not return whether the account
        // is verified, only whether the email has been registered
        .then(testElementExists(selectors.SIGNIN_PASSWORD.HEADER))
        .then(testElementValueEquals(selectors.SIGNIN_PASSWORD.EMAIL_NOT_EDITABLE, email))
        .then(type(selectors.SIGNIN_PASSWORD.PASSWORD, PASSWORD))
        .then(click(selectors.SIGNIN_PASSWORD.SUBMIT))

        // Yes, this is a bit strange. The user must now verify their account!
        .then(testElementExists(selectors.CONFIRM_SIGNUP.HEADER))
        //.then(testIsBrowserNotified('fxaccounts:login'))

        .then(openVerificationLinkInNewTab(email, 0))
        .switchToWindow('newwindow')
          .then(testElementExists(selectors.CONNECT_ANOTHER_DEVICE.HEADER))
          .then(closeCurrentWindow())

        .then(testElementExists(selectors.CONNECT_ANOTHER_DEVICE.HEADER));
    }*/
  });
});
