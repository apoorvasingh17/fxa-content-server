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
  const config = intern.config;
  const PAGE_URL = config.fxaContentRoot + 'signup?context=fx_desktop_v2&service=sync&forceAboutAccounts=true';

  var email;
  const PASSWORD = '12345678';

  const click = FunctionalHelpers.click;
  const clearBrowserState = FunctionalHelpers.clearBrowserState;
  const closeCurrentWindow = FunctionalHelpers.closeCurrentWindow;
  const fillOutSignUp = FunctionalHelpers.fillOutSignUp;
  const noPageTransition = FunctionalHelpers.noPageTransition;
  const noSuchBrowserNotification = FunctionalHelpers.noSuchBrowserNotification;
  const openPage = FunctionalHelpers.openPage;
  const openVerificationLinkInNewTab = FunctionalHelpers.openVerificationLinkInNewTab;
  const respondToWebChannelMessage = FunctionalHelpers.respondToWebChannelMessage;
  const testAttributeExists = FunctionalHelpers.testAttributeExists;
  const testElementExists = FunctionalHelpers.testElementExists;
  const testEmailExpected = FunctionalHelpers.testEmailExpected;
  const testIsBrowserNotified = FunctionalHelpers.testIsBrowserNotified;

  registerSuite({
    name: 'Firefox Desktop Sync v2 sign_up',

    beforeEach: function () {
      email = TestHelpers.createEmail();
      return this.remote.then(clearBrowserState());
    },

    afterEach: function () {
      return this.remote.then(clearBrowserState());
    },

    'signup, verify same browser': function () {
      return this.remote
        .then(openPage(PAGE_URL, selectors.SIGNUP.HEADER))
        .then(respondToWebChannelMessage('fxaccounts:can_link_account', { ok: true } ))
        .then(fillOutSignUp(email, PASSWORD))

        // user should be transitioned to the choose what to Sync page
        .then(testElementExists(selectors.CHOOSE_WHAT_TO_SYNC.HEADER))

        .then(testIsBrowserNotified('fxaccounts:can_link_account'))
        .then(noSuchBrowserNotification('fxaccounts:login'))

        // test that autofocus attribute has been applied to submit button
        .then(testAttributeExists('#submit-btn', 'autofocus'))

        // uncheck the passwords and addons engines.
        // cannot use input selectors here because labels overlay them.
        .then(click(selectors.CHOOSE_WHAT_TO_SYNC.ENGINE_PASSWORDS))
        .then(click(selectors.CHOOSE_WHAT_TO_SYNC.ENGINE_HISTORY))
        .then(click(selectors.CHOOSE_WHAT_TO_SYNC.SUBMIT))

        // user should be transitioned to the "go confirm your address" page
        .then(testElementExists(selectors.CONFIRM_SIGNUP.HEADER))

        // the login message is only sent after the sync preferences screen
        // has been cleared.
        .then(testIsBrowserNotified('fxaccounts:login'))
        // verify the user
        .then(openVerificationLinkInNewTab(email, 0))
        .switchToWindow('newwindow')

        .then(testElementExists(selectors.CONNECT_ANOTHER_DEVICE.HEADER))
        .then(closeCurrentWindow())

        // We do not expect the verification poll to occur. The poll
        // will take a few seconds to complete if it erroneously occurs.
        // Add an affordance just in case the poll happens unexpectedly.
        .then(noPageTransition(selectors.CONFIRM_SIGNUP.HEADER, 5000))

        // A post-verification email should be sent, this is Sync.
        .then(testEmailExpected(email, 1));
    }
  });
});
