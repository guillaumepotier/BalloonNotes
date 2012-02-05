$(function() {

    /* Here is our model */
    window.NotesModel = Backbone.Model.extend({

        /* We use localStorage when we do a save() or a fetch() */
        localStorage: new Store("BalloonNotes"),

        /* Load some defaults */
        defaults: function() {
            return {
                'notes': '',
                'words': 0,
            };
        },
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

        events: {
            "keyup":                  "editAndSave",
            "focus #BalloonNotes":    "hasFocus",
        },

        /**
        *   Initialisation function. Fetch notes and display them properly
        **/
        initialize: function() {

            /* Fetch notes from localStorage */
            Notes.fetch();

            /* Display notes if some are persisted */
            if (Notes.get("notes") != "") {
                this.$("#BalloonNotes").html(Notes.get("notes"));
            }

            /* Scroll at the end of textarea */
            this.$("#BalloonNotes").scrollTop(this.$('#BalloonNotes')[0].scrollHeight);
            this.displayNumberWords(Notes.get("words"));
        },

        /**
        *   Each keyup, we persist notes and count words
        **/
        editAndSave: function(e) {
            var notes = this.$("#BalloonNotes").val();
            this.countWordsAndDisplay(notes);
            Notes.save({notes: notes});
        },

        /**
        *   Remove textarea placeholder. Called each time we have focus on textarea
        **/
        hasFocus: function() {
            if (Notes.get("notes").length == 0) {
                this.$("#BalloonNotes").val("");
            }
        },

        /**
        *   Count number of words in notes
        **/
        countWordsAndDisplay: function(notes) {
            var number_words = notes == '' ? 0 : notes.replace(/\s/g,' ').split(" ").length;
            this.displayNumberWords(number_words);
            Notes.save({words: number_words});
        },

        /**
        *   Display number words below textarea
        **/
        displayNumberWords: function(number_words) {
            this.$("#number_words b").html(number_words);
        }
    });

    window.App = new AppView;
});