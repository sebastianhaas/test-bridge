/**
 * Test case management plugin for TestLodge.
 */

var colors = require('colors');
var log4js = require('log4js');
var logger = log4js.getLogger('managementPlugin');
var request = require('request');
var util = require('util');

module.exports = {
  /**
  	 *  Returns an array of all test runs containing a linked test case.
   	 */
  updateTestCaseRuns: updateTestCaseRuns,

  /**
  	 * The test run to update.
  	 */
  testRunIdentifier: null
};

/**
 * Configuration
 */
var name  = '';
var project = '';
var email = '';
var password = '';
var apiUrl = 'api.testlodge.com';
var apiVersion = 'v1';

function updateTestCaseRuns(localTestRuns) {
  if (!module.exports.testRunIdentifier) {
    return new Error('No test run specified.');
  }

  // Get the ID for the specified test run
  request({
    'method': 'GET',
    'uri': util.format('%s/runs.json', baseUrl()),
    'auth': {'user': email, 'pass': password}
  }, function(error, response, body) {
  if (!error && response.statusCode == 200) {
    logger.debug('Retrieved list of test runs.');

    var testRunId = getTestRunIdByName(module.exports.testRunIdentifier, body);

    // Get a list of all test case runs for the current test run
    request({
      'method': 'GET',
      'uri': util.format('%s/runs/%s/executed_steps.json', baseUrl(), testRunId),
      'auth': {'user': email, 'pass': password}
    }, function(error, response, body) {
  if (!error && response.statusCode == 200) {
    logger.debug('Retrieved list of test case runs.');

    // Loop over local test case runs
    for (var i = 0; i < localTestRuns.length; i++) {
      var localTestCaseRun = localTestRuns[i];

      // Loop over all test cases linked with the current test case run
      for (var j = 0; j < localTestCaseRun.linkedTestCases.length; j++) {
        var linkedTestCase = localTestCaseRun.linkedTestCases[j];
        var linkedTestCaseRunIds = getLinkedTestCaseRunIds(linkedTestCase, body);

        // Update corresponding TestLodge runs
        for (var k = 0; k < linkedTestCaseRunIds.length; k++) {
          updateTestLodge(localTestCaseRun, testRunId, linkedTestCaseRunIds[k]);
        }
      }
    }
  } else {
    logger.error('Error getting list of test case runs. Status code: %s', response.statusCode);
    if (error) {
      logger.debug(error);
    }
  }
			});
  } else {
    logger.error('Error getting list of test runs. Status code: %s', response.statusCode);
    if (error) {
      logger.debug(error);
    }
  }
	});
}

function updateTestLodge(localTestRun, testRunId, testRunCaseRunId) {

  // Gather some test execution info for the 'Actual resul' field
  var actualResult = util.format('Duration: %sms', localTestRun.duration);
  if (Object.keys(localTestRun.err).length) {
    actualResult = util.format('%s\nError:\n%j', actualResult, localTestRun.err);
  }

  // Check test result and map to passed/not passed
  var passed = localTestRun.result === 'passed' ? 1 : 0;

  // Patch remote test case run with the new (local) information
  request({
    'method': 'PATCH',
    'uri': util.format('%s/runs/%s/executed_steps/%s.json', baseUrl(), testRunId, testRunCaseRunId),
    'auth': {'user': email, 'pass': password},
    'json': {
      'executed_step': {
        'passed': passed,
        'actual_result': actualResult
      }
    }
  }, function(error, response, body) {
  if (!error && response.statusCode == 200) {
    logger.info('Test case %s updated - %s', testRunCaseRunId, coloredStatusOutput(passed));
  } else {
    logger.error('Error updating test case %s. Status code: %s', testRunCaseRunId, response.statusCode);
    if (error) {
      logger.debug(error);
    }
  }
	});
}

function getLinkedTestCaseRunIds(testCaseIdentifier, caseRunsBody) {
  //jscs:disable requireCamelCaseOrUpperCaseIdentifiers
  var jsonData = JSON.parse(caseRunsBody);
  var linkedTestCaseRunIds = [];
  var arrayLength;

  // Loop over test case runs in the current test run and return Ids for matching test cases
  arrayLength = jsonData.executed_steps.length;
  for (var i = 0; i < arrayLength; i++) {
    if (jsonData.executed_steps[i].step_number === testCaseIdentifier) {
      linkedTestCaseRunIds.push(jsonData.executed_steps[i].id);
    }
  }
  return linkedTestCaseRunIds;
  //jscs:enable requireCamelCaseOrUpperCaseIdentifiers
}

function getTestRunIdByName(testRunIdentifier, runsBody) {
  var jsonData = JSON.parse(runsBody);
  var arrayLength;

  // Process passed test runs
  arrayLength = jsonData.runs.length;
  for (var i = 0; i < arrayLength; i++) {
    if (jsonData.runs[i].name === testRunIdentifier) {
      return jsonData.runs[i].id;
    }
  }
}

function baseUrl() {
  return util.format('https://%s.%s/%s/projects/%s', name, apiUrl, apiVersion, project);
}

function coloredStatusOutput(testResult) {
  if (testResult === 1) {
    return 'passed'.green;
  } else if (testResult === 0) {
    return 'failed'.red;
  } else {
    return 'not run'.yellow;
  }
}
