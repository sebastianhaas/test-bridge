/**
 * Reporter plugin for the default JSON reporter shipped with mocha.
 */

var log4js = require('log4js');
var logger = log4js.getLogger('reporterPlugin');

module.exports = {
  /**
  	 *  Returns an array of all test runs containing a linked test case.
   	 */
  getTestRuns: getTestRuns
};

function getTestRuns() {
  // Read file and extract relevant test runs.
  var jsonData = readTestReportJson('./tests/reporters/mochaJson/mochaTestResults.json');
  return extractTestCaseRuns(jsonData);
}

/**
 * Extracts all test runs that contain a valid test case reference.
 */
function extractTestCaseRuns(jsonData) {
  var detectedTestCaseRuns = [];
  var arrayLength;

  // Process passed test runs
  arrayLength = jsonData.passes.length;
  for (var i = 0; i < arrayLength; i++) {
    var testCaseRun = jsonData.passes[i];
    var linkedTestCases = parseTestCaseName(testCaseRun.title);
    if (linkedTestCases.length) {
      testCaseRun.linkedTestCases = linkedTestCases;
      testCaseRun.result = 'passed';
      detectedTestCaseRuns.push(testCaseRun);
    }
  }

  // Process pending test runs
  arrayLength = jsonData.pending.length;
  for (var i = 0; i < arrayLength; i++) {
    var testCaseRun = jsonData.pending[i];
    var linkedTestCases = parseTestCaseName(testCaseRun.title);
    if (linkedTestCases.length) {
      testCaseRun.linkedTestCases = linkedTestCases;
      testCaseRun.result = 'pending';
      detectedTestCaseRuns.push(testCaseRun);
    }
  }

  // Process failed test runs
  arrayLength = jsonData.failures.length;
  for (var i = 0; i < arrayLength; i++) {
    var testCaseRun = jsonData.failures[i];
    var linkedTestCases = parseTestCaseName(testCaseRun.title);
    if (linkedTestCases.length) {
      testCaseRun.linkedTestCases = linkedTestCases;
      testCaseRun.result = 'failed';
      detectedTestCaseRuns.push(testCaseRun);
    }
  }

  logger.debug('Found %d test executions containing identifiers.', detectedTestCaseRuns.length);
  return detectedTestCaseRuns;
}

function readTestReportJson(file) {
  var fs = require('fs');
  return JSON.parse(fs.readFileSync(file, 'utf8'));
}

/**
 * Returns the linked test cases for the given test case name.
 *
 * @param {string} testCaseName
 * @param {regex} pattern A regex that captures linked test cases. The pattern must return the actual test case
 *                         identifier in the first capturing group, and will subsequently be applied on the test case
 *                         name.
 */
function parseTestCaseName(testCaseName, pattern) {
  var linkedTestCases = [];

  // Use default if no pattern supplied
  if (!pattern) {
    pattern = /#(TC[0-9]{2,})/g;
  }

  var match = pattern.exec(testCaseName);
  while (match != null) {
    linkedTestCases.push(match[1]);
    match = pattern.exec(testCaseName);
  }

  logger.debug(
    'Found %s in test case \'%s\'',
    linkedTestCases.length ? 'identifiers ' + linkedTestCases : 'no identifiers',
    testCaseName
  );
  return linkedTestCases;
}
