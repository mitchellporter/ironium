'use strict';

const assert       = require('assert');
const AWS          = require('aws-sdk');
const Crypto       = require('crypto');
const getAWSConfig = require('../aws_config');
const Ironium      = require('../..');
const setup        = require('../helpers');


(getAWSConfig.isAvailable ? describe : describe.skip)('Processing queues - configuration by AWS Credentials object', function() {
  const randomJobID = Crypto.randomBytes(256).toString('hex');
  let runs;
  let accessKeyId;
  let secretAccessKey;
  let credentials;

  function countJobs(job) {
    if (job.id === randomJobID)
      runs++;
    return Promise.resolve();
  }

  before(setup);

  before(function() {
    runs = 0;
  });

  before(function() {
    credentials = new AWS.Credentials(getAWSConfig());

    // Make sure Ironium is using the credentials object
    // and not reading from the environment.
    accessKeyId                       = process.env.AWS_ACCESS_KEY_ID;
    secretAccessKey                   = process.env.AWS_SECRET_ACCESS_KEY;
    process.env.AWS_ACCESS_KEY_ID     = '';
    process.env.AWS_SECRET_ACCESS_KEY = '';
  });

  before(function() {
    Ironium.configure({ credentials, region: 'us-east-1' });
  });

  before(function() {
    Ironium.eachJob('foo', countJobs);
  });

  before(function() {
    return Ironium.queueJob('foo', { id: randomJobID });
  });

  before(function(done) {
    process.env.NODE_ENV = 'production';
    Ironium.start();
    setTimeout(done, 5000);
  });

  it('should be using AWS', function() {
    return Ironium.configPromise
      .then(config => assert.equal(config.service, 'aws'));
  });

  it('should have run the job', function() {
    assert.equal(runs, 1);
  });

  after(function() {
    process.env.AWS_ACCESS_KEY_ID     = accessKeyId;
    process.env.AWS_SECRET_ACCESS_KEY = secretAccessKey;
  });

  after(function() {
    process.env.NODE_ENV = 'test';
    Ironium.stop();
    Ironium.configure({});
  });
});
