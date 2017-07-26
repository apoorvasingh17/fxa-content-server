/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

'use strict';

module.exports = function () {
  const route = {};
  route.method = 'get';
  route.path = '/.well-known/apple-site-association';


  route.process = function (req, res) {

    // charset must be set on json responses.
    res.charset = 'utf-8';

    const appleAssociationData = {
      'applinks': {
        'apps': [],
        'details': [
          {
            'appID': '43AQ936H96.org.mozilla.ios.Firefox',
            'paths': ['*']
          },
          {
            'appID': '43AQ936H96.org.mozilla.ios.Fennec',
            'paths': ['*']
          }
        ]
      }
    };

    res.json(appleAssociationData);
  };

  return route;
};
