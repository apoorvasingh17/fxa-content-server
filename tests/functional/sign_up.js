/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

define([
  'intern',
  'intern!object',
  'tests/lib/helpers',
  'tests/functional/lib/helpers',
  'tests/functional/lib/selectors',
  'tests/functional/lib/ua-strings'
], function (intern, registerSuite, TestHelpers, FunctionalHelpers,
  selectors, UA_STRINGS) {
  var config = intern.config;
  var fxaProduction = intern.config.fxaProduction;
  var PAGE_URL = config.fxaContentRoot + 'signup';

  var email;
  var PASSWORD = '12345678';

  var click = FunctionalHelpers.click;
  var clearBrowserState = FunctionalHelpers.clearBrowserState;
  var closeCurrentWindow = FunctionalHelpers.closeCurrentWindow;
  var createUser = FunctionalHelpers.createUser;
  var fillOutSignIn = FunctionalHelpers.fillOutSignIn;
  var fillOutSignInUnblock = FunctionalHelpers.fillOutSignInUnblock;
  var fillOutSignUp = FunctionalHelpers.fillOutSignUp;
  var noPageTransition = FunctionalHelpers.noPageTransition;
  var noSuchElement = FunctionalHelpers.noSuchElement;
  var openPage = FunctionalHelpers.openPage;
  var openSignUpInNewTab = FunctionalHelpers.openSignUpInNewTab;
  var openVerificationLinkInDifferentBrowser = FunctionalHelpers.openVerificationLinkInDifferentBrowser;
  var openVerificationLinkInNewTab = FunctionalHelpers.openVerificationLinkInNewTab;
  var openVerificationLinkInSameTab = FunctionalHelpers.openVerificationLinkInSameTab;
  var testAttributeMatches = FunctionalHelpers.testAttributeMatches;
  var testElementExists = FunctionalHelpers.testElementExists;
  var testElementTextInclude = FunctionalHelpers.testElementTextInclude;
  var testElementValueEquals = FunctionalHelpers.testElementValueEquals;
  var testErrorTextInclude = FunctionalHelpers.testErrorTextInclude;
  var testSuccessWasShown = FunctionalHelpers.testSuccessWasShown;
  var testUrlInclude = FunctionalHelpers.testUrlInclude;
  var type = FunctionalHelpers.type;
  var visibleByQSA = FunctionalHelpers.visibleByQSA;

  var SIGNUP_ENTRYPOINT = 'entrypoint=' + encodeURIComponent('fxa:signup');
  var SYNC_CONTEXT_ANDROID = 'context=fx_fennec_v1';
  var SYNC_CONTEXT_DESKTOP = 'context=fx_desktop_v3';
  var SYNC_SERVICE = 'service=sync';

  function testAtConfirmScreen (email) {
    return function () {
      return this.parent
        .then(testElementExists(selectors.CONFIRM_SIGNUP.HEADER))
        .then(testElementTextInclude(selectors.SIGNIN_UNBLOCK.EMAIL_FIELD, email));
    };
  }

  function signUpWithExistingAccount (context, email, firstPassword, secondPassword, options) {
    return context.remote
      .then(createUser(email, firstPassword, { preVerified: true }))
      .then(fillOutSignUp(email, secondPassword, options));
  }

  registerSuite({
    name: 'sign_up',

    beforeEach: function () {
      email = TestHelpers.createEmail();
      return this.remote.then(clearBrowserState());
    },

    afterEach: function () {
      return this.remote.then(clearBrowserState());
    },

    'with an invalid email': function () {
      return this.remote
        .then(openPage(PAGE_URL + '?email=invalid', selectors['400'].HEADER))
        .then(testErrorTextInclude('invalid'))
        .then(testErrorTextInclude('email'));
    },

    'with an empty email': function () {
      return this.remote
        .then(openPage(PAGE_URL + '?email=', selectors['400'].HEADER))
        .then(testErrorTextInclude('invalid'))
        .then(testErrorTextInclude('email'));
    },

    'signup, verify same browser': function () {
      return this.remote
        .then(openPage(PAGE_URL, selectors.SIGNUP.HEADER))
        .then(visibleByQSA(selectors.SIGNUP.SUGGEST_SYNC))
        .then(fillOutSignUp(email, PASSWORD))
        .then(testAtConfirmScreen(email))
        .then(openVerificationLinkInNewTab(email, 0))

        .switchToWindow('newwindow')
        .then(testElementExists(selectors.SETTINGS.HEADER))
        .then(testSuccessWasShown())
        .then(closeCurrentWindow())

        .then(testElementExists(selectors.SETTINGS.HEADER))
        .then(testSuccessWasShown());
    },

    'signup, verify same browser with original tab closed, sign out': function () {
      return this.remote
        .then(fillOutSignUp(email, PASSWORD))
        .then(testAtConfirmScreen(email))

        .then(FunctionalHelpers.openExternalSite())
        .then(openVerificationLinkInNewTab(email, 0))

        .switchToWindow('newwindow')
        .then(testElementExists(selectors.SETTINGS.HEADER))

        .then(testSuccessWasShown())

        // Ref https://github.com/mozilla/fxa-content-server/issues/3187
        // Ensure the signin screen shows if the user signs out after
        // verification.
        .then(click(selectors.SETTINGS.SIGNOUT))

        .then(testElementExists(selectors.SIGNIN.HEADER))
        // `visibleByQSA` is used to ensure visibility. With the bug in #3187
        // referenced above, the signin screen is drawn, but invisible
        .then(visibleByQSA(selectors.SIGNIN.HEADER))
        .end()

        .then(closeCurrentWindow());
    },

    'signup, verify and sign out of two accounts, all in the same tab, then sign in to the first account': function () {
      // https://github.com/mozilla/fxa-content-server/issues/2209
      var secondEmail = TestHelpers.createEmail();
      this.timeout = 90000;

      return this.remote
        .then(fillOutSignUp(email, PASSWORD))
        .then(testAtConfirmScreen(email))
        .then(openVerificationLinkInSameTab(email, 0))

        .then(testElementExists(selectors.SETTINGS.HEADER))
        .then(testSuccessWasShown())
        .then(click(selectors.SETTINGS.SIGNOUT))

        .then(testElementExists(selectors.SIGNIN.HEADER))

        .then(fillOutSignUp(secondEmail, PASSWORD))
        .then(testAtConfirmScreen(secondEmail))
        .then(openVerificationLinkInSameTab(secondEmail, 0))

        .then(testElementExists(selectors.SETTINGS.HEADER))
        .then(testSuccessWasShown())
        .then(click(selectors.SETTINGS.SIGNOUT))

        .then(testElementExists(selectors.SIGNIN.HEADER))
        .then(fillOutSignIn(email, PASSWORD))
        .then(testElementExists(selectors.SETTINGS.HEADER));
    },

    'signup, verify same browser by replacing the original tab': function () {
      return this.remote
        .then(fillOutSignUp(email, PASSWORD))
        .then(testAtConfirmScreen(email))
        .then(openVerificationLinkInSameTab(email, 0))

        .then(testElementExists(selectors.SETTINGS.HEADER))
        .then(testSuccessWasShown());
    },

    'signup, verify different browser - from original tab\'s P.O.V.': function () {
      return this.remote
        .then(fillOutSignUp(email, PASSWORD))
        .then(testAtConfirmScreen(email))

        .then(openVerificationLinkInDifferentBrowser(email))

        // The original tab should transition to the settings page w/ success
        // message.
        .then(testElementExists(selectors.SETTINGS.HEADER))
        .then(testSuccessWasShown());
    },

    'signup, verify different browser - from new browser\'s P.O.V.': function () {
      return this.remote
        .then(fillOutSignUp(email, PASSWORD))
        .then(testAtConfirmScreen(email))

        // clear local/sessionStorage to synthesize continuing in
        // a separate browser.
        .then(clearBrowserState())
        .then(openVerificationLinkInSameTab(email, 0))

        // user cannot be signed in and redirected to the settings page
        // automatically, just show the signup complete screen.
        .then(testElementExists('#fxa-sign-up-complete-header'));
    },

    'signup with email with leading whitespace on the email': function () {
      var emailWithoutSpace = email;
      var emailWithSpace = ('   ' + email);
      return this.remote
        .then(fillOutSignUp(emailWithSpace, PASSWORD))
        .then(testAtConfirmScreen(emailWithoutSpace))
        .then(clearBrowserState())
        .then(fillOutSignIn(emailWithoutSpace, PASSWORD))

        // user is not confirmed, success is seeing the confirm screen.
        .then(testElementExists(selectors.CONFIRM_SIGNUP.HEADER));
    },

    'signup with email with trailing whitespace on the email': function () {
      var emailWithoutSpace = email;
      var emailWithSpace = ('   ' + email);

      return this.remote
        .then(fillOutSignUp(emailWithSpace, PASSWORD))
        .then(testAtConfirmScreen(emailWithoutSpace))
        .then(clearBrowserState())
        .then(fillOutSignIn(emailWithoutSpace, PASSWORD))

        // user is not confirmed, success is seeing the confirm screen.
        .then(testElementExists(selectors.CONFIRM_SIGNUP.HEADER));
    },

    'signup with invalid email address': function () {
      return this.remote
        .then(fillOutSignUp(email + '-', PASSWORD))

        // wait five seconds to allow any errant navigation to occur
        .then(noPageTransition(selectors.SIGNUP.HEADER, 5000))

        // the validation tooltip should be visible
        .then(visibleByQSA('.tooltip'));
    },

    'signup with existing account, coppa is valid, credentials are correct': function () {
      return signUpWithExistingAccount(this, email, PASSWORD, PASSWORD)

        // should have navigated to settings view
        .then(testElementExists(selectors.SETTINGS.HEADER));
    },

    'signup with existing account, coppa is valid, credentials are wrong': function () {
      return signUpWithExistingAccount(this, email, PASSWORD, 'bad' + PASSWORD)

        .then(visibleByQSA(selectors.SIGNUP.SUGGEST_SIGN_IN))
        .then(click(selectors.SIGNUP.LINK_SUGGEST_SIGN_IN))

        .then(testElementExists(selectors.SIGNIN.HEADER))

        // the email and password fields should be populated
        .then(testElementValueEquals(selectors.SIGNIN.EMAIL, email))
        .then(testElementValueEquals(selectors.SIGNIN.PASSWORD, 'bad' + PASSWORD));
    },

    'signup with existing account, coppa is empty, credentials are correct': function () {
      return signUpWithExistingAccount(this, email, PASSWORD, PASSWORD, { age: ' ' })

        // should have navigated to settings view
        .then(testElementExists(selectors.SETTINGS.HEADER));
    },

    'signup with existing account, coppa is empty, credentials are wrong': function () {
      return signUpWithExistingAccount(this, email, PASSWORD, 'bad' + PASSWORD, { age: ' ' })

        .then(visibleByQSA(selectors.SIGNUP.SUGGEST_SIGN_IN))
        .then(click(selectors.SIGNUP.LINK_SUGGEST_SIGN_IN))

        .then(testElementExists(selectors.SIGNIN.HEADER))

        // the email and password fields should be populated
        .then(testElementValueEquals(selectors.SIGNIN.EMAIL, email))
        .then(testElementValueEquals(selectors.SIGNIN.PASSWORD, 'bad' + PASSWORD));
    },

    'blocked - signup with existing account, coppa is empty, credentials are correct': function () {
      email = TestHelpers.createEmail('blocked{id}');

      return signUpWithExistingAccount(this, email, PASSWORD, PASSWORD, { age: ' ' })

        // should have navigated to settings view
        .then(testElementExists(selectors.SIGNIN_UNBLOCK.HEADER))
        .then(testElementTextInclude(selectors.SIGNIN_UNBLOCK.EMAIL_FIELD, email))
        .then(fillOutSignInUnblock(email, 0))

        .then(testElementExists(selectors.SETTINGS.HEADER));
    },

    'blocked - signup with existing account, coppa is empty, credentials are wrong': function () {
      email = TestHelpers.createEmail('blocked{id}');

      return signUpWithExistingAccount(this, email, PASSWORD, 'bad' + PASSWORD, { age: ' ' })

        // should have navigated to settings view
        .then(testElementExists(selectors.SIGNIN_UNBLOCK.HEADER))
        .then(testElementTextInclude(selectors.SIGNIN_UNBLOCK.EMAIL_FIELD, email))
        .then(fillOutSignInUnblock(email, 0))

        .then(testElementExists(selectors.SIGNIN.HEADER))
        .then(type(selectors.SIGNIN.PASSWORD, PASSWORD))
        .then(click(selectors.SIGNIN.SUBMIT))

        .then(testElementExists(selectors.SIGNIN_UNBLOCK.HEADER))
        .then(testElementTextInclude(selectors.SIGNIN_UNBLOCK.EMAIL_FIELD, email))
        .then(fillOutSignInUnblock(email, 1))

        .then(testElementExists(selectors.SETTINGS.HEADER));
    },


    'signup with new account, coppa is empty': function () {
      return this.remote
        .then(fillOutSignUp(email, PASSWORD, { age: ' ' }))

        // navigation should not occur
        .then(noPageTransition(selectors.SIGNUP.HEADER))

        // an error should be visible
        .then(visibleByQSA('.tooltip'));
    },

    'signup with existing account, coppa is too young, credentials are correct': function () {
      return signUpWithExistingAccount(this, email, PASSWORD, PASSWORD, { age: 12 })

        // should have navigated to settings view
        .then(testElementExists(selectors.SETTINGS.HEADER));
    },

    'signup with existing account, coppa is too young, credentials are wrong': function () {
      return signUpWithExistingAccount(this, email, PASSWORD, 'bad' + PASSWORD, { age: 12 })

        .then(visibleByQSA(selectors.SIGNUP.SUGGEST_SIGN_IN))
        .then(click(selectors.SIGNUP.LINK_SUGGEST_SIGN_IN))

        .then(testElementExists(selectors.SIGNIN.HEADER))
        .then(testElementValueEquals(selectors.SIGNIN.EMAIL, email))
        .then(testElementValueEquals(selectors.SIGNIN.PASSWORD, 'bad' + PASSWORD));
    },

    'signup with new account, coppa is too young': function () {
      return this.remote
        .then(fillOutSignUp(email, PASSWORD, { age: 12 }))

        // should have navigated to cannot-create-account view
        .then(testElementExists('#fxa-cannot-create-account-header'));
    },

    'signup with a verified account signs the user in': function () {
      return this.remote
        .then(createUser(email, PASSWORD, { preVerified: true }))
        .then(fillOutSignUp(email, PASSWORD))

        // should have navigated to settings view
        .then(testElementExists(selectors.SETTINGS.HEADER));
    },

    'signup with an unverified account and different password re-signs up user': function () {
      return this.remote
        .then(createUser(email, PASSWORD))
        .then(fillOutSignUp(email, 'different password'))

        // Being pushed to the confirmation screen is success.
        .then(testElementTextInclude(selectors.SIGNIN_UNBLOCK.EMAIL_FIELD, email));
    },

    'visiting the pp links saves information for return': function () {
      return testRepopulateFields.call(this, '/legal/terms', 'fxa-tos-header');
    },

    'visiting the tos links saves information for return': function () {
      return testRepopulateFields.call(this, '/legal/privacy', 'fxa-pp-header');
    },

    'form prefill information is cleared after signup->sign out': function () {
      return this.remote
        .then(fillOutSignUp(email, PASSWORD))
        .then(testAtConfirmScreen(email))

        .then(openVerificationLinkInDifferentBrowser(email))

        // The original tab should transition to the settings page w/ success
        // message.
        .then(testElementExists(selectors.SETTINGS.HEADER))
        .then(click(selectors.SETTINGS.SIGNOUT))

        .then(testElementExists(selectors.SIGNIN.HEADER))
        // check the email address was cleared
        .then(testElementValueEquals(selectors.SIGNIN.EMAIL, ''))
        // check the password was cleared
        .then(testElementValueEquals(selectors.SIGNIN.PASSWORD, ''));
    },

    'signup, open sign-up in second tab, verify in original tab': function () {
      var windowName = 'sign-up inter-tab functional test';
      return this.remote
        .then(fillOutSignUp(email, PASSWORD))
        .then(testAtConfirmScreen(email))
        .then(openSignUpInNewTab(windowName))
        .switchToWindow(windowName)

        .then(testElementExists(selectors.SIGNUP.HEADER))

        .switchToWindow('')
        .then(openVerificationLinkInSameTab(email, 0))
        .switchToWindow(windowName)
        .then(testElementExists(selectors.SETTINGS.HEADER))
        .then(closeCurrentWindow())

        .then(testElementExists(selectors.SETTINGS.HEADER));
    },

    'signup, open verification link, open verification link again': function () {
      return this.remote
        .then(fillOutSignUp(email, PASSWORD))
        .then(testAtConfirmScreen(email))
        .then(openVerificationLinkInNewTab(email, 0))

        .switchToWindow('newwindow')
        .then(testElementExists(selectors.SETTINGS.HEADER))
        .then(testSuccessWasShown())
        .then(closeCurrentWindow())

        // open verification link again, no error should occur.
        .then(openVerificationLinkInNewTab(email, 0))

        .switchToWindow('newwindow')
        .then(testElementExists(selectors.SETTINGS.HEADER))
        .then(testSuccessWasShown())
        .then(closeCurrentWindow())

        .then(testElementExists(selectors.SETTINGS.HEADER))
        .then(testSuccessWasShown());
    },

    'data-flow-begin attribute is set': function () {
      return this.remote
        .then(openPage(PAGE_URL, selectors.SIGNUP.HEADER))
        .then(testAttributeMatches('body', 'data-flow-begin', /^[1-9][0-9]{12,}$/));
    },

    'integrity attribute is set on scripts and css': function () {
      return this.remote
        .then(openPage(PAGE_URL, selectors.SIGNUP.HEADER))
        .then(testAttributeMatches('script', 'integrity', /^sha512-/))
        .then(testAttributeMatches('link', 'integrity', /^sha512-/))
        .catch(function (err) {
          // this tests only in production
          if (fxaProduction || err.name !== 'AssertionError') {
            throw err;
          }
        });
    },

    'sync suggestion for Fx Desktop': function () {
      return this.remote
        .then(openPage(PAGE_URL, selectors.SIGNUP.HEADER, {
          query: {
            forceUA: UA_STRINGS['desktop_firefox']
          }
        }))
        .then(click(selectors.SIGNUP.LINK_SUGGEST_SYNC))

        .then(testElementExists(selectors.SIGNUP.SUB_HEADER))
        .then(noSuchElement(selectors.SIGNUP.SUGGEST_SYNC))
        .then(testUrlInclude(SYNC_CONTEXT_DESKTOP))
        .then(testUrlInclude(SYNC_SERVICE))
        .then(testUrlInclude(SIGNUP_ENTRYPOINT));
    },

    'sync suggestion for Fennec': function () {
      return this.remote
        .then(openPage(PAGE_URL, selectors.SIGNUP.HEADER, {
          query: {
            forceUA: UA_STRINGS['android_firefox']
          }
        }))
        .then(click(selectors.SIGNUP.LINK_SUGGEST_SYNC))

        .then(testElementExists(selectors.SIGNUP.SUB_HEADER))
        .then(noSuchElement(selectors.SIGNUP.SUGGEST_SYNC))
        .then(testUrlInclude(SYNC_CONTEXT_ANDROID))
        .then(testUrlInclude(SYNC_SERVICE))
        .then(testUrlInclude(SIGNUP_ENTRYPOINT));
    },

    'sync suggestion for everyone else': function () {
      return this.remote
        .then(openPage(PAGE_URL, selectors.SIGNUP.HEADER, {
          query: {
            forceUA: UA_STRINGS['desktop_chrome']
          }
        }))
        .then(click(selectors.SIGNUP.LINK_SUGGEST_SYNC))
        .then(testElementExists(selectors.MOZILLA_ORG_SYNC.HEADER));
    }
  });

  function testRepopulateFields(dest, header) {
    return this.remote
      .then(openPage(PAGE_URL, selectors.SIGNUP.HEADER))
      .then(fillOutSignUp(email, PASSWORD, { submit: false }))

      .then(click('a[href="' + dest + '"]'))
      .then(testElementExists(`#${header}`))
      .then(click('.back'))

      .then(testElementValueEquals(selectors.SIGNUP.EMAIL, email))
      .then(testElementValueEquals(selectors.SIGNUP.PASSWORD, PASSWORD))
      .then(testElementValueEquals(selectors.SIGNUP.AGE, '24'));
  }
});
