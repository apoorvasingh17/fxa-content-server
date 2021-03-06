/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

'use strict';

define([
  'intern',
  'intern!object',
  'tests/lib/helpers',
  'tests/functional/lib/helpers',
  'tests/functional/lib/selectors',
], function (intern, registerSuite, TestHelpers, FunctionalHelpers, selectors) {

  const config = intern.config;

  const SIGNUP_URL = config.fxaContentRoot + 'signup?canChangeEmail=true';
  const SIGNIN_URL = config.fxaContentRoot + 'signin?canChangeEmail=true';
  const SIGNIN_URL_NO_CHANGE_EMAIL = config.fxaContentRoot + 'signin';
  const PASSWORD = 'password';
  const NEW_PASSWORD = 'password1';

  let email;
  let secondaryEmail;

  const clearBrowserState = FunctionalHelpers.clearBrowserState;
  const click = FunctionalHelpers.click;
  const fillOutChangePassword = FunctionalHelpers.fillOutChangePassword;
  const fillOutResetPassword = FunctionalHelpers.fillOutResetPassword;
  const fillOutCompleteResetPassword = FunctionalHelpers.fillOutCompleteResetPassword;
  const fillOutSignUp = FunctionalHelpers.fillOutSignUp;
  const fillOutSignIn = FunctionalHelpers.fillOutSignIn;
  const openPage = FunctionalHelpers.openPage;
  const openVerificationLinkInNewTab = FunctionalHelpers.openVerificationLinkInNewTab;
  const openVerificationLinkInSameTab = FunctionalHelpers.openVerificationLinkInSameTab;
  const noSuchElement = FunctionalHelpers.noSuchElement;
  const testIsBrowserNotified = FunctionalHelpers.testIsBrowserNotified;
  const testElementExists = FunctionalHelpers.testElementExists;
  const testElementTextEquals = FunctionalHelpers.testElementTextEquals;
  const testErrorTextInclude = FunctionalHelpers.testErrorTextInclude;
  const testSuccessWasShown = FunctionalHelpers.testSuccessWasShown;
  const type = FunctionalHelpers.type;
  const visibleByQSA = FunctionalHelpers.visibleByQSA;

  registerSuite({
    name: 'settings change email',

    beforeEach: function () {
      email = TestHelpers.createEmail();
      secondaryEmail = TestHelpers.createEmail();
      return this.remote.then(clearBrowserState())
        .then(openPage(SIGNUP_URL, selectors.SIGNUP.HEADER))
        .then(fillOutSignUp(email, PASSWORD))
        .then(testElementExists(selectors.CONFIRM_SIGNUP.HEADER))
        .then(openVerificationLinkInSameTab(email, 0))
        .then(testElementExists(selectors.SETTINGS.HEADER))
        .then(click(selectors.EMAIL.MENU_BUTTON))

        // add secondary email, verify
        .then(type(selectors.EMAIL.INPUT, secondaryEmail))
        .then(click(selectors.EMAIL.ADD_BUTTON))
        .then(testElementExists(selectors.EMAIL.NOT_VERIFIED_LABEL))
        .then(openVerificationLinkInSameTab(secondaryEmail, 0))

        .then(click(selectors.SETTINGS.SIGNOUT))
        .then(openPage(SIGNIN_URL, selectors.SIGNIN.HEADER))
        .then(fillOutSignIn(email, PASSWORD))

        // set new primary email
        .then(click(selectors.EMAIL.MENU_BUTTON ))
        .then(testElementTextEquals(selectors.EMAIL.ADDRESS_LABEL, secondaryEmail))
        .then(testElementExists(selectors.EMAIL.VERIFIED_LABEL))
        .then(click(selectors.EMAIL.SET_PRIMARY_EMAIL_BUTTON));
    },

    afterEach: function () {
      return this.remote.then(clearBrowserState());
    },

    'does no show change email option if query `canChangeEmail` not set': function () {
      return this.remote
        // sign out
        .then(click(selectors.SETTINGS.SIGNOUT))

        // sign in and does not show change primary email button
        .then(openPage(SIGNIN_URL_NO_CHANGE_EMAIL, selectors.SIGNIN.HEADER))
        .then(testElementExists(selectors.SIGNIN.HEADER))
        .then(fillOutSignIn(secondaryEmail, PASSWORD))
        .then(click(selectors.EMAIL.MENU_BUTTON ))
        .then(noSuchElement(selectors.EMAIL.SET_PRIMARY_EMAIL_BUTTON));
    },

    'can change primary email and login': function () {
      return this.remote
        // sign out
        .then(click(selectors.SETTINGS.SIGNOUT))

        // sign in with old primary email fails
        .then(openPage(SIGNIN_URL, selectors.SIGNIN.HEADER))
        .then(testElementExists(selectors.SIGNIN.HEADER))
        .then(fillOutSignIn(email, PASSWORD))
        .then(testErrorTextInclude('Primary account email required'))

        // sign in with new primary email
        .then(testElementExists(selectors.SIGNIN.HEADER))
        .then(fillOutSignIn(secondaryEmail, PASSWORD))

        // shows new primary email
        .then(testElementExists(selectors.SETTINGS.HEADER))
        .then(testElementTextEquals(selectors.SETTINGS.PROFILE_HEADER, secondaryEmail));
    },

    'can change primary email, change password and login': function () {
      return this.remote
        // change password
        .then(click(selectors.CHANGE_PASSWORD.MENU_BUTTON))
        .then(fillOutChangePassword(PASSWORD, NEW_PASSWORD))
        .then(testIsBrowserNotified('fxaccounts:change_password'))
        .then(testElementExists(selectors.SETTINGS.HEADER))
        .then(testSuccessWasShown())

        // sign out and fails login with old password
        .then(click(selectors.SETTINGS.SIGNOUT))
        .then(testElementExists(selectors.SIGNIN.HEADER))
        .then(fillOutSignIn(secondaryEmail, PASSWORD))
        .then(visibleByQSA(selectors.SIGNIN.TOOLTIP))

        // sign in with new password
        .then(fillOutSignIn(secondaryEmail, NEW_PASSWORD))
        .then(testElementTextEquals(selectors.SETTINGS.PROFILE_HEADER, secondaryEmail));
    },

    'can change primary email, reset password and login': function () {
      return this.remote
        .then(click(selectors.SETTINGS.SIGNOUT))

        // reset password
        .then(fillOutResetPassword(secondaryEmail))
        .then(testElementExists(selectors.CONFIRM_RESET_PASSWORD.HEADER))
        .then(openVerificationLinkInNewTab(secondaryEmail, 1))

        // complete the reset password in the new tab
        .switchToWindow('newwindow')
        .then(testElementExists(selectors.COMPLETE_RESET_PASSWORD.HEADER))
        .then(fillOutCompleteResetPassword(NEW_PASSWORD, NEW_PASSWORD))

        .then(testElementTextEquals(selectors.SETTINGS.PROFILE_HEADER, secondaryEmail))

        // sign out and fails login with old password
        .then(click(selectors.SETTINGS.SIGNOUT))
        .then(testElementExists(selectors.SIGNIN.HEADER))
        .then(fillOutSignIn(secondaryEmail, PASSWORD))
        .then(visibleByQSA(selectors.SIGNIN.TOOLTIP))

        // sign in with new password succeeds
        .then(fillOutSignIn(secondaryEmail, NEW_PASSWORD))
        .then(testElementTextEquals(selectors.SETTINGS.PROFILE_HEADER, secondaryEmail));
    }
  });
});
