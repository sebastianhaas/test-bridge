#!/usr/bin/env node

/**
 * Module dependencies.
 */

var program = require('commander');
var log4js = require('log4js');

program
  .version('0.0.1')
  .option('-v, --verbose', 'Verbose logging')
  .parse(process.argv);

var logger = log4js.getLogger();

if (program.verbose) {
  logger.setLevel('DEBUG');
  log4js.getLogger('ciPlugin').setLevel('DEBUG');
  log4js.getLogger('reporterPlugin').setLevel('DEBUG');
  log4js.getLogger('managementPlugin').setLevel('DEBUG');
}


// DI
// Reporter plugin
var reporter = require('./reporters/mochaJson');

// Test repository/management plugin
var management = require('./management/testlodge');
management.testRunIdentifier = 'v0.0.1';



// Get local test case runs and update them remotely
var localTestRuns = reporter.getTestRuns();
management.updateTestCaseRuns(localTestRuns);
