/**
 * Test case management plugin for TestLodge.
 */

var log4js = require('log4js');
var logger = log4js.getLogger('ciPlugin');

module.exports = {
  /**
   *  Returns the name of the branch that triggered this execution.
   */
  getBranchName: getBranchName,

  /**
   * Returns the url of this build.
   */
  getBuildUrl: getBuildUrl
};

/*
 * Environment variables
 */
var ciBranch = 'CI_BRANCH';
var ciBuildUrl = 'CI_BUILD_URL';

function getBranchName() {
  return getEnvVar(ciBranch);
}

function getBuildUrl() {
  return getEnvVar(ciBuildUrl);
}

function getEnvVar(envVarName) {
  if (process.env[envVarName]) {
    return success(envVarName, process.env[envVarName]);
  } else {
    error(envVarName);
  }
}

function success(envVarName, envVarValue) {
  logger.debug('Read value %s from environment variable \'%s\'', envVarValue, envVarName);
  return envVarValue;
}

function error(envVarName) {
  logger.error('Could not read from environment variable \'%s\'', envVarName);
  process.exit(1);
}
