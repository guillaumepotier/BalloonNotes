$(function() {

    /* Here is our model */
    window.NotesModel = Backbone.Model.extend({

        /* We use localStorage when we do a save() or a fetch() */
        localStorage: new Store("BalloonNotes"),

        initialize : function() {
            this.url = "server/model.php"+"?id="+this.id;
        },

        /* Load some defaults */
        defaults: function() {
            return {
                'notes': 'Type your notes here...',
                'words': 0
            };
        }
    });
    
    /** History collection */
    window.NotesHistoryCollection = Backbone.Collection.extend({
        model : NotesModel,
        url : 'server/history.php'
    });

    /* We must set an id to store locally a single model. It is different than collections */
    var Notes = new NotesModel({id: 1});

    /* Here is our View */
    window.NotesView = Backbone.View.extend({
        // empty at the moment
    });
    
    /* And then our "Controller" */
    window.AppView = Backbone.View.extend({

        /* Our main element */
        el: $("#BalloonNotesContainer"),
        /** history list */
        list: $('#history-list'),

        /* Autosave frequency in seconds */
        autosaveInterval: 20,

        events: {
            "keyup":                  "editAndSave",
            "focus #BalloonNotes":    "hasFocus",
            "click #notes-clear":     "reset",
            "click #notes-save":      "autoSave",
            "click #history-list a":  "loadHistory"
        },

        /**
        *   Initialisation function. Fetch notes and display them properly
        **/
        initialize: function() {
            var self = this;
            this.setAutoSaveInterval(this);

            /* Check for local and remote storage then render */
            this.initFetch();
            /** init underscore template for history list */
            this.template = _.template($('#history-template').html());
            /** Instanciate history collection */
            this.history = new NotesHistoryCollection();
            this.render();
        },
        
        /**
         * Load auto save interval
         */
        setAutoSaveInterval: function(self) {
            /* Fetch notes from localStorage, must give context& */
            if (undefined != this.interval) {
                clearInterval(this.interval);
            }
            
            this.interval = setInterval((function(self) {
                return function() {
                    self.saveButton('saving');
                    self.autoSave();
                }})(this),
            this.autosaveInterval*1000);
            
            return this;
        },
        

        /**
        *   Render notes and counter
        **/
        render: function() {
            /* Display notes */
            this.$("#BalloonNotes").val(Notes.get("notes"));

            /* Scroll at the end of textarea */
            this.$("#BalloonNotes").scrollTop(this.$('#BalloonNotes')[0].scrollHeight);
            this.displayNumberWords(Notes.get("words"));
        },
        
        /**
         * Render notes list
         */
        renderList : function(actual) {
            actual = actual || false;
            //Delete first element from array because it's generally the actual value of the textarea
            if (false === actual) {
                this.history.remove(_.first(this.history.models));
            }
            if (this.history.length > 0) {
                var content = this.template({history : this.history.toJSON()});
                this.list.html(content);
            }
            return this;
        },

        /**
        *   Each keyup, we persist notes and count words
        **/
        editAndSave: function() {
            var notes = this.$("#BalloonNotes").val();
            var words = this.countWordsAndDisplay(notes);
            Notes.save({notes: notes, words: words});
        },

        /**
        *   Save notes whith distant server
        **/
        autoSave: _.debounce(function(self) {
            var self = this;

            if (Notes.get("words") !== 0) {
                Notes.save({},{
                    'location' : 'remote',
                    success: function() {
                        //fetch and render history list
                        self.history.fetch({location: 'remote', success: function() {
                            self.renderList();
                        }});
                        self.saveButton('saved')
                    }
                });
            }

            return false;
        }, 800),
        
        /**
         * Load data from one history model
         *  and reload save interval
         */
        loadHistory: function(e) {
            e.preventDefault();
            var self = this,
                id = $(e.target).attr('data-id'),
                histo = this.history.get(id);
            
            //renew interval to avoid saving directly after loading history
            this.setAutoSaveInterval(this);
            
            Notes.set({
                notes: histo.get('notes'),
                words: histo.get('words')
            });
            this.render();
            
            this.history.fetch({location: 'remote', success: function() {
                self.renderList(true);
            }});
            
        },

        /**
        *   On page loading, compare what we have in localStorage and in distant storage, then choose
        **/
        initFetch: function() {
            var self = this;
            Notes.fetch({
                'location': 'remote',
                success: function() {
                    self.render();
                    //fetch and render history list
                    self.history.fetch({location: 'remote', success: function() {
                        self.renderList();
                    }});
                    self.saveButton('saved');
                },
                error: function() {
                    self.fallbackLocalFetch();
                }
            });
        },

        /**
        *   If could not resolve host on remote server, then fetch localStorage
        **/
        fallbackLocalFetch: function() {
            var self = this;
            Notes.fetch({
                'location': 'local',
                success: function() {
                    self.render();
                }
            });
        },

        /**
        *   Remove textarea placeholder. Called each time we have focus on textarea
        **/
        hasFocus: function() {
            if (Notes.get("words") === 0) {
                this.$("#BalloonNotes").val("");
            }
        },

        /**
        *   Count number of words in notes
        **/
        countWordsAndDisplay: function(notes) {
            var number_words = 0;
            var replaced = notes.replace(/\s/g,' ').split(' ');
            for (var i = 0; i < replaced.length; i++) {
                if (replaced[i].length > 0) {
                  number_words++;
                }
            }

            this.displayNumberWords(number_words);
            this.saveButton('toBeSaved');

            return number_words;
        },

        /**
        *   Take care of Save button UI
        **/
        saveButton: function(state) {
            var button = this.$("#notes-save");
            if (state == 'saved') {
                button.addClass("disabled");
                button.text('Saved');
            } else if ( state == 'saving') {
                button.addClass("disabled");
                button.text('Saving..');
            } else {
                button.removeClass("disabled");
                button.text('Save');
            }
        },

        /**
        *   Display number words below textarea
        **/
        displayNumberWords: function(number_words) {
            this.$("#number_words b").html(number_words);
        },

        /**
        *   Delete LocalStorage and create/render new one
        **/
        reset: function() {
            /* We delete both storages and instanciate new empty Model */
            Notes.destroy({'location': 'remote'});
            Notes.destroy();
            Notes = new NotesModel({id: 1});
            this.render();
            this.list.empty();
        }
    });
    
    window.App = new AppView();
 });
