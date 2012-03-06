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
            "click #send":     		  "sendMail",
        },

        /**
        *   Initialisation function. Fetch notes and display them properly
        **/
        initialize: function() {
            var self = this;

            /* Fetch notes from localStorage, must give context& */
            setInterval((function(self) {
                return function() {
                	if(!this.$("#notes-save").hasClass('disabled') && this.$("#BalloonNotes").val() != ''){
                		self.saveButton('saving');
                    	self.autoSave();
                	}
                }})(this),
            this.autosaveInterval*1000);
			
            /* Check for local and remote storage then render */
            this.initFetch();
        },

        /**
        *   Render notes and counter
        **/
        render: function() {
        
            /* Display notes */
            if(Notes.get("notes")){
            	this.$("#BalloonNotes").html(Notes.get("notes"));
            }else{
            	this.$("#BalloonNotes").html('');
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
            var words = this.countWordsAndDisplay(notes);
            Notes.save({notes: notes, words: words},{'location':'local'});
        },

        /**
        *   Save notes whith distant server
        **/
        autoSave: _.debounce(function(self) {
            var self = this;
            if (Notes.get("words") !== 0) {
            	var date = new Date();
            	time = date.getTime();
                Notes.save({'lastSave':time},{
                    'location' : 'remote',
                    success: function() {
                        self.saveButton('saved', time);
                    }
                });
                Notes.save({'lastSave':time},{
                    'location' : 'local',
                });
                
            }

            return false;
        }, 800),

        /**
        *   On page loading, compare what we have in localStorage and in distant storage, then choose
        **/
        initFetch: function() {
            var self = this;
            Notes.fetch({
                'location': 'local',
                success: function() {
                    self.render();
                    self.saveButton('save');
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
        saveButton: function(state, time) {
            var button = this.$("#notes-save");
            if (state == 'saved') {
                button.addClass("disabled");
                var save = this.getTime(time);
                button.text('SAVED | '+save);
            } else if ( state == 'saving') {
                button.addClass("disabled");
                button.text('Saving..');
            } else {
                button.removeClass("disabled");
                if(Notes.get('lastSave')){
                	var save = this.getTime(Notes.get('lastSave'));
                }else{
                	var save = 'Not saved' 
                }
                button.text('SAVE | '+save);
            }
        },
		
		getTime: function(time){
			var date = new Date(time),
    		hours = date.getHours(),
    		minutes = date.getMinutes(),
    		seconds = date.getSeconds(),
    		save = 'Last save : '+hours+':'+minutes+':'+seconds;
    		return save;
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
            this.$("#BalloonNotes").val("");
            this.render();
        },
        
        sendMail: function(){
        	/* Save before sending */
        	this.autoSave();
        	$.post('../server/mail.php', {notes : Notes.get('notes'), email : 'r.gazelot@gmail.com'}, function(data){
        		if(data == 'success'){
        			$('#send_success').fadeIn(500,function(){
        				setInterval(function(){
        					$('#send_success').fadeOut(500);
        				},2000)
        			});
        		}
        	});
        },
        
    });

    window.App = new AppView(); 
    
});
