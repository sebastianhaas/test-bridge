/**
 * test-bridge
 */
module.exports = {
  execute: execute,
  setLogLevel: setLogLevel
};

/*
 * Dependencies
 */
var log4js = require('log4js');
var logger = log4js.getLogger();
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
function execute(options, cb) {

  // Merge options with defaults and options file
  var rcOptions = getRCOptions();
  rcOptions = merge.recursive(defaultOptions, rcOptions);
  options = merge.recursive(rcOptions, options);

  // Inject plugins
  if (!injectPluginDependencies(options.ci, options.reporter, options.management)) {
    cb(new Error(), 0);
    return;
  }

  // Pass options to injected plugins
  reporter.options = options.reporterOptions;
  management.options = options.managementOptions;
  if (ci) {
    ci.options = options.cmdLineOptions;
  }

  // If enabled, get information from CI plugin
  if (ci) {
    var ciBranchName = ci.getBranchName();
    var ciBuildUrl = ci.getBuildUrl();
  }

  // If CI plugin enabled and flag set, extract test run name from current branch
  if (ci && options.extractTestRunFromBranchName) {
    management.testRunIdentifier = getTestRunFromBranch(ciBranchName, options.branchPattern);
    if (!management.testRunIdentifier) {
      logger.info('Current branch \'%s\' did not trigger a test repository update.', ciBranchName);
      cb(null, 0);
      return;
    } else {
      logger.info('Current branch \'%s\' triggered a test repository update for test run \'%s\'',
        ciBranchName, management.testRunIdentifier);
    }
  } else {
    if (!options.testRunIdentifier) {
      logger.error('If branch name extraction is not enabled, and/or no CI plugin enabled, you must specify the ' +
        'remote test run to be updated by name.');
      cb(new Error(), 0);
      return;
    }
    management.testRunIdentifier = options.testRunIdentifier;

    if(!ci && options.extractTestRunFromBranchName) {
      logger.warn('Option \'--extractTestRunFromBranchName\' has no effect without a CI plugin loaded. ' +
        'Using \'--testRun\' instead.');
    }
  }

  // Get local test case runs
  var localTestRuns = reporter.getTestRuns();

  // Update local test results in remote test management tool
  if (localTestRuns.length > 0) {
    management.updateTestCaseRuns(localTestRuns, cb);
  } else {
    logger.info('No local test results contained linked test cases.');
    cb(null, 0);
    return;
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
  if (reporterPluginName) {
    reporter = require('./reporters/' + reporterPluginName);
  } else {
    logger.error('No reporter plugin specified.');
    return false;
  }
  if (managementPluginName) {
    management = require('./management/' + managementPluginName);
  } else {
    logger.error('No management plugin specified.');
    return false;
  }

  // Optional plugins
  if (ciPluginName) {
    ci = require('./ci/' + ciPluginName);
  }
  return true;
}

function getRCOptions(file) {
  var rcOptions;
  var fs = require('fs');
  try {
    if (file) {
      rcOptions = JSON.parse(fs.readFileSync(file, 'utf8'));
    } else {
      rcOptions = JSON.parse(fs.readFileSync('./.testbridgerc', 'utf8'));
    }
  } catch (e) {
    logger.error('Failed to read .testbridgerc', err);
  }

  // Replace environmet variable placeholders
  fillEnvironmentVariablePlaceholders(rcOptions);

  return rcOptions;
}

function fillEnvironmentVariablePlaceholders(options) {
  // The pattern to search for
  var pattern = /\$\{([a-zA-Z_][a-zA-Z0-9_]*)\}/g;

  for (var property in options) {
    if (options.hasOwnProperty(property)) {
      if (typeof options[property] == 'object') {
        fillEnvironmentVariablePlaceholders(options[property]);
      } else {
        var match = pattern.exec(options[property]);
        if (match) {
          if (process.env[match[1]]) {
            logger.debug('Successfully replaced \'%s\' with value from environment variable.', options[property]);
            options[property] = process.env[match[1]];
          } else {
            logger.error('Failed to replace \'%s\' with value from environment variable.', options[property]);
          }
        }
        // Reset internal regexp index
        pattern.lastIndex = 0;
      }
    }
  }
}

function setLogLevel(logLevel) {
  log4js.configure({
    appenders: [
      {type: 'console'}
    ],
    levels: {
      '[all]': logLevel
    }
  });
}
