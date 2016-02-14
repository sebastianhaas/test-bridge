/**
 * Reporter plugin for karma-json-reporter.
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
  var jsonData = readTestReportJson('karmaReport.json');
  return extractTestCaseRuns(jsonData);
}

/**
 * Extracts all test runs that contain a valid test case reference.
 */
function extractTestCaseRuns(jsonData) {
  var detectedTestCaseRuns = [];
  var arrayLength;

  // Process passed test runs
  for (var browserId in jsonData.result) {
    var testCaseRuns = jsonData.result[browserId];
    logger.debug('Processing tests run in %s', jsonData.browsers[browserId].name);
    arrayLength = testCaseRuns.length;
    for (var i = 0; i < arrayLength; i++) {
      var testCaseRun = testCaseRuns[i];
      var linkedTestCases = parseTestCaseName(testCaseRun.description);
      if (linkedTestCases.length) {
        testCaseRun.linkedTestCases = linkedTestCases;
        testCaseRun.browser = getBrowserTypeFromName(jsonData.browsers[browserId].name);
        if (testCaseRun.skipped) {
          testCaseRun.result = '';
        } else {
          testCaseRun.result = testCaseRun.success ? 'passed' : 'failed';
        }
        testCaseRun.duration = testCaseRun.time;
        testCaseRun.err = testCaseRun.log;
        detectedTestCaseRuns.push(testCaseRun);
      }
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

 * @param testCaseName
 * @param pattern A regex that captures linked test cases. The pattern must return the actual test case identifier in
 *                the first capturing group, and will subsequently be applied on the test case name.
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

function getBrowserTypeFromName(name) {
  if (name.indexOf('Chrome') > -1) {
    return 'Chrome';
  } else if (name.indexOf('Chromium') > -1) {
    return 'Chrome';
  } else if (name.indexOf('Firefox') > -1) {
    return 'Firefox';
  } else if (name.indexOf('Opera') > -1) {
    return 'Opera';
  } else if (name.indexOf('Internet Explorer') > -1) {
    return 'Internet Explorer';
  } else if (name.indexOf('Safari') > -1) {
    return 'Safari';
  } else {
    return '';
  }
}
