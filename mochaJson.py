import json, re

class MochaJsonImporter:

	def get_test_run_cases(self):
		"""
		Returns a dict of all test cases in the specified mocha run report file.
		"""
		test_run_cases = []
		with open("mochaTestResults.json") as json_file:
			json_object = json.load(json_file)

			for case_run in json_object['passes']:
				result = re.search('#(?P<test_case>TC[0-9]{2,})', case_run['title'])
				if result is not None:
					case_run['result'] = 'passes'
					case_run['test_case'] = result.group('test_case') # ??? Does that get all of them or just the first match
					test_run_cases.append(case_run)

			for case_run in json_object['pending']:
				result = re.search('#(?P<test_case>TC[0-9]{2,})', case_run['title'])
				if result is not None:
					case_run['result'] = 'pending'
					case_run['test_case'] = result.group('test_case') # ??? Does that get all of them or just the first match
					test_run_cases.append(case_run)

			for case_run in json_object['failures']:
				result = re.search('#(?P<test_case>TC[0-9]{2,})', case_run['title'])
				if result is not None:
					case_run['result'] = 'failed'
					case_run['test_case'] = result.group('test_case') # ??? Does that get all of them or just the first match
					test_run_cases.append(case_run)

		return test_run_cases