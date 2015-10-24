import os
import sys
import json
import jinja2
import webapp2

JINJA_ENVIRONMENT = jinja2.Environment(
    loader=jinja2.FileSystemLoader(os.path.dirname(__file__)),
    extensions=['jinja2.ext.autoescape'],
    autoescape=True)

class Question(object):
    def __init__(self, question_text, test_cases):
        self.question_text = question_text
        self.test_cases = test_cases

class Questions(webapp2.RequestHandler):
    def get(self):
        self.response.headers['Content-Type'] = 'application/json'   
        questions = ["How fast is sorting?", "How slow is sorting?", "How slow are we at coding?"]
        self.response.out.write(json.dumps(questions))

class Interview(webapp2.RequestHandler):
    def get(self):
        template = JINJA_ENVIRONMENT.get_template('interview.html')
        template_values = {'question': "How fast is sorting?"}
        self.response.write(template.render(template_values))

class MainHandler(webapp2.RequestHandler):
    def get(self):
        template = JINJA_ENVIRONMENT.get_template('index.html')
        template_values = {}
        self.response.write(template.render(template_values))


app = webapp2.WSGIApplication([
    ('/questions.json', Questions),
    ('/interview', Interview),
    ('/', MainHandler)
], debug=True)
