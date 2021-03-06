/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

define([
  'intern',
  'intern!object',
  'intern/chai!assert',
  'intern/dojo/node!../../server/lib/configuration',
  'intern/dojo/node!got',
  'intern/dojo/node!./helpers/init-logging',
  'intern/dojo/node!fs',
  'intern/dojo/node!path',
  'intern/dojo/node!proxyquire',
  'intern/dojo/node!url'
], function (intern, registerSuite, assert, config, got, initLogging, fs, path, proxyquire, url) {
  var serverUrl = intern.config.fxaContentRoot.replace(/\/$/, '');

  var suite = {
    name: 'metrics-errors'
  };

  const VALID_METRICS_ERROR =
    JSON.parse(fs.readFileSync('tests/server/fixtures/metrics_error_valid.json'));
  const INVALID_METRICS_ERROR_OVEWRITE_SLICE_METHOD =
    fs.readFileSync('tests/server/fixtures/metrics_error_overwrite_slice.json');

  suite['#get deprecated /metrics-errors endpoint - returns 200'] = function () {
    return got.get(serverUrl + '/metrics-errors')
      .then((res) => {
        assert.equal(res.statusCode, 200);
      });
  };

  suite['#post /metrics-errors - returns 200'] = {
    'culprit (undefined)': testValidMetricsErrorField('culprit', undefined),
    'event_id value (empty)': testValidException('event_id', ''),
    'event_id value (undefined)': testValidException('event_id', undefined),
    'exception value (empty)': testValidException('value', ''),
    'level (undefined)': testValidMetricsErrorField('level', undefined),
    'message (undefined)': testValidMetricsErrorField('message', undefined),
    'no query params': testValidMetricsError(VALID_METRICS_ERROR),
    'query': testValidMetricsError(VALID_METRICS_ERROR, '?sentry_version=4'),
    'release (undefined)': testValidMetricsErrorField('release', undefined),
    'stacktrace frame w/ colno (null)': testValidStacktraceFrame('colno', null),
    'stacktrace frame w/ colno (undefined)': testValidStacktraceFrame('colno', undefined),
    'stacktrace frame w/ function (undefined)': testValidStacktraceFrame('function', undefined),
    'stacktrace frame w/ lineno (null)': testValidStacktraceFrame('colno', null),
    'stacktrace frame w/ lineno (undefined)': testValidStacktraceFrame('colno', undefined),
    'tags (undefined)': testValidMetricsErrorField('tags', undefined),
    'tags.code (400)': testValidTagValue('code', 400),
    'tags.code undefined': testValidTagValue('code', undefined),
    'tags.context (settings.change-password)': testValidTagValue('context', 'settings.change-password'),
    'tags.context (undefined)': testValidTagValue('context', undefined),
    'tags.context (unknown context)': testValidTagValue('context', 'unknown context'),
    'tags.errno (400)': testValidTagValue('errno', 400),
    'tags.errno (Error)': testValidTagValue('errno', 'Error'),
    'tags.errno (QuotaRandomError)': testValidTagValue('errno', 'QuotaRandomError'),
    'tags.errno (undefined)': testValidTagValue('errno', undefined),
  };

  suite['#post /metrics-errors - returns 400 with invalid body'] = function () {
    return got.post(serverUrl + '/metrics-errors?sentry_version=4', {
      body: JSON.stringify({}),
      headers: {
        'Content-Type': 'application/json'
      }
    }).then(assert.fail, (res) => {
      assert.equal(res.statusCode, 400);
    });
  };

  suite['#post /metrics-errors - returns 400 with invalid frames'] = function () {
    return got.post(serverUrl + '/metrics-errors?sentry_version=4', {
      body: INVALID_METRICS_ERROR_OVEWRITE_SLICE_METHOD,
      headers: {
        'Content-Type': 'application/json'
      }
    }).then(assert.fail, (res) => {
      assert.equal(res.statusCode, 400);
    });
  };

  // This test cannot be run remotely like the other tests in tests/server.
  if (! intern.config.fxaProduction) {
    suite['it gets the release information from package.json'] = function () {
      var contentServerVersion = JSON.parse(fs.readFileSync('./package.json')).version;

      var requestMock = function (req, cb) {
        var resp = {
          statusCode: 200
        };

        // quickly test the correct request is made
        assert.isTrue(req.indexOf('sentry_version=4&sentry_client=raven-js') > 0, 'sentry config is in the request');
        assert.isTrue(req.indexOf(contentServerVersion) > 0, 'version is present in the request');
        assert.isTrue(req.indexOf('release') > 0, 'release tag is present in the request');
        cb(null, resp, {});
      };

      var mocks = {
        'request': requestMock
      };
      var metricsRoute = proxyquire(path.join(process.cwd(), 'server', 'lib', 'routes', 'post-metrics-errors'), mocks);
      var route = metricsRoute().process;
      var mockQuery = JSON.parse(fs.readFileSync('tests/server/fixtures/sentry_query.json'));
      var req = {
        query: mockQuery
      };
      var res = {
        json: function () {}
      };

      route(req, res);
    };

    suite['it trims long stacktraces'] = function () {
      var requestMock = function (req, cb) {
        var resp = {
          statusCode: 200
        };

        var urlParts = url.parse(req, true);
        var frames = JSON.parse(urlParts.query.sentry_data).stacktrace.frames;
        assert.isTrue(req.indexOf('sentry_version=4&sentry_client=raven-js') > 0, 'sentry config is in the request');
        assert.isTrue(frames.length === 20, 'stacktrace is trimmed');
        cb(null, resp, {});
      };

      var mocks = {
        'request': requestMock
      };
      var metricsRoute = proxyquire(path.join(process.cwd(), 'server', 'lib', 'routes', 'post-metrics-errors'), mocks);
      var route = metricsRoute().process;
      var mockQuery = JSON.parse(fs.readFileSync('tests/server/fixtures/sentry_query_long_trace.json'));
      var req = {
        query: mockQuery
      };
      var res = {
        json: function () {}
      };

      route(req, res);
    };
  }

  function testValidMetricsError(metricsError, query) {
    return function () {
      return got.post(serverUrl + '/metrics-errors' + (query || ''), {
        body: JSON.stringify(metricsError),
        headers: {
          'Content-Type': 'application/json'
        }
      })
      .then((res) => {
        assert.equal(res.statusCode, 200);
      });
    };
  }

  function testValidMetricsErrorField(fieldName, fieldValue) {
    const metricsError = deepCopy(VALID_METRICS_ERROR);
    metricsError[fieldName] = fieldValue;
    return testValidMetricsError(metricsError);
  }

  function testValidException(fieldName, fieldValue) {
    const metricsError = deepCopy(VALID_METRICS_ERROR);
    metricsError.exception.values[0][fieldName] = fieldValue;

    return testValidMetricsError(metricsError);
  }

  function testValidStacktraceFrame(fieldName, fieldValue) {
    const metricsError = deepCopy(VALID_METRICS_ERROR);
    metricsError.exception.values[0].stacktrace.frames[0][fieldName] = fieldValue;

    return testValidMetricsError(metricsError);
  }

  function testValidTagValue(fieldName, fieldValue) {
    const metricsError = deepCopy(VALID_METRICS_ERROR);
    metricsError.tags[fieldName] = fieldValue;

    return testValidMetricsError(metricsError);
  }

  function deepCopy(obj) {
    return JSON.parse(JSON.stringify(obj));
  }


  registerSuite(suite);
});
