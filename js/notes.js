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

        events: {
            "keyup":                  "editAndSave",
            "focus #BalloonNotes":    "hasFocus",
            "click #notes-clear":     "reset"
        },

        /**
        *   Initialisation function. Fetch notes and display them properly
        **/
        initialize: function() {
            /* Fetch notes from localStorage */
            var autoSave = setInterval(this.autoSave, 20000);
            Notes.fetch();

            /* Then, render them */
            this.render();
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
            this.countWordsAndDisplay(notes);
            Notes.save({notes: notes});
        },
        autoSave: function() {
            Notes.save({},{'location' : 'remote'});
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
            Notes.save({words: number_words});
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
            Notes.destroy();
            Notes = new NotesModel({id: 1});
            this.render();
        }
    });

    window.App = new AppView();
});
