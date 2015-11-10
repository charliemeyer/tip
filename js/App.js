define([
        "dojo/_base/declare",
        "dojo/_base/lang",
        "dojo/Evented",
        "dojo/Deferred",
        "dojo/promise/all",
        "lib/lodash"
    ], function (
        declare,
        lang,
        Evented,
        Deferred,
        all,
        _
    ) {

    function variadicNew(Constructor, args) {
        return new (Function.prototype.bind.apply(Constructor, [Constructor].concat(args)))();
    }

    /**
     *  An App is the controller for an entire application.  It instantiates
     *  the top-level components of an application and connects them
     *  according to its configuration.<br /><br />
     *  An App has three main parts to it:<br /><br />
     *  <h4>Components</h4>
     *  <p>A component is any object in the application.  It may be set up
     *  to communicate with other objects, and should follow the few
     *  restrictions of an {@link App~Component} type.</p>
     *  <h4>Events</h4>
     *  <p>Events are messages broadcast during the runtime of the application.
     *  An event can be sent by any component, and listened for by any
     *  component.  The sender of the event may send arguments, which will be
     *  passed to all listeners.</p>
     *  <h4>Services</h4>
     *  <p>Services are functions from one component available for use by any
     *  other component.</p>
     *  @class
     *  @name  App
     *  @extends dojo.Evented
     */
    /**
     *  @typedef {Object} App~Component
     *  @property {Array|function():Array} [services] The services the component will
     *      make use of, either as an array or a function that returns an array.
     *      Each service should either be an object with keys "name" and "source",
     *      or an array of size 2.  "name", or the first element, should be a string
     *      representing the name to make the service available under.  "source",
     *      or the second array element, should be a string representing the name
     *      of the service requested.
     *  @property {Array|function():Array} [events] The events the component will
     *      emit, either as an array or a function that returns an array.
     *      Each event should either be an object with keys "name" and "source",
     *      or an array of size 2.  "name", or the first element, should be a string
     *      representing the name to give the event-emitting method.  "source",
     *      or the second array element, should be a string representing the name
     *      of the event it should emit.
     *  @property {Object} [__app__] Settings that override the default names of
     *      component methods.  Not normally needed, unless the component is already
     *      using properties "services" or "events" for something.
     *  @property {string} [__app__.services] The key to use instead of "services".
     *  @property {string} [__app__.events] The key to use instead of "events".
     */
    var App = declare([Evented], {

        COMPONENTS_KEY: "components",
        EVENTS_KEY: "events",
        SERVICES_KEY: "services",
        APP_SETTINGS: "__app__",

        CONSTRUCTOR_PATH: "create",
        CONSTRUCTOR_PARAMS: "params",
        COMPONENT_CONNECT: "connect",
        COMPONENT_DATA: "data",
        DATA_LOAD: "load",
        DATA_JSON: "json",
        DATA_LITERAL: "literal",

        /**
         *  Represents the configuration of the application, including
         *  <ul>
         *      <li>All components and how to set them up</li>
         *      <li>All events and which components are listening for them</li>
         *      <li>All services and which components are offering them</li>
         *  </ul>
         *  @typedef {Object} App~Config
         *  @property {Object.<string, App~ComponentConfig>} components An object
         *      whose keys are the names of each component, with value the
         *      component's configuration.
         *  @property {Object.<string, string[]>} events An object whose keys are
         *      names of events in the application, and whose value is an array
         *      of event listeners, each a string of the form "component.methodName".
         *  @property {Object.<string, string>} services An object whose keys are
         *      names of services in the application, and whose value is a string
         *      representing the function providing the service, of the form
         *      "component.methodName".
         */
        /**
         *  Represents the configuration of a single component, namely how to
         *  set it up.
         *  @typedef {Object} App~ComponentConfig
         *  @property {string} create The path of the module with the class's
         *      constructor, which will be invoked to create the class.
         *  @property {Array} [params] Parameters to be passed to the constructor.
         *      If only one non-array parameter is passed, it needn't be in
         *      an array.
         *  @property {Object.<string, App~DataConfig>} [data] Data to put in as
         *      properties of the component after its creation, but before the
         *      app is started.  Keys are property names, values specify what
         *      to assign to that property.
         *  @property {Object.<string, string>} [connect] Other components to
         *      connect this component to.  The key is the property to assign
         *      the component reference to; the value is the name of the component.
         *      Because of the dependencies introduced by too many connections,
         *      this attribute should be used SPARINGLY.
         */
        /**
         *  Represents a single piece of data to be evaluated and used as a
         *  property of a component.  A DataConfig object should have exactly
         *  one of the following keys -- it is an error to have none, and
         *  behavior is undefined if there is more than one.
         *  @typedef {Object} App~DataConfig
         *  @property {string} [load] A module to load, the return value of which
         *      will be the data to be used.
         *  @property {string} [json] A JSON file to load and parse, the value
         *      of which will be the data to be used.
         *  @property {*} [literal] A literal value like a number or a string,
         *      which will itself be the data to be used.
         */
        /**
         *  @constructor
         *  @function
         *  @memberof App.prototype
         *  @param {App~Config} config The configuration of the App.
         *  @todo Add ways of extending the configuration.  This is basically
         *      appending the arrays of new config objects onto the old one.
         */
        constructor: function (config) {
            this.config = config || {};
            this._components = {};
            this._services = {};
        },

        /**
         *  Retrieves a component by name.
         *  @memberof App.prototype
         *  @param  {string} name The name of the component.
         *  @return {App~Component}
         */
        getComponent: function (name) {
            return _.get(this._components, name);
        },

        /**
         *  Starts up the app, loading and initializing all components and
         *  setting up all connections.
         *  @memberof App.prototype
         *  @return {dojo.Deferred} Will be resolved when the app is all set
         *      up and ready to go.  The resolved value will be the app itself.
         */
        start: function () {
            var self = this;
            var started = new Deferred();
            function onErr(e) {
                started.reject(e, true);
            }
            this._loadAllComponents().then(function (components) {
                self._completeAllComponents().then(function () {
                    self._loadAllServices();
                    self._connectAllServices();
                    self._connectAllEvents();
                    self._connectAllEventListeners();
                    started.resolve(self, true);
                }, onErr);
            }, onErr);
            return started;
        },

        /**
         *  Loads all components, also setting them to _components.
         *  @private
         *  @memberof App.prototype
         *  @return {dojo.Deferred} Will be resolved when all components
         *      are loaded.  The resolved value is the _components object.
         */
        _loadAllComponents: function () {
            var componentsLoaded = _.mapValues(this.config[this.COMPONENTS_KEY],
                function (data) {
                return this._loadComponent(data[this.CONSTRUCTOR_PATH],
                    data[this.CONSTRUCTOR_PARAMS])
            }, this);
            var self = this;
            return all(componentsLoaded).then(function (components) {
                return self._components = components;
            });
        },

        /**
         *  @private
         *  @memberof App.prototype
         *  @param  {string} path The path of the module containing the
         *      component's constructor.
         *  @param  {Array|*} [params] Parameters to send to the constructor
         *      (if just one, needn't be an array).
         *  @return {dojo.Deferred} Will be resolved when the component is
         *      loaded.  The resolved value is the component object.
         */
        _loadComponent: function (path, params) {
            if (!_.isArray(params)) {
                if (params) {
                    params = [params];
                } else {
                    params = [];
                }
            }
            var component = new Deferred();
            require([path], function (Constructor) {
                try {
                    component.resolve(variadicNew(Constructor, params), true);
                } catch (e) {
                    component.reject("Failed to construct component from  " + path
                        + " constructor with arguments [" + params.join(", ")+ "]",
                        true);
                }

            });
            return component;
        },

        /**
         *  Adds data to all components based on their configuration.
         *  @private
         *  @memberof App.prototype
         *  @return {dojo.Deferred} Will be resolved when the component
         *      is completed, ie. all properties set as described in the
         *      configuration.  The resolved value is the app.
         *  @todo Components can probably be filled immediately after they're LOADED?  This could
         *      potentially be slightly faster, though would require some reorganization.
         *      Then you don't have to wait for all components to be loaded.  You still have to
         *      wait to load all components before you can connect them though.  The dependencies
         *      are: each fill waits for each load; connect waits for all loads; we're done
         *      when everything is filled and everything is connected.
         */
        _completeAllComponents: function () {
            var self = this;
            var completed = new Deferred();
            function onErr(e) {
                completed.reject(e, true);
            }
            this._fillAllComponents().then(function () {
                try {
                    self._connectAllComponents();
                    completed.resolve(self, true);
                } catch (e) {
                    onErr(e);
                }
            }, onErr);
            return completed;
        },

        /**
         *  Fills all components with data as specified in their configuration.
         *  @private
         *  @memberof App.prototype
         *  @return {dojo.Deferred} Will be resolved when all components are
         *      filled.  Resolved value is an object mapping each
         *      component to its resolved values.
         */
        _fillAllComponents: function() {
            var componentsDone = _.mapValues(this.config[this.COMPONENTS_KEY],
                function (data, name) {
                return this._fillComponent(this._components[name],
                    data[this.COMPONENT_DATA], name);
            }, this);
            return all(componentsDone);
        },

        /**
         *  @private
         *  @memberof App.prototype
         *  @param  {App~Component} component The component to fill.
         *  @param  {Object.<string, App~DataConfig>} data Data specifying
         *      how to fill the object.
         *  @param  {string} [componentName] The name of the component (for
         *      better error reporting).
         *  @return {dojo.Deferred} Will be resolved when all attributes
         *      specified by the configuration are loaded into the component.
         *      Resolved value is a map of keys to resolved values put
         *      into the component.
         */
        _fillComponent: function (component, data, componentName) {
            var connections = _.mapValues(data, function (howToMake, key) {
                var connected = new Deferred();
                if (howToMake[this.DATA_LOAD]) {
                    require([howToMake[this.DATA_LOAD]], function (val) {
                        component[key] = val;
                        connected.resolve(val, true);
                    });
                } else if (howToMake[this.DATA_JSON]) {
                    require(["dojo/text!" + howToMake[this.DATA_JSON]], function (val) {
                        component[key] = JSON.parse(val);
                        connected.resolve(component[key], true);
                    })
                } else if (howToMake[this.DATA_LITERAL]) {
                    component[key] = howToMake[this.DATA_LITERAL];
                    connected.resolve(component[key], true);
                } else {
                    connected.reject("Unrecognized value type for property " + key
                            + " of component " + componentName ? componentName : "", true);
                }
                return connected;
            }, this);
            return all(connections);
        },

        /**
         *  Resolves all connections specified between components in
         *  the configuration.
         *  @private
         *  @memberof App.prototype
         */
        _connectAllComponents: function () {
            _.each(this.config[this.COMPONENTS_KEY], function (data, name) {
                this._connectComponent(this._components[name], data[this.COMPONENT_CONNECT]);
            }, this);
        },

        /**
         *  Resolves the connections of a single component.
         *  @private
         *  @memberof App.prototype
         *  @param  {App~Component} component The component to resolve
         *      the connections of.
         *  @param  {Object.<string, string>} connectTo The configuration
         *      data on how to establish connections.  Keys are the
         *      names of properties given to component; values are names
         *      of other components that will be connected through
         *      that property.
         */
        _connectComponent: function (component, connectTo) {
            _.assign(component, _.mapValues(connectTo, function (otherComponent) {
                return this._components[otherComponent];
            }, this));
        },

        /**
         *  Retrieves a properly bound method based on an identifier of
         *  the form "component.methodName"
         *  @private
         *  @memberof App.prototype
         *  @param {string} identifier The path of the method to get.
         *  @returns {function} The method of the object, bound to the object.
         */
        _getMethod: function (identifier) {
            var component = identifier.substr(0, identifier.lastIndexOf("."));
            component = lang.getObject(component, false, this._components);
            //Consider _.bindKey
            return lang.getObject(identifier, false, this._components).bind(component);
        },

        /**
         *  Loads all services in the application's configuration into
         *  _services.
         *  @private
         *  @memberof App.prototype
         */
        _loadAllServices: function () {
            _.assign(this._services, _.mapValues(this.config[this.SERVICES_KEY],
                this._getMethod, this));
        },

        /**
         *  Connects all components to the services they need.
         *  @private
         *  @memberof App.prototype
         */
        _connectAllServices: function () {
            _.each(this._components, function (component) {
                var serviceKey = _.get(component, this.APP_SETTINGS + "." + this.SERVICES_KEY,
                    this.SERVICES_KEY);
                var services = _.result(component, serviceKey, []);
                _.each(services, function (service) {
                    var name, source;
                    if (_.isArray(service)) {
                        name = service[0], source = service[1];
                    } else {
                        name = service.name, source = service.source;
                    }
                    component[name] = this._services[source];
                }, this);
            }, this);
        },

        /**
         *  Connects all components to event emitters they need.
         *  @private
         *  @memberof App.prototype
         */
        _connectAllEvents: function () {
            _.each(this._components, function (component) {
                var eventKey = _.get(component, this.APP_SETTINGS + "." + this.EVENTS_KEY,
                    this.EVENTS_KEY);
                var events = _.result(component, eventKey, []);
                if (!_.isArray(events)) {
                    events = [events];
                }
                _.each(events, function (event) {
                    var name, source;
                    if (_.isArray(event)) {
                        name = event[0], source = event[1];
                    } else {
                        name = event.name, source = event.source;
                    }
                    component[name] = function () {
                        var args = (arguments.length > 0) ? _.toArray(arguments) : [{}];
                        this.emit(source, args);
                    }.bind(this);
                }, this);
            }, this);
        },

        /**
         *  Sets up all event listeners, based on the configuration,
         *  to fire when their associated event happens.
         *  @private
         *  @memberof App.prototype
         */
        _connectAllEventListeners: function () {
            _.each(this.config[this.EVENTS_KEY], function (listeners, event) {
                if (!_.isArray(listeners)) {
                    listeners = [listeners];
                }
                // Get listeners just once to start, or each time?
                // Latter allows listeners to change their listening function...
                listeners = _.map(listeners, this._getMethod, this);
                this.on(event, function (args) {
                    _.invoke(listeners, Function.prototype.apply, null, args);
                });
            }, this);
        }
    });

    return App;
});
