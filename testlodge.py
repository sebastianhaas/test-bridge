import json, os, sys, requests, re

class TestLodge:

	def __init__(self, name, email, password, project, api_version='v1', base_url='api.testlodge.com'):
		self.name = name
		self.email = email
		self.password = password
		self.project = project
		self.api_version = api_version
		self.base_url = base_url
		self.url = 'https://{name}.{base_url}/{api_version}/projects/{project}'.format(name=self.name, base_url=self.base_url, api_version=self.api_version, project=self.project)

	def update(self, runs, release):
		# Get the test run corresponding with the given release
		test_run_id = self._request_test_run_id(release)
		test_run_cases = self._request_test_run_cases(test_run_id)

		for local_run_result in runs:
			# Get corresponding test case runs for the given test case
			ids = self._query_test_run_case_ids(test_run_cases, local_run_result['test_case'])

			# Update all related test case runs
			for id in ids:
				self._update_test_run_case(test_run_id, id, local_run_result)

	def _update_test_run_case(self, test_run_id, test_run_case_id, local_run_result):
		"""
		Updates the test case run in the remote repository with the results of the local test run.
		"""
		data = {'executed_step': {}}
		data['executed_step']['passed'] = 1 if local_run_result['result'] == 'passes' else 0
		error_message = "" if not local_run_result['err'] else "Error:\n{error}".format(error=json.dumps(local_run_result['err'], sort_keys=True, indent=4, separators=(',', ': ')))
		data['executed_step']['actual_result'] = "Duration: {duration}ms\n{errors}".format(duration=local_run_result['duration'], errors=error_message)

		r = requests.patch("{}/runs/{}/executed_steps/{}.json".format(self.url, test_run_id, test_run_case_id), json=data, auth=(self.email, self.password))
		print(r.text)

	def _query_test_run_case_ids(self, test_run_cases, test_case):
		"""
		Returns all ids of test cases in the given dict that match the specified test case.
		"""
		test_run_case_ids = []
		for test_run_case in test_run_cases:
			if test_run_case['step_number'] == test_case:
				test_run_case_ids.append(test_run_case['id'])
		return test_run_case_ids

	def _request_test_run_cases(self, test_run_id):
		"""
		Returns a dict containing all test cases in the given test run.
		"""
		r = requests.get("{}/runs/{}/executed_steps.json".format(self.url, test_run_id), auth=(self.email, self.password))
		return r.json()['executed_steps'] # TODO pagination

	def _request_test_run_id(self, name):
		"""
		Returns the test run id for the given name.
		"""
		r = requests.get("{}/runs.json".format(self.url), auth=(self.email, self.password))
		for test_run in r.json()['runs']: # TODO pagination
			if test_run['name'] == name:
				return test_run['id']
