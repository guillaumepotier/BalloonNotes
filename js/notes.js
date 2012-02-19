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

        /* Autosave frequency in seconds */
        autosaveInterval: 20,

        events: {
            "keyup":                  "editAndSave",
            "focus #BalloonNotes":    "hasFocus",
            "click #notes-clear":     "reset",
            "click #notes-save":      "autoSave",
        },

        /**
        *   Initialisation function. Fetch notes and display them properly
        **/
        initialize: function() {
            var self = this;

            /* Fetch notes from localStorage, must give context */
            setInterval((function(self) {
                return function() {self.autoSave();}})(this),
            this.autosaveInterval*1000);

            /* Check for local and remote storage then render */
            this.initFetch();
        },

        /**
        *   Render notes and counter
        **/
        render: function() {
            /* Display notes */
            this.$("#BalloonNotes").html(Notes.get("notes"));

            /* Scroll at the end of textarea */
            this.$("#BalloonNotes").scrollTop(this.$('#BalloonNotes')[0].scrollHeight);
            this.displayNumberWords(Notes.get("words"));
        },

        /**
        *   Each keyup, we persist notes and count words
        **/
        editAndSave: function(e) {
            var notes = this.$("#BalloonNotes").val();
            var words = this.countWordsAndDisplay(notes);
            Notes.save({notes: notes, words: words});
        },

        /**
        *   Save notes whith distant server
        **/
        autoSave: function(self) {
            var self = this;
            this.saveButton('saving');

            if (Notes.get("words") !== 0) {
                Notes.save({},{
                    'location' : 'remote',
                    success: function() {
                        self.saveButton('saved')
                    }
                });
            }

            return false;
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
        }
    });

    window.App = new AppView();
});
