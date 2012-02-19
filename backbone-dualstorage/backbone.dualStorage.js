/**
* Use local and remote storage
**/

Backbone.localeSync = Backbone.sync;

Backbone.sync = function(method, model, options) {
    if (options.location == 'remote'){
        Backbone.ajaxSync(method, model, options);
    } else {
        Backbone.localeSync(method, model, options);
    }
};

