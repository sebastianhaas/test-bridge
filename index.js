/**
 * test-bridge
 */
module.exports = {
  execute: execute,
};

/*
 * Dependencies
 */
 var logger = require('log4js').getLogger();
 var merge = require('merge');

/*
 * Plugins
 */
 var ci;
 var reporter = {};
 var management;

/*
 * Default configuration
 */
var defaultOptions = {
  extractTestRunFromBranchName: false,
  branchPattern: /release\/(v\d+\.\d+\.\d+)/g
};


/**
 * Main program
 */
function execute(options) {

  // Merge options with defaults and options file
  var rcOptions = getRCOptions();
  rcOptions = merge(defaultOptions, rcOptions);
  options = merge(rcOptions, options);

  // Inject plugins
  injectPluginDependencies(options.ci, options.reporter, options.management);

  // Pass options to injected plugins
  reporter.options = options.reporterOptions;
  management.options = options.managementOptions;
  if(ci) {
    ci.options = options.cmdLineOptions;
  }

  // If enabled, get information from CI plugin
  if(ci) {
    var ciBranchName = ci.getBranchName();
    var ciBuildUrl = ci.getBuildUrl();
  }

  // If CI plugin enabled and flag set, extract test run name from current branch
  if (ci && options.extractTestRunFromBranchName) {
    management.testRunIdentifier = getTestRunFromBranch(ciBranchName, options.branchPattern);
    if (!management.testRunIdentifier) {
      logger.info('Current branch \'%s\' did not trigger a test repository update.', ciBranchName);
      process.exit();
    } else {
      logger.info('Current branch \'%s\' triggered a test repository update for test run \'%s\'',
        ciBranchName, management.testRunIdentifier);
    }
  } else {
    if(!options.testRunIdentifier) {
      logger.error('If branch name extraction is not enabled, and/or no CI plugin enabled, you must specify the ' +
        'remote test run to be updated by name.');
      process.exit(1);
    }
    management.testRunIdentifier = options.testRunIdentifier;
  }

  // Get local test case runs
  var localTestRuns = reporter.getTestRuns();

  // Update local test results in remote test management tool
  if (localTestRuns.length > 0) {
    management.updateTestCaseRuns(localTestRuns);
  } else {
    logger.info('No local test results contained linked test cases.');
    process.exit();
  }
}

function getTestRunFromBranch(branchName, pattern) {
  var match = pattern.exec(branchName);
  if (match != null) {
    return match[1];
  } else {
    return false;
  }
}

/**
 * Injects plugins
 */
function injectPluginDependencies(ciPluginName, reporterPluginName, managementPluginName) {
  // Required plugins
  reporter = require('./reporters/' + reporterPluginName);
  management = require('./management/' + managementPluginName);

  // Optional plugins
  if(ciPluginName) {
    ci = require('./ci/' + ciPluginName);
  }
}

function getRCOptions(file) {
  var rcOptions;
  var fs = require('fs');
  if(file) {
    return JSON.parse(fs.readFileSync(file, 'utf8'));
  } else {
    return JSON.parse(fs.readFileSync('./.testbridgerc', 'utf8'));    
  }
  return rcOptions;
}