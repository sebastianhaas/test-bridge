#!/bin/sh
# Adding deployment event to Bugsnag
# http://notify.bugsnag.com/deploy
#
# You have to set the following environment variables in your project configuration
#
# * TESTLODGE_NAME
# * TESTLODGE_EMAIL
# * TESTLODGE_PASSWORD
# * TESTLODGE_PROJECT
#
# You have the option to define the environment variables below, else defaults will be applied.
# For more details on Default Environment Variables (those starting with "CI_"), please visit:
# https://codeship.com/documentation/continuous-integration/set-environment-variables/
#
# * TESTLODGE_RELEASE_BRANCH_PREFIX=release
# * MOCHA_RESULT_JSON=mochaTestResults.json
#
# You can either add those here, or configure them on the environment tab of your
# project settings.
python3 reporter.py