/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

define((require, exports, module) => {
  'use strict';

  const { assert } = require('chai');
  const IndexView = require('views/index');
  const Notifier = require('lib/channels/notifier');
  const Relier = require('models/reliers/base');
  const User = require('models/user');
  const sinon = require('sinon');

  describe('views/index', () => {
    let relier;
    let user;
    let view;

    beforeEach(() => {
      relier = new Relier();
      user = new User();
      view = new IndexView({
        notifier: new Notifier(),
        relier,
        user
      });

      sinon.spy(view, 'navigate');
    });

    it('navigates to `/email` if the relier specifies an email', () => {
      relier.set('email', 'testuser@testuser.com');

      return view.render()
        .then(() => {
          assert.isTrue(view.navigate.calledOnce);
          assert.isTrue(view.navigate.calledWith('email', {}, { replace: true, trigger: true }));
        });
    });

    it('navigates to `/signup` if there is no current account', function () {
      sinon.stub(user, 'getSignedInAccount', () => user.initAccount({}));

      return view.render()
        .then(() => {
          assert.isTrue(view.navigate.calledOnce);
          assert.isTrue(view.navigate.calledWith('signup', {}, { replace: true, trigger: true }));
        });
    });

    it('navigates to `/settings` if the current account is signed in', function () {
      const signedInAccount = user.initAccount({
        sessionToken: 'token'
      });
      sinon.stub(user, 'getSignedInAccount', () => signedInAccount);
      return view.render()
        .then(() => {
          assert.isTrue(view.navigate.calledOnce);
          assert.isTrue(view.navigate.calledWith('settings', {}, { replace: true, trigger: true }));
        });
    });
  });
});
