define([
        "dojo/_base/declare",
        "dojo/string",
        "util/lodash"
    ], function (
        declare,
        string,
        _
    ) {

    /**
     *  A Phrase is something that can be said, and is represented
     *  nondeterministically.  Conceptually, a phrase is one of:
     *  <ul>
     *      <li>A string</li>
     *      <li>A list of (sub-)phrases to be combined</li>
     *      <li>A list of phrases to be chosen from</li>
     *  </ul>
     *  A phrase also has context, which evaluates variables within the phrase.
     *  When the phrase is evaluated, the context will be searched to fill in
     *  variables of the form ${var}.  Context values may be either phrases
     *  or functions that evaluate to phrases.
     *  @class
     *  @name  Phrase
     *  @example
     *      // Simple usage of the three types of phrase
     *      var word = new Phrase("hello");
     *      word.toString();            // --> "hello" (deterministic)
     *
     *      var poem = new Phrase([
     *          "Two roads diverged in a yellow wood,\n",
     *          "And sorry I could not travel both\n",
     *          "And be one traveler, long I stood\n",
     *          "And looked down one as far as I could\n",
     *          "To where it bent in the undergrowth..."
     *      ]);
     *      poem.toString();           // --> The poem stanza (deterministic)
     *
     *      var feeling = new Phrase({
     *          "choose": ["happy", "sad", "concerned", "anxious"]
     *      });
     *      feeling.toString();        // --> One of the states of mind
     *                                 //     (nondeterministic)
     *
     *  @example
     *  // More realistic usage
     *      var randomSentence = new Phrase([
     *          {"choose": ["The", "A"]}, " ",
     *          {"choose": ["man", "woman", "child"]}, " ",
     *          {"choose": [
     *              {"choose": ["walks", "walked", "will walk"]},
     *              {"choose": ["drives", "drove", "will drive"]},
     *              {"choose": ["rides", "rode", "will ride"]}
     *          ]},
     *          " from ",
     *          {"choose": ["school", "work", "home"]}
     *      ]);
     *      randomSentence.toString(); // --> Some example values:
     *                                 //    "The man will walk from home"
     *                                 //    "A woman walks from school"
     *                                 //    "A child drove from home"
     *
     *  @example
     *  // Using context variables
     *      var greet = new Phrase([
     *          {"choose": ["Greetings", "Hello", "Wazzup"]},
     *          " ${name}, I am ",
     *          {"choose": ["happy", "glad", "ecstatic"]},
     *          " to meet you!"
     *      ]);
     *
     *      greet.toString();      // --> Error, context cannot resolve ${name}
     *      greet.withContext({"name": "Emily"}).toString();
     *                             // --> Possible value:
     *                             // "Hello Emily, I am ecstatic to meet you!"
     *      greet.withContext({"name": "Lisa"}).toString();
     *                             // --> Possible value:
     *                             // "Wazzup Lisa, I am glad to meet you!"
     *
     *  // Context in constructor, and with functions and phrases as values.
     *      var intro = new Phrase("${greeting}, my name is ${name}", {
     *          "name": {"choose": ["Colin", "Samantha", "Julius", "Julia"]},
     *          "greeting": function () {
     *              var hour = new Date().getHours();
     *              if (hour < 12) {
     *                  return "Good morning";
     *              } else if (hour < 17) {
     *                  return "Good afternoon";
     *              } else {
     *                  return "Good evening";
     *              }
     *          }
     *      });
     *      intro.toString();       // --> Possible value:
     *                              //   "Good evening, my name is Julia"
     *      intro.withContext({
     *          "greeting": "Hi",
     *          "name": ["Bill", " ", "Gates"]
     *      }).toString();          // --> Makes new object with new context:
     *                              //  returns "Hi, my name is Bill Gates"
     *
     *  @example
     *  // Recursive definitions can lead to errors
     *      new Phrase("${a}").withContext({"a": "${a}"}).toString();
     *                      // --> Stack overflow / out of memory
     */
    var Phrase = declare(null, {

        /**
         *  Constructs a Phrase object from an abstract representation.
         *  @constructor
         *  @function
         *  @param {string|Array|Object} phrase A representation of a phrase.
         *      Such a representation is defined recursively as one of:
         *      <ul>
         *          <li>A string literal</li>
         *          <li>An array of phrase representations</li>
         *          <li>An object with key "choose", whose value is an array of
         *              phrase representations</li>
         *      </ul>
         *      These will be mapped directly to the corresponding types in the
         *      abstract definition of a phrase.<br />
         *      Note that modifying the object passed in <strong>will</strong>
         *      modify the representation of the Phrase object as well.<br />
         *      Sequences of the form ${name} within a phrase will be
         *      substituted with a value based on the phrase's context.
         *  @param {Object} [context] The context in which to bind the phrase.
         *      Context is an object with key-value pairs, where substrings of
         *      the form ${key} are replaced with the value context[key].
         *      The value of context[key] should be either a phrase, or a
         *      function that returns a phrase.
         *  @memberOf Phrase.prototype
         */
        constructor: function (phrase, context) {
            if (phrase instanceof Phrase) {
                this._phrase = phrase._phrase;
            } else {
                this._phrase = phrase || "";
            }
            this._context = context || {};
        },

        /**
         *  Converts the phrase to a string by evaluating it.  Evaluation
         *  simply consists of making a choice on parts of the phrase that
         *  have options, and combining sub-phrases.  Each time this
         *  method is called, new nondeterministic choices are made.  Hence,
         *  calling this method multiple times on the same phrase may result
         *  in different output strings each time if the phrase contains any
         *  nondeterministic choices.
         *  @memberOf Phrase.prototype
         *  @return {string}
         */
        toString: function () {
            return this._phraseToString(this._phrase);
        },

        /**
         *  Creates a new Phrase object with the same phrase structure, but
         *  bound to this new context instead.
         *  @memberOf Phrase.prototype
         *  @param  {Object} context The context for the new phrase.
         *  @return {Phrase}
         */
        withContext: function (context) {
            return new Phrase(this, context);
        },

        /**
         *  Puts key-value pairs from newContext into the current context.
         *  The new context will have the same properties as newContext, plus
         *  any properties of the old context that were not overridden by
         *  newContext.
         *  @memberOf Phrase.prototype
         *  @param  {Object} newContext
         *  @return {Phrase} Returns the Phrase for easy chaining.
         */
        extendContext: function (newContext) {
            this._context = _.extend(this._context, newContext);
            return this;
        },

        /**
         *  Modifies the context of this Phrase object.
         *  @memberOf Phrase.prototype
         *  @param  {Object} newContext
         *  @return {Phrase} Returns the Phrase for easy chaining.
         */
        changeContext: function (newContext) {
            this._context = newContext;
            return this;
        },

        /**
         *  Recursively generates a phrase from the internal phrase.
         *  @private
         *  @memberOf Phrase.prototype
         *  @param  {string|Array|Object} phrase The phrase to convert to
         *      a string.
         *  @return {string}
         *  @todo  Maybe this could be a static function?  So clients could
         *      evaluate a phrase without instantiating one.
         */
        _phraseToString: function (phrase) {
            if (phrase instanceof Phrase) {
                return phrase.toString();
            } else if (_.isArray(phrase)) {
                return _.reduce(phrase, function (soFar, current) {
                    return soFar + this._phraseToString(current);
                }, "", this);
            } else if (_.isObject(phrase) && _.isArray(phrase["choose"])) {
                return this._phraseToString(_.sample(phrase["choose"]));
            } else {
                return string.substitute(phrase, this._context, function (v) {
                    if (_.isFunction(v)) {
                        v = v.call(this._context, phrase);
                    }
                    return this._phraseToString(v);
                }, this);
            }
        }
    });

    return Phrase;
});
