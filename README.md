# test-bridge
Connect your automated test runs with your test repository.

This script will parse a report generated by a local execution of your tests, and publish results to your test repository.
When included in your CI build, every time you push to, e.g., your release branch, this script will update the respective test case runs in
your test management tool.

## Example
```shell
$ karma # Run your unit tests to generate your report
$ test-bridge --reporter karmaJson --management testlodge --testRun NextRelease
```

This will parse the report generated by `karma`, and update all related test cases for the specified test run ("NextRelease") in your test
management tool.

## Supported reporters and test management tools

### CI support
* Codeship
* Travis CI (PR welcome!)

### Reporters
* Mocha JSON reporter ([Mocha reporters](https://mochajs.org/#reporters))
* Karma JSON reporter ([karma-json-reporter](https://www.npmjs.com/package/karma-json-reporter))
* JUnit (PR welcome!)

### Test management tools
* TestLodge

## How does this work

### Reporter plugins
Reporter plugins process results from local test executions. They will typically parse a report and search for test cases that are linked
with your test repository. Tests in code are linked with test cases in your repository by searching for occurrences of a certain pattern.
For instance, a test case like this
```javascript
describe('Array', function() {
  describe('#indexOf()', function () {
    it('should return -1 when the value is not present #TC02', function () {
      assert.equal(-1, [1,2,3].indexOf(5));
      assert.equal(-1, [1,2,3].indexOf(0));
    });
  });
});
```
will update a test case labeled `TC02` in your test management tool.

### CI Plugins
When test-bridge is included in your CI builds, it can retrieve information about the current build using CI plugins. For instance, when
using git-flow, you can configure test-bridge to only update test results for commits on the release branch.
You can tell test-bridge on which branches to trigger by specifiying a regex pattern. This will also be used to determine the name of the
test run to be updated in your test management tool. The default pattern that will be used is https://regex101.com/r/kS8bR1/1.

For example,
```shell
# CI triggered on branch 'release/v0.5.0'
$ test-bridge --reporter karmaJson --management testlodge --ci codeship --extractTestRunFromBranchName
# test-bridge will update the test run named 'v0.5.0' in TestLodge
```
extracts the test run name that will be passed to testlodge later on, using the current branch.

### Test management tool plugins
Test management tool plugins take the result from reporter plugins and update all test case runs with the results of the latest test
execution.

### Command line usage
```shell
$ test-bridge --help

  Usage: test-bridge [options]

  Options:

    -h, --help                                    output usage information
    -V, --version                                 output the version number
    -c, --ci <pluginName>                         The CI plugin to use
    -r, --reporter <pluginName>                   The reporter plugin to use
    -m, --management <pluginName>                 The management plugin to use
    -t, --testRun <identifier>                    The test run to be updated by the management plugin
    -e, --extractTestRunFromBranchName [pattern]  Extract test run pattern from branch name. Optionall extraction regex. Only available with a CI plugin.
    -v, --verbose                                 Verbose logging
```

### Configuration
test-bridge requires a filed named `.testbridgerc` in the root directory. This file can be used to pass additional configuration to plugins
that can't be set via command line arguments. If you are using test-bridge via it's API, you have to pass options to test-bridge's main
function.

#### Environment variable placeholders
If you don't want to commit `.testbridgerc` to your source control while holding account details for your test management tool, you can
use placeholders that will be subsituted at runtime. E.g., in the following `.testbridgerc`
```json
{
  "managementOptions": {
    "name": "myProject",
    "project": "12345",
    "email": "${TESTLODGE_LOGIN_EMAIL}",
    "password": "${TESTLODGE_LOGIN_PASSWORD}",
  }
}
```
`${TESTLODGE_LOGIN_EMAIL}` as well as `${TESTLODGE_LOGIN_PASSWORD}` will be replaced by the respective environment variables.

## Grunt & Gulp
If you want to include test-bridge to your existing build tool, you can just write a simple task that makes a call to test-bridge's API. I
already started writing a [grunt task](https://github.com/sebastianhaas/grunt-test-bridge).