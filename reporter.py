import json, os, sys, requests, re, mochaJson, testlodge, codeship

# Release
release = 'v0.0.1'

# Get settings from environment variables
try:
	name = os.environ['TESTLODGE_NAME']
	email = os.environ['TESTLODGE_EMAIL']
	password = os.environ['TESTLODGE_PASSWORD']
	project = os.environ['TESTLODGE_PROJECT']
except KeyError as err:
	print("Please set the environment variable {key}.".format(key=err))
	sys.exit(1)

api_version = os.getenv('TESTLODGE_API_VERSION', 'v1')
base_url = os.getenv('TESTLODGE_BASE_URL', 'api.testlodge.com')

branch_prefix = os.getenv('BRANCH_PREFIX', 'release')
mocha_result_json = os.getenv('MOCHA_RESULT_JSON', 'mochaTestResults.json')


# Actual script

# Get the local test run report
mocha = mochaJson.MochaJsonImporter()
test_case_runs = mocha.get_test_run_cases()

# Get branch from CI
codeship = codeship.Codeship()
branch_name = codeship.get_branch()
release_name = branch_name.split(branch_prefix, 1)[1]

# Update test cases runs in remote test repository
testlodge = testlodge.TestLodge(name=name, email=email, password=password, project=project)
testlodge.update(test_case_runs, release)