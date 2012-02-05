$(function(){
    window.NotesModel = Backbone.Model.extend({
        localStorage: new Store("BalloonNotes"),

        defaults: function() {
            return {
                'notes': '',
                'words': 0,
            };
        },
    });

    /* We must set an id to store locally a single model. It is different than collections */
    var Notes = new NotesModel({id: 1});

    window.AppView = Backbone.View.extend({
        el: $("#BalloonNotesContainer"),

        events: {
            "keyup":    "editAndSave",
            "focus":    "hasFocus",
        },

        initialize: function() {
            Notes.fetch();
            this.$("#BalloonNotes").html(Notes.get("notes"));
            this.countWordsAndDisplay(Notes.get("notes"));
        },

        editAndSave: function(e) {
            var notes = this.$("#BalloonNotes").val();
            this.countWordsAndDisplay(notes);
            Notes.save({notes: notes});
        },

        hasFocus: function() {
            if (Notes.get("notes").length == 0) {
                $(this.el).val("");
            }
        },

        countWordsAndDisplay: function(notes) {
            var words = notes == '' ? 0 : notes.split(' ').length;
            this.$("#number_words b").html(words);
            Notes.save({words: words});
        },
    });

    window.App = new AppView;
});