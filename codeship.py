import os, sys

class Codeship:
	"""
	Retrieves environment variables available during a codeship build.

	Name 					Value
	CI 						true
	CI_BUILD_NUMBER 		ID of the build in our service
	CI_BUILD_URL 			URL of the build
	CI_PULL_REQUEST 		false
	CI_BRANCH 				Branch of the build
	CI_COMMIT_ID 			Commit Hash of the build
	CI_COMMITTER_NAME 		Name of the committer
	CI_COMMITTER_EMAIL 		Email of the committer
	CI_COMMITTER_USERNAME 	Username of the commiter in their SCM service
	CI_MESSAGE 				Message of the last commit for that build
	CI_NAME 				codeship
	"""

	def __init__(self):
		try:
			self.ci = os.environ['CI']
			self.build_number = os.environ['CI_BUILD_NUMBER']
			self.build_url = os.environ['CI_BUILD_URL']			
			self.pull_request = os.environ['CI_PULL_REQUEST']
			self.branch = os.environ['CI_BRANCH']
			self.commid_id = os.environ['CI_COMMIT_ID']
			self.committer_name = os.environ['CI_COMMITTER_NAME']			
			self.committer_email = os.environ['CI_COMMITTER_EMAIL']
			self.committer_username = os.environ['CI_COMMITTER_USERNAME']
			self.message = os.environ['CI_MESSAGE']
			self.name = os.environ['CI_NAME']		
		except KeyError as err:
			print("Please set the environment variable {key}.".format(key=err))
			sys.exit(1)

	def get_branch(self):
		return self.branch
