/**
* Use local and remote storage
**/

Backbone.localeSync = Backbone.sync;

Backbone.sync = function(method, model, options) {
    if (options.location == 'remote'){
        return Backbone.ajaxSync(method, model, options);
    } else {
        return Backbone.localeSync(method, model, options);
    }
};
