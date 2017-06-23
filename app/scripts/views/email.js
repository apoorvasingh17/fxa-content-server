/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

define(function (require, exports, module) {
  'use strict';

  const Cocktail = require('cocktail');
  const CoppaMixin = require('views/mixins/coppa-mixin');
  const FormPrefillMixin = require('views/mixins/form-prefill-mixin');
  const FormView = require('views/form');
  const SearchParamMixin = require('lib/search-param-mixin');
  const ServiceMixin = require('views/mixins/service-mixin');
  const SyncSuggestionMixin = require('views/mixins/sync-suggestion-mixin');
  const Template = require('stache!templates/email');
  const UserAgentMixin = require('lib/user-agent-mixin');

  class EmailView extends FormView {
    get template () {
      return Template;
    }

    beforeRender () {
      const email = this.relier.get('email');
      if (email) {
        return this.submitEmail(email);
      }
    }

    submit () {
      const email = this.getElementValue('input[type=email]');

      return this.submitEmail(email);
    }

    submitEmail (email) {
      const account = this.user.initAccount({
        email
      });

      // TODO - move the next screen decision making to the broker.
      return this.user.checkAccountEmailExists(account)
        .then((exists) => {
          if (exists) {
            this.navigate('signin/password', {
              account
            });
          } else {
            this.navigate('signup/password', {
              account
            });
          }
        });
    }

    static get ENTRYPOINT () {
      return 'fxa:email';
    }
  }

  Cocktail.mixin(
    EmailView,
    CoppaMixin({}),
    FormPrefillMixin,
    SearchParamMixin,
    ServiceMixin,
    SyncSuggestionMixin({
      entrypoint: EmailView.ENTRYPOINT,
      flowEvent: 'link.signin',
      pathname: 'email'
    }),
    UserAgentMixin
  );

  module.exports = EmailView;
});
