# ci-automation
A bridge between your automated test runs and your test repository.

This script will parse a report generated by a local run of your tests, and publish results to your test repository.
When included in your CI build, every time you push to a release branch, this script will update the test run cases in the respective test run in your test management tool. 

## Example
```
$ mocha # Run your unit tests to generate your report
$ ./reporter.sh
```

This will parse the report generated by mocha, and update all related test cases in your test management tool.

## Supported reporters and test management tools
### CI support
* Codeship
### Reporters
* Mocha JSON reporter ()
* Karma JSON reporter ()
### Test management tools
* TestLodge

## How does this work
Tests in code are linked with test cases in your repository by searching for occurrences of a certain pattern.
For instance, a test case like this
```
describe('Array', function() {
  describe('#indexOf()', function () {
    it('should return -1 when the value is not present #TC02', function () {
      assert.equal(-1, [1,2,3].indexOf(5));
      assert.equal(-1, [1,2,3].indexOf(0));
    });
  });
});
```
will update a test case in your test management tool labeled `TC02`.