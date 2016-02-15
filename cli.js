#!/usr/bin/env node

/**
 * Module dependencies.
 */

var testBridge = require('./index');
var program = require('commander');
var log4js = require('log4js');
var logger = log4js.getLogger();

/*
 * Configuration
 */
var cmdLineOptions = {};

program
  .version('0.0.1')
  .option('-c, --ci <pluginName>', 'The CI plugin to use')
  .option('-r, --reporter <pluginName>', 'The reporter plugin to use')
  .option('-m, --management <pluginName>', 'The management plugin to use')
  .option('-t, --testRun <identifier>', 'The test run to be updated by the management plugin')
  .option('-e, --extractTestRunFromBranchName [pattern]',
    'Extract test run pattern from branch name. Optionall extraction regex. Only available with a CI plugin.')
  .option('-v, --verbose', 'Verbose logging')
  .parse(process.argv);

if (program.ci) {
  cmdLineOptions.ci = program.ci;
}

if (program.reporter) {
  cmdLineOptions.reporter = program.reporter;
} else {
  logger.error('No reporter plugin specified.');
  process.exit(1);
}

if (program.management) {
  cmdLineOptions.management = program.management;
} else {
  logger.error('No management plugin specified.');
  process.exit(1);
}

if (program.extractTestRunFromBranchName) {
  cmdLineOptions.extractTestRunFromBranchName = true;
  if (typeof program.extractTestRunFromBranchName === 'string' ||
    program.extractTestRunFromBranchName instanceof String) {
    cmdLineOptions.branchPattern = new RegExp(program.extractTestRunFromBranchName, 'g');
  }
}

if (program.testRun) {
  cmdLineOptions.testRunIdentifier = program.testRun;
}

if (program.verbose) {
  logger.setLevel('DEBUG');
  log4js.getLogger('ciPlugin').setLevel('DEBUG');
  log4js.getLogger('reporterPlugin').setLevel('DEBUG');
  log4js.getLogger('managementPlugin').setLevel('DEBUG');
}

// Actual code
testBridge.execute(cmdLineOptions);
