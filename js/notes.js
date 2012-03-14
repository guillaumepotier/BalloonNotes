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
        'notes':    'Type your notes here...',
        'words':    0,
        'lastSave':   0
      };
    }
  });

  /** History collection */
  window.NotesHistoryCollection = Backbone.Collection.extend({
    model : NotesModel,
    url : 'server/history.php',

    initialize: function() {
    }
  });

  /* We must set an id to store locally a single model. It is different than collections */
  Notes = new NotesModel({id: 1});

  /* Here is our View */
  window.NotesView = Backbone.View.extend({
    // empty at the moment
  });

  /* And then our "Controller" */
  window.AppView = Backbone.View.extend({

    /* Our main element */
    el: $("#BalloonNotesContainer"),

    /* history list */
    list: $('.history_list'),

    /* Autosave frequency in seconds */
    autosaveInterval: 30,

    events: {
      "keyup":                  "editAndSave",
      "focus #BalloonNotes":    "hasFocus",
      "blur #BalloonNotes":     "hasBlur",
      "click #notes_clear":     "reset",
      "click #notes_save":      "manualSave",
      "click #send":            "sendMail",
      "click .history_list a":  "loadHistory",
      "click #browse_history":  "browseHistory",
      "click #hide_history":    "hideHistory",
      "click #load_history":    "backUpHistory"
    },

    /**
    *   Initialisation function. Fetch notes and display them properly
    **/
    initialize: function() {
      var self = this;

      /* Instanciate auto-save, must give context to setInterval func */
      setInterval((function(self) {
        return function() {
          if (self.$("#notes_save").hasClass('disabled') !== true && Notes.get("words") !== 0) {
            self.autoSave();
          }
        }})(self),
      self.autosaveInterval*1000);

      /* Instanciate history collection */
      self.history = new NotesHistoryCollection();

      /* init underscore template for history list, fetch it and render it */
      self.template = _.template($('#history-template').html());
      self.history.fetch({
        location:'remote',
        success: function() {
          self.renderList();
        }
      });

      /* Check for local and remote storage then render */
      self.initFetch();
    },

    /**
    *   Render notes and counter
    **/
    render: function() {
      /* Get local notes and display them */
      this.$("#BalloonNotes").val(Notes.get("notes"));

      /* Scroll at the end of textarea */
      this.$("#BalloonNotes").scrollTop(this.$('#BalloonNotes')[0].scrollHeight);

      /* Display the number of words below notes */
      this.displayNumberWords(Notes.get("words"));
    },

    /**
     * Render notes list
     */
    renderList : function() {
      var content = this.template({history : this.history.toJSON()});
      this.list.html(content);
      return this;
    },

    /**
    *   Each keyup, we persist notes and count words
    **/
    editAndSave: function(e) {
      var notes = this.$("#BalloonNotes").val();
      var words = this.countWordsAndDisplay(notes);
      Notes.save({notes: notes, words: words});
    },

    manualSave: function(e) {
      var date = new Date();
      time = date.getTime();
      this.saveButton('saving', time);
      this.autoSave();
      return false;
    },

    /**
    *   Save notes whith distant server
    **/
    autoSave: _.debounce(function(self) {
      var self = this;
      if (Notes.get("words") !== 0) {
        var date = new Date();
        time = date.getTime();
        Notes.save({"lastSave": time},{
          'location' : 'remote',
          success: function() {
            self.history.fetch({location: 'remote', success: function() {
              self.renderList();
            }});
            self.saveButton('saved', time);
            Notes.save({"lastSave": time});
          }
        });
      }
      return false;
    }, 800),

    /**
     * Load auto save interval
     */
    setAutoSaveInterval: function(self) {
      /* Fetch notes from localStorage, must give context */
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
    *   On page loading, compare what we have in localStorage and in distant storage, then choose
    **/
    initFetch: function() {
      var select = function ( model ) {
        Notes = model;
        this.render( );
        this.saveButton( 'save' );
      }.bind( this );
	  
      var local = new NotesModel({id: 1});
      
      local.fetch({
        location: 'local'
      });
      
      var remote = new NotesModel({id: 1});
      
      remote.fetch({
        location: 'remote',
        success: function( ) {
	        //todo Ugly, should be better with a modal box
            if ( local.get( 'notes' ) === remote.get( 'notes' ) )
              select( local );
            else if ( local.get( 'lastSave' ) > remote.get( 'lastSave' ) )
              select( local );
            else if ( local.get( 'lastSave' ) < remote.get( 'lastSave' ) )
              select( confirm( 'Remote notes seems to be younger than local ones. Press cancel to keep your version.' ) ? remote : local );
        },
	    error: function ( ) {
		    select( local );
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
    *  When blur on textarea placeholder, if there is no text, replace by the placeholder "Type your notes here..."
    **/
    hasBlur: function(){
      if(Notes.get("words") === 0){
        this.$("#BalloonNotes").val(Notes.get("notes"));
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
    saveButton: function(state, time) {
      var button = this.$("#notes_save");
      if (state == 'saved') {
        button.addClass("disabled");
        var save = this.getTime(time);
        button.text('Saved | ' + save);
      } else if ( state == 'saving') {
        button.addClass("disabled");
        button.text('Saving..');
      } else {
        button.removeClass("disabled");
        if (Notes.get('lastSave') != 0) {
          var save = this.getTime(Notes.get('lastSave'));
        } else {
          var save = 'Not saved' 
        }
        button.text('Save | ' + save);
      }
    },

    /**
     * Load data from one history model and add a class to the history button
     */
    loadHistory: function(e) {
      var id = $(e.target).attr('data-id'),
      histo = this.history.get(id);

      $('#BalloonHistory').text(histo.get("notes")).attr({
        'data-words'  : histo.get('words'),
        'data-id'    : histo.get('id')
      });

      $('.history_list a.btn-info').removeClass('btn-info');
      $(e.target).addClass('btn-info');
      return false;
    },

    /**
    *
    **/
    backUpHistory: function(){
      var notesFromHistory  = $('#BalloonHistory').text();
      var wordsFromHistory  = $('#BalloonHistory').attr('data-words');
      var idFromHistory    = $('#BalloonHistory').attr('data-id');

      // i to count into the array, and the array to store IDs of the history to delete
      var i      = 0;
      var toDelete  = new Array();

      //renew interval to avoid saving directly after loading history
      this.setAutoSaveInterval(this);

      Notes.set({
        notes  : notesFromHistory,
        words  : wordsFromHistory
      });
      Notes.save();

      // Delete history if it's more recent than the one we're loading
      $('.history_list a').each(function() {
        var id = $(this).attr('data-id');
        
        if (idFromHistory <= id) {
          toDelete[i] = id;
          i++;
        }
      });

      for (i = 0; i < toDelete.length; i++) {
        this.history.get(toDelete[i]).destroy({'location':'remote'});
      }
      
      this.renderList();
      this.render();
      this.hideHistory();
    },

    /**
    *  Function to show the history
    **/
    browseHistory: function(){
      var self = this;
      $('#BalloonNotes').animate({height:'50%'}, 300,function() {
        $('#history').fadeIn(300);
        $('#browse_history').attr('id','hide_history').html('Hide history');

        /* if first browse, select newest history archive */
        if ($('.history_list ul li a.btn-info').length == 0) { 
          $('.history_list ul li a').first().trigger('click');
        }  
      });
    },

    /**
    * Function to hide the history
    **/
    hideHistory: function(){
      $('#history').fadeOut(300,function(){
        $('#BalloonNotes').animate({height:'100%'}, 300);
        $('#hide_history').attr('id','browse_history').html('Browse history');
      });
    },

    /**
    *  Return last save time to be displayed
    **/
    getTime: function(time){
      var date = new Date(time);
      return 'Last save : ' + date.getHours() + ':' + date.getMinutes() + ':' + date.getSeconds();
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
      Notes.save();
      this.render();
    },

    sendMail: function(){
      /* To be properly done */
    },

  });

  window.App = new AppView(); 
});
