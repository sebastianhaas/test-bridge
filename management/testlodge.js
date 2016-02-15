/**
 * Test case management plugin for TestLodge.
 */

var colors = require('colors');
var log4js = require('log4js');
var logger = log4js.getLogger('managementPlugin');
var merge = require('merge');
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
  testRunIdentifier: null,

  options: {}
};

/*
 * Default options
 */
var defaultOptions = {
  apiUrl: 'api.testlodge.com',
  apiVersion: 'v1'
};

/*
 * Members
 */
var testRunSections = {};

function updateTestCaseRuns(localTestRuns) {

  // Merge options
  module.exports.options = merge(defaultOptions, module.exports.options);

  if (!module.exports.testRunIdentifier) {
    logger.error('No test run identifier specified.');
    process.exit(1);
  }

  // Get the ID for the specified test run
  request({
    'method': 'GET',
    'uri': util.format('%s/runs.json', baseUrl()),
    'auth': {'user': module.exports.options.email, 'pass': module.exports.options.password}
  }, function(error, response, body) {
    if (!error && response.statusCode == 200) {
      logger.debug('Retrieved list of test runs.');

      // Try to get the corresponding test run for the given identifier
      var testRunId = getTestRunIdByName(module.exports.testRunIdentifier, body);
      // If not, return
      if (!testRunId) {
        logger.warn('Could not find a corresponding test run for identifier \'%s\'.' +
          ' Did not update any test case runs.',
          module.exports.testRunIdentifier);
        process.exit(0);
      }

      // Get the ID for the specified test run
      request({
        'method': 'GET',
        'uri': util.format('%s/runs/%s/run_sections.json', baseUrl(), testRunId),
        'auth': {'user': module.exports.options.email, 'pass': module.exports.options.password}
      }, function(error, response, body) {
        if (!error && response.statusCode == 200) {
          logger.debug('Retrieved list of test run sections.');
          testRunSections = getTestRunSections(body);

          // Get a list of all test case runs for the current test run
          request({
            'method': 'GET',
            'uri': util.format('%s/runs/%s/executed_steps.json', baseUrl(), testRunId),
            'auth': {'user': module.exports.options.email, 'pass': module.exports.options.password}
          }, function(error, response, body) {
            if (!error && response.statusCode == 200) {
              logger.debug('Retrieved list of test case runs.');
              var numberOfUpdatedTestCaseRuns = 0;

              // Loop over local test case runs
              for (var i = 0; i < localTestRuns.length; i++) {
                var localTestCaseRun = localTestRuns[i];

                // Loop over all test cases linked with the current test case run
                for (var j = 0; j < localTestCaseRun.linkedTestCases.length; j++) {
                  var linkedTestCase = localTestCaseRun.linkedTestCases[j];

                  // Get linked test case run IDs
                  var linkedTestCaseRunIds = [];
                  // If 'overrideConfiguration' is set, ignore per-execution configuration, if any
                  if (module.exports.options.overrideConfiguration) {
                    linkedTestCaseRunIds = getLinkedTestCaseRunIds(linkedTestCase,
                      module.exports.options.overrideConfiguration, body);
                  } else {
                    linkedTestCaseRunIds = getLinkedTestCaseRunIds(linkedTestCase, localTestCaseRun.browser, body);
                  }

                  // Update corresponding TestLodge runs
                  for (var k = 0; k < linkedTestCaseRunIds.length; k++) {
                    updateTestLodge(localTestCaseRun, testRunId, linkedTestCaseRunIds[k]);
                    numberOfUpdatedTestCaseRuns++;
                  }
                }
              }
              logger.debug('Triggered %d remote test case run updates.', numberOfUpdatedTestCaseRuns);
            } else {
              logger.error('Error getting list of test case runs. Status code: %s', response.statusCode);
              if (error) {
                logger.debug(error);
              }
            }
          });
        } else {
          logger.error('Error getting list of test run sections. Status code: %s', response.statusCode);
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
  var passed;
  var actualResult;

  // Check test result and map to passed/not passed
  if (localTestRun.result === 'skipped') {
    passed = '';
    actualResult = '';
  } else {
    passed = localTestRun.result === 'passed' ? 1 : 0;

    // Gather some test execution info for the 'Actual result' field
    actualResult = util.format('Duration: %sms', localTestRun.duration);
    if (Object.keys(localTestRun.err).length) {
      actualResult = util.format('%s\nError:\n%j', actualResult, localTestRun.err);
    }
  }

  // Patch remote test case run with the new (local) information
  request({
    'method': 'PATCH',
    'uri': util.format('%s/runs/%s/executed_steps/%s.json', baseUrl(), testRunId, testRunCaseRunId),
    'auth': {'user': module.exports.options.email, 'pass': module.exports.options.password},
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

function getLinkedTestCaseRunIds(testCaseIdentifier, localConfiguration, caseRunsBody) {
  //jscs:disable requireCamelCaseOrUpperCaseIdentifiers
  var jsonData = JSON.parse(caseRunsBody);
  var linkedTestCaseRunIds = [];
  var arrayLength;

  // Loop over test case runs in the current test run and return Ids for matching test cases
  arrayLength = jsonData.executed_steps.length;
  for (var i = 0; i < arrayLength; i++) {
    // See if test case matches
    if (jsonData.executed_steps[i].step_number === testCaseIdentifier) {
      // See if local configuration matches remote
      var runSectionId = jsonData.executed_steps[i].run_section_id;
      if (testRunSections[runSectionId].selected_configuration === localConfiguration) {
        // If both applies, push to resulting array
        linkedTestCaseRunIds.push(jsonData.executed_steps[i].id);
      }
    }
  }
  return linkedTestCaseRunIds;
  //jscs:enable requireCamelCaseOrUpperCaseIdentifiers
}

function getTestRunSections(responseBody) {
  //jscs:disable requireCamelCaseOrUpperCaseIdentifiers
  var runSections = {};
  var arrayLength;
  var jsonBody = JSON.parse(responseBody);
  for (var i = 0; i < jsonBody.run_sections.length; i++) {
    runSections[jsonBody.run_sections[i].id] = jsonBody.run_sections[i];
    logger.debug('Found test run section %s using configuration \'%s\'',
      jsonBody.run_sections[i].id,
      jsonBody.run_sections[i].selected_configuration);
  }

  logger.debug('Found %s run sections in the current test run.', Object.keys(runSections).length);
  return runSections;
  //jscs:enable requireCamelCaseOrUpperCaseIdentifiers
}

function getTestRunIdByName(testRunIdentifier, runsBody) {
  var jsonData = JSON.parse(runsBody);
  var arrayLength;

  // Process passed test runs
  arrayLength = jsonData.runs.length;
  for (var i = 0; i < arrayLength; i++) {
    if (jsonData.runs[i].name === testRunIdentifier) {
      logger.debug('Found test run %s for name \'%s\'', jsonData.runs[i].id, testRunIdentifier);
      return jsonData.runs[i].id;
    }
  }
}

function baseUrl() {
  return util.format('https://%s.%s/%s/projects/%s',
    module.exports.options.name,
    module.exports.options.apiUrl,
    module.exports.options.apiVersion,
    module.exports.options.project
  );
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
