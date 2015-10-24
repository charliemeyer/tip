import os
import sys
import json
import urllib
import random
import jinja2
import webapp2
import urllib2
import logging

JINJA_ENVIRONMENT = jinja2.Environment(
    loader=jinja2.FileSystemLoader(os.path.dirname(__file__)),
    extensions=['jinja2.ext.autoescape'],
    autoescape=True)

class Question(object):
    def __init__(self, function_name, question_text, desc, test_cases):
        self.function_name = function_name
        self.question_text = question_text
        self.desc = desc
        self.test_cases = test_cases

FizzBuzz = Question(
             '''fizz_buzz(n)''',
             '''Write FizzBuzz.''',
             '''Write a program that and outputs the numbers 1 to n, but for the
numbers divisible by 3, print "Fizz", and all numbers divisible by 5, print "Buzz".''', 
            {1:"1",
             3:"1\n2\nFizz",
             5:"1\n2\nFizz\n4\nBuzz",
             15:"1\n2\nFizz\n4\nBuzz\nFizz\n7\n8\nFizz\nBuzz\n11\nFizz\n13\n14\nFizzBuzz",
             })

BinarySearch = Question(
             '''search(list, target)''',
             '''Search a sorted array for x as fast as possible.''',
             '''Given an array of sorted integers, return True if x is in the array,
and the string False otherwise. Example: [[1,2,6,8,10], 9] -> False''',
            ["[[[], 0],False]",
             "[[1], 1],True]",
             "[[1, 2, 3, 4], 3],True]",
             "[[1, 2, 6, 7, 8], 5],False]",
             "[[-3, -2], -2],True]"
             ])
ArraySum = Question(
             '''find_dupe(list)''',
             '''In an array with the numbers from 1 to n with one extra number, find the extra number.''',
             '''Given an unsorted array from 1 to n with one number repeating, find the extra number as
fast as possible. Example: [7,2,6,1,3,6,5,4] -> 6''',
            ["[[1,2,2],2]",
             "[[1,1],1]",
             "[[5,1,2,8,3,4,1,7,6],1]"
             ])
    
DemoQuestion = Question(
             '''print_n()''',
             '''Print the number n.''',
             '''Just print the number n.''',
            ["[1,1]",
             "[2,2]",
             "[6,6]"
             ])

DemoQuestion2 = Question(
             '''sum_arr(list)''',
             '''Sum the numbers in an array.''',
             '''Write a function that returns the sum of the array.''',
            ["[[1,2,2],5]",
             "[[1,1],2]",
             "[[5,1,2],8]"
             ])
    
questions = [
    FizzBuzz,
    BinarySearch,
    ArraySum
    ]

questions = [
    DemoQuestion,
    DemoQuestion2
    ]

class Test(webapp2.RequestHandler):
    def post(self):
        self.response.headers["Access-Control-Allow-Origin"] = "*"
        self.response.headers["Access-Control-Allow-Headers"] = "Origin, X-Requested-With, Content-Type, Accept"
        self.response.headers["Access-Control-Allow-Methods"] = "POST, GET, PUT, OPTIONS"
        self.response.headers['Content-Type'] = 'application/json'   
        url = "http://api.hackerrank.com/checker/submission.json"
        logging.warning(self.request.params)
        data = urllib.urlencode(self.request.params)
        logging.error(data)
        req = urllib2.Request(url, data)
        response = urllib2.urlopen(req)
        content = response.read()
        self.response.out.write(content)
        
class Questions(webapp2.RequestHandler):
    def get(self):
        global questions
        self.response.headers["Access-Control-Allow-Origin"] = "*"
        self.response.headers["Access-Control-Allow-Headers"] = "Origin, X-Requested-With, Content-Type, Accept"
        self.response.headers["Access-Control-Allow-Methods"] = "POST, GET, PUT, OPTIONS"
        self.response.headers['Content-Type'] = 'application/json'   

        def questions_to_json():
            random.shuffle(questions)
            output_list = []
            for q in questions:
                obj = {}
                obj['function_name'] = q.function_name
                obj['question'] = q.question_text
                obj['desc'] = q.desc
                obj['testcases'] = q.test_cases
                output_list.append(obj)
            return json.dumps(output_list)

        self.response.out.write(questions_to_json())

class Interview(webapp2.RequestHandler):
    def get(self):
        duration = self.request.get('duration', None)
        template = JINJA_ENVIRONMENT.get_template('interview.html')
        template_values = {'duration': 15}
        try:
            if duration:
                template_values['duration'] = int(duration)
        except:
            pass
        self.response.write(template.render(template_values))

class MainHandler(webapp2.RequestHandler):
    def get(self):
        template = JINJA_ENVIRONMENT.get_template('index.html')
        template_values = {}
        self.response.write(template.render(template_values))


app = webapp2.WSGIApplication([
    ('/test', Test),
    ('/questions.json', Questions),
    ('/interview', Interview),
    ('/', MainHandler)
], debug=True)

