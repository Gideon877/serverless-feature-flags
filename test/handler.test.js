const assert = require('assert');
const handler = require('../src/lib/handler.js');
const isValidRequest = require('../src/lib/is-valid-request');
const sinon = require('sinon');

let sandbox;

describe('Lambda handler', () => {
  beforeEach(() => {
    sandbox = sinon.sandbox.create();
  });

  afterEach(() => {
    sandbox.restore();
  });

  it('should resolve with a 204 on succesfull call by default if no success status code has been passed', () => {
    const method = sandbox.stub().returns(Promise.resolve());
    const callback = sandbox.stub();
    const payload = { featureName: 1, state: 2 };
    sandbox.stub(isValidRequest, 'validate').returns(payload);
    return handler.execute(method, payload, undefined, callback, 204).then(() => {
      assert.equal(callback.firstCall.args[1].statusCode, 204);
      assert.equal(method.calledWith(payload), true);
    });
  });

  it('should resolve with a 203 on succesfull call', () => {
    const method = sandbox.stub().returns(Promise.resolve());
    const callback = sandbox.stub();
    sandbox.stub(isValidRequest, 'validate').returns(true);
    return handler.execute(method, {}, undefined, callback, 203).then(() => {
      assert.equal(callback.firstCall.args[1].statusCode, 203);
    });
  });

  it('should resolve with any code passed on succesfull call', () => {
    const method = sandbox.stub().returns(Promise.resolve());
    const callback = sandbox.stub();
    sandbox.stub(isValidRequest, 'validate').returns(true);
    return handler.execute(method, {}, undefined, callback, 301).then(() => {
      assert.equal(callback.firstCall.args[1].statusCode, 301);
    });
  });

  it('should resolve with a 500 on failed call', () => {
    const method = sandbox.stub().returns(Promise.reject());
    const callback = sandbox.stub();
    sandbox.stub(isValidRequest, 'validate').returns(true);
    return handler.execute(method, {}, undefined, callback).catch(() => {
      assert.equal(callback.firstCall.args[1].statusCode, 500);
    });
  });

  it('should support error response mapping. e.g. 400 to 404', () => {
    const method = sandbox.stub().returns(Promise.reject({ statusCode: 400 }));
    const callback = sandbox.stub();
    sandbox.stub(isValidRequest, 'validate').returns(true);
    return handler.execute(method, {}, undefined, callback, 204, { 400: 404 }).catch(() => {
      assert.equal(callback.firstCall.args[1].statusCode, 404);
    });
  });

  it('should return 400 when the payload is invalid', () => {
    const method = sandbox.stub();
    const callback = sandbox.stub();
    sandbox.stub(isValidRequest, 'validate').returns(false);
    return handler.execute(method, {}, undefined, callback).catch(() => {
      assert.equal(callback.firstCall.args[1].statusCode, 400);
      assert.deepEqual(callback.firstCall.args[1].body, {
        error: {
          code: 400,
          message: 'Invalid request',
        },
      });
    });
  });
});
