/* Javascript library containing methods related to Ace Attorney Dialogue Editor
 * 
 */

function aade(){
	
	// Properties
	this.destinationTool = 'dhh';
	this.lastName = '???';
	this.lastColor = '';
	this.equivalenceTable = {};
	this.dialogParserTableTextareas = {};
	this.processingProgressbars = {
		'default': $(),
		'analysisScripts': $(),
		'analysisScriptsPages': $()
	};
	this.saveFormat = 'ansi';
	this.automaticPageChange = false;
	this.openedFiles = [];
	this.originOfOpenedFiles = '';
	this.configs = {};
	this.defaultConfigs = {
		'game': 'aa1',
		'nameType': 'o',
		'platform': '3ds',
		'invalidateLargeLines': true,
		'mobileShowInitially': 'p',
		'theme': 'light',
		'highlightingColors': {
			'light': {
				'tags': 'lightsalmon',
				'originalNames': 'lightgreen',
				'adaptedNames': 'khaki',
				'lineBreak': 'aquamarine',
				'endSection': '#aaa',
				'wait': 'lightblue'
			},
			'dark': {
				'tags': '#005F85',
				'originalNames': '#6F116F',
				'adaptedNames': '#0F1973',
				'lineBreak': '#80002B',
				'endSection': '#555',
				'wait': '#522719'
			}
		}
	};
	
	// Methods
	this.loadMainAppRoutines = function(){
		var that = this;
		
		that.instantiateSlideoutMenu();
		that.loadModalWindows(function(){
			that.showLoadingIndicator();
			that.loadConfigs();
			that.loadTheme();
			that.loadTabContents(function(){
				that.setDefaultOptionsInFileForm();
				that.instantiateEventMobileToggleFieldPreview();
				that.showTestScriptOptions();
				that.toggleAccordionIcon();
				that.hideLoadingIndicator();
				that.calculateMainContainerHeight();
				//that.runTaskOnCordova();
			});
		});
	}
	
	this.runTaskOnCordova = function(){
		if( this.checkOnCordova() ){
			console.log('no cordova')
		} else {
			console.log('fora do cordova')
		}
	}
	
	this.instantiateSlideoutMenu = function(){
		var slideout = new Slideout({
			'panel': $('#panel')[0],
			'menu': $('#menu')[0],
			'side': 'right'
		  });

		  $('.js-slideout-toggle').click(function(){
			  slideout.toggle();
		  });

		  $('.menu').click(function(e){
			  var $el = $(e.target);

			  if($el.is('a')) slideout.close();
		  });
	}
	
	this.loadConfigs = function(){
		var game = stash.get('game');
		var nameType = stash.get('nameType');
		var platform = stash.get('platform');
		var invalidateLargeLines = stash.get('invalidateLargeLines');
		var mobileShowInitially = stash.get('mobileShowInitially');
		var theme = stash.get('theme');
		var highlightingColors = stash.get('highlightingColors');
		
		if(typeof game == 'undefined') game = this.defaultConfigs.game;
		if(typeof nameType == 'undefined') nameType = this.defaultConfigs.nameType;
		if(typeof platform == 'undefined') platform = this.defaultConfigs.platform;
		if(typeof invalidateLargeLines == 'undefined') invalidateLargeLines = this.defaultConfigs.invalidateLargeLines;
		if(typeof mobileShowInitially == 'undefined') mobileShowInitially = this.defaultConfigs.mobileShowInitially;
		if(typeof theme == 'undefined') theme = this.defaultConfigs.theme;
		if(typeof highlightingColors == 'undefined') highlightingColors = this.defaultConfigs.highlightingColors;
		
		this.configs = {
			'game': game,
			'nameType': nameType,
			'platform': platform,
			'invalidateLargeLines': invalidateLargeLines,
			'mobileShowInitially': mobileShowInitially,
			'theme': theme,
			'highlightingColors': highlightingColors
		}
	}
	
	this.loadTheme = function(){
		var theme = this.configs.theme;
		$('body').addClass(theme);
	}
	
	this.changeTheme = function(element){
		var $element = $(element);
		var $body = $('body');
		var $dialogParserTables = $('table.dialog-parser-table');
		
		var previousTheme = ($body.hasClass('dark')) ? ('dark') : ('light');
		var theme;
		if($element.is('a')){
			theme = ( $element.attr('href') ).replace('#', '');
		} else {
			theme = $element.val();
		}
		
		stash.set('theme', theme);
		$body.removeClass('light dark').addClass(theme);
		
		// Update table if the dialog parser table is loaded,
		// and the selected theme is different than the previous one
		if(($dialogParserTables.length > 0) && (theme != previousTheme)){
			$dialogParserTables.each(function(){
				var tableObject = $(this).DataTable();
				tableObject.draw(false);
			});
		}
		
		// Reloading configs after saving the new theme
		this.loadConfigs();
	}
	
	this.loadModalWindows = function(callback){
		var $body = $('body');
		
		$.when(
			$.get('modal-instructions.html'),
			$.get('modal-loading.html'),
			$.get('modal-processing.html'),
			$.get('modal-analysis.html'),
			$.get('modal-analysis-processing.html'),
			$.get('modal-analysis-results-table.html'),
			$.get('modal-export.html'),
			$.get('modal-config.html'),
			$.get('modal-text-preview.html'),
			$.get('modal-save.html'),
			$.get('modal-goto.html')
		).done(function(r1, r2, r3, r4, r5, r6, r7, r8, r9, r10, r11){
			var results = [r1, r2, r3, r4, r5, r6, r7, r8, r9, r10, r11];
			for(var i in results){
				var result = results[i][0];
				
				$body.append(result);
			}
			
			if(callback) callback();
		});
	}
	
	this.loadTabContents = function(callback){
		var $divDialogFileFormContainer = $('#dialog-file-form-container');
		var $divEquivalenceTableTab = $('#equivalence-table-tab');
		
		$divDialogFileFormContainer.load('dialog-file-form.html', function(){
			$divEquivalenceTableTab.load('equivalence-table.html', function(){
				if(callback) callback();
			});
		});
	}
	
	this.triggerClickOnFirstMainTab = function(){
		var $aFirstTab = $("a[href='#dialog-parser-tab']");
		
		$aFirstTab.trigger('click');
	}
	
	this.setDefaultOptionsInFileForm = function(){
		var $radioGameFieldAA1 = $('#game-field-aa1');
		var $radioGameFieldAA2 = $('#game-field-aa2');
		var $radioGameFieldAA3 = $('#game-field-aa3');
		var $radioNameTypeOriginal = $('#name-type-original');
		var $radioNameTypeAdapted = $('#name-type-adapted');
		var $radioPlatform3DS = $('#platform-3ds');
		var $radioPlatformDSJTS = $('#platform-ds-jacutemsabao');
		var $radioPlatformDSAmerican = $('#platform-ds-american');
		var $radioPlatformDSEuropean = $('#platform-ds-european');
		var $radioMobileShowInitiallyPreview = $('#mobile-show-initially-preview');
		var $radioMobileShowInitiallyTextfield = $('#mobile-show-initially-textfield');
		
		// Checking default options for each field
		if(this.configs.game == 'aa3'){
			$radioGameFieldAA3.prop('checked', true).trigger('change').parent().addClass('active').siblings().removeClass('active');
		} else if(this.configs.game == 'aa2'){
			$radioGameFieldAA2.prop('checked', true).trigger('change').parent().addClass('active').siblings().removeClass('active');
		} else {
			$radioGameFieldAA1.prop('checked', true).trigger('change').parent().addClass('active').siblings().removeClass('active');
		}
		if(this.configs.nameType == this.defaultConfigs.nameType){
			$radioNameTypeOriginal.prop('checked', true).trigger('change').parent().addClass('active').siblings().removeClass('active');
		} else {
			$radioNameTypeAdapted.prop('checked', true).trigger('change').parent().addClass('active').siblings().removeClass('active');
		}
		if(this.configs.platform == 'ds_jacutemsabao'){
			$radioPlatformDSJTS.prop('checked', true).trigger('change').parent().addClass('active').siblings().removeClass('active');
		} else if(this.configs.platform == 'ds_american'){
			$radioPlatformDSAmerican.prop('checked', true).trigger('change').parent().addClass('active').siblings().removeClass('active');
		} else if(this.configs.platform == 'ds_european'){
			$radioPlatformDSEuropean.prop('checked', true).trigger('change').parent().addClass('active').siblings().removeClass('active');
		} else {
			$radioPlatform3DS.prop('checked', true).trigger('change').parent().addClass('active').siblings().removeClass('active');
		}
		if(this.configs.mobileShowInitially == this.defaultConfigs.mobileShowInitially){
			$radioMobileShowInitiallyPreview.prop('checked', true).trigger('change').parent().addClass('active').siblings().removeClass('active');
		} else {
			$radioMobileShowInitiallyTextfield.prop('checked', true).trigger('change').parent().addClass('active').siblings().removeClass('active');
		}
	}
	
	this.showTestScriptOptions = function(){
		var $divTestScriptsList = $('#test-scripts-list');
		
		var testScriptsFolder = 'test_scripts/';
		
		var testScripts = [
			{
				'filename': 'AA1 Accents (DiegoHH).txt',
				'label': 'AA1 Acentos (DiegoHH).txt'
			},
			{
				'filename': 'AA1 Tags in Chevron (OPF).txt',
				'label': 'AA1 Chevron (OPF).txt'
			},
			{
				'filename': 'AA1 Tags in Chevron (OPF).txt',
				'label': 'AA1 Chaves (OPF antigo).txt'
			}
		];
		
		$.get('dialog-file-form-test-scripts.html').then(function(response){
			var template = $.templates(response);
			
			for(var i in testScripts){
				var testScript = testScripts[i];
				var filename = testScriptsFolder + testScript.filename;
				var label = testScript.label;
				
				var rowInfo = {
					'iterator': i,
					'filename': filename,
					'label': label
				}
				var $newLabel = $( template.render(rowInfo) );
				
				$divTestScriptsList.append($newLabel);
			}
		})
	}
	
	this.readScriptFilesFromInput = function(inputFileField){
		var $inputFileField = $(inputFileField);
		var $radioFileOriginInput = $('#file-origin-input');
		var $form = $inputFileField.closest('form');
		
		if($inputFileField[0].files.length > 0){
			$radioFileOriginInput.prop('checked', true);
			setTimeout(function(){
				$form.submit();
			}, 25);
		}
	}
	
	this.readTestScriptFile = function(radioTestScript){
		var $radioTestScript = $(radioTestScript);
		var $form = $radioTestScript.closest('form');
		
		setTimeout(function(){
			$form.submit();
		}, 25);
	}
	
	this.toggleAccordionIcon = function() {
		$('.panel-group').on('hide.bs.collapse show.bs.collapse', function(e){
			$(e.target).prev('.panel-heading').find(".plus-minus").toggleClass('glyphicon-plus glyphicon-minus');
		});
	}
	
	this.readScriptFiles = function(dialogFileForm){
		var $radioFileOrigin = $("[name='file-origin']:checked");
		var $inputFileField = $('#file-field');
		var $radioTestScriptList = $("[name='test-script']:checked");
		var $radioDestinationTool = $("[name='destination-tool']:checked");
		
		var fileOrigin = $radioFileOrigin.val();
		var selectedTestScript = $radioTestScriptList.val();
		var destinationTool = $radioDestinationTool.val();
		var that = this;
		var encoding;
		if(destinationTool == 'dhh'){
			that.saveFormat = 'ansi';
			encoding = 'iso-8859-1';
		} else {
			that.saveFormat = 'utf-8_with_bom';
			encoding = 'utf-8';
		}
		var files = [];
		
		if(fileOrigin == 'f'){ // File input
			var uploadedFiles = [];
			$.each($inputFileField[0].files, function(){
				uploadedFiles.push(this);
			})
			
			// Reading files recursively, in order to
			var readFileFromInput = function(){
				var file = uploadedFiles.shift();
				var filename = file.name;
					
				var reader = new FileReader();
				reader.readAsText(file, encoding);
				reader.onload = function (evt) {
					var fileContents = evt.target.result;

					files.push({
						'filename': filename,
						'fileContents': fileContents
					});

					// Checking if there's at least one more file to read
					if(uploadedFiles.length > 0){
						readFileFromInput();
					} else {
						// All files readed, so proceed with the script parsing
						that.showLoadingIndicator();
						that.parseScriptFiles(files, function(){
							that.instantiatePaginationDialogParsing();
						});
					}
				}
			}
			readFileFromInput();
		} else if(fileOrigin == 't'){ // Test scripts
			var filename = selectedTestScript.split('/').pop();
			
			that.showLoadingIndicator();
			
			$.ajax({
				url: selectedTestScript,
				type: 'GET',
				contentType: 'Content-type: text/plain; charset=' + encoding,
				beforeSend: function(jqXHR) {
					jqXHR.overrideMimeType('text/html;charset=' + encoding);
				},
				success: function(fileContents){
					files.push({
						'filename': filename,
						'fileContents': fileContents
					});
					
					that.parseScriptFiles(files, function(){
						that.instantiatePaginationDialogParsing();
					});
				}
			});
		}
		
		// Saving origin of opened files in a specific property, in order to use it later
		that.originOfOpenedFiles = fileOrigin;
		
		return false;
	}
	
	this.parseScriptFiles = function(files, callback){
		var $divDialogFileFormContainer = $('#dialog-file-form-container');
		var $divDialogParsedScriptsContainer = $('#dialog-parsed-scripts-container');
		
		var that = this;
		var destinationTool = that.destinationTool;
		
		// Loading needed html files, before parsing the scripts
		$.when(
			$.get('dialog-parser-table.html'),
			$.get('dialog-parser-row.html')
		).done(function(dpt, dpr){
			$divDialogParsedScriptsContainer.html(dpt[0]);
			
			for(var i in files){
				var file = files[i];
				var filename = file.filename;
				var fileContents = file.fileContents;

				var scriptTabId = 'script-tab-' + i;
				
				// Saving scripts info in a specific property, in order to use it later
				that.openedFiles.push({
					'scriptTabId': scriptTabId,
					'filename': filename
				});

				// Separating strings in blocks
				var number = -1;
				var sections = [];
				var lines = fileContents.split("\n");

				// Separating strings in sections
				for(var j in lines){
					var line = $.trim( lines[j] ) + "\n";

					var regexSection;
					if(destinationTool == 'opf'){
						regexSection = line.match(/\<\<[0-9]+\>\>/g);
					} else {
						regexSection = line.match(/\{\{[0-9]+\}\}/g);
					}

					var checkDialogueChanged = (regexSection != null && regexSection.length > 0);
					if(checkDialogueChanged){
						if(destinationTool == 'opf'){
							number = regexSection[0].replace(/</g, '').replace(/>/g, '');
						} else {
							number = regexSection[0].replace(/{/g, '').replace(/}/g, '');
						}
						number = parseInt(number, 10);
					}

					if(number > -1){
						if(destinationTool == 'opf'){
							line = line.replace('<<' + number + '>>', '');
						} else {
							line = line.replace('{{' + number + '}}', '');
						}

						if(typeof sections[number] == 'undefined'){
							sections[number] = line;
						} else {
							sections[number] += line;
						}
					}
				}

				var sectionBlocks = [];
				var tag = false;
				var characterCode = '';
				var tagText = '';
				var color = '';
				var checkFirstAlphanumericChar = false;

				// Iterating into sections to separate them into blocks	
				for(var sectionNumber in sections){
					var section = sections[sectionNumber];
					var blockNumber = 1;

					for(var j = 0; j < section.length; j++){
						var char = section[j];

						if(destinationTool == 'opf'){
							if(char == '<'){
								tag = true;
							} else if(char == '>'){
								tag = false;
							}
						} else {
							if(char == '{'){
								tag = true;
							} else if(char == '}'){
								tag = false;
							}
						}

						// Detecting first alphanumeric char in a text block
						var checkCharacterAlphanumeric = /^[a-zA-Z0-9ÀÁÃÂÇÉÊÍÏÓÔÕÚÜÑàáãâçéêíïóôõúüñ()]*$/.test(char);
						if(checkFirstAlphanumericChar){
							// Suppressing all line breaks after the first alphanumeric character
							// That's done in order to have line breaks only after {b} tags
							if(char == "\n" || char == "\r"){
								char = '';
							}
						} else if(checkCharacterAlphanumeric && !tag){
							checkFirstAlphanumericChar = true;
						}

						// Creating additional variables in section_blocks array, in order to
						// mount the table with textarea fields below
						if(typeof sectionBlocks[sectionNumber] == 'undefined'){
							sectionBlocks[sectionNumber] = [];
						}
						if(typeof sectionBlocks[sectionNumber][blockNumber] == 'undefined'){
							sectionBlocks[sectionNumber][blockNumber] = [];
						}
						if(typeof sectionBlocks[sectionNumber][blockNumber]['characterCode'] == 'undefined'){
							sectionBlocks[sectionNumber][blockNumber]['characterCode'] = characterCode;
						}
						if(typeof sectionBlocks[sectionNumber][blockNumber]['text'] == 'undefined'){
							sectionBlocks[sectionNumber][blockNumber]['text'] = char;
						} else {
							sectionBlocks[sectionNumber][blockNumber]['text'] += char;
						}
						if(typeof sectionBlocks[sectionNumber][blockNumber]['color'] == 'undefined'){
							sectionBlocks[sectionNumber][blockNumber]['color'] = color;
						}
						if(typeof sectionBlocks[sectionNumber][blockNumber]['hasEndjmp'] == 'undefined'){
							sectionBlocks[sectionNumber][blockNumber]['hasEndjmp'] = false;
						}

						if(tag){
							if(destinationTool == 'opf'){
								if(char != '<'){
									tagText += char;
								}
							} else {
								if(char != '{'){
									tagText += char;
								}
							}
						} else {// Adding line break after {b}
							if((tagText == 'b')){
								sectionBlocks[sectionNumber][blockNumber]['text'] += "\n";
							}

							// Obtaining character code from {name} tags
							if(tagText.startsWith('name:')){
								var tmp = tagText.split(':');
								var characterCode = $.trim( tmp.pop() );
								sectionBlocks[sectionNumber][blockNumber]['characterCode'] = characterCode;
							}

							// Obtaining last color change from {color} tags
							if(tagText.startsWith('color:')){
								var tmp = tagText.split(':');
								var color = $.trim( tmp.pop() );

								sectionBlocks[sectionNumber][blockNumber]['color'] = color;
							}

							// Checking if block has {endjmp} tag
							var checkHasEndjmpTag = (tagText == 'endjmp');
							if(checkHasEndjmpTag){
								color = '';
								sectionBlocks[sectionNumber][blockNumber]['hasEndjmp'] = true;
							}

							// Checking if block has a break generated by {p}, {nextpage_button} or {nextpage_nobutton} tags
							var checkBreakDetected = ((tagText == 'p') || (tagText.startsWith('nextpage_button')) || (tagText.startsWith('nextpage_nobutton')));
							if(checkBreakDetected){
								checkFirstAlphanumericChar = false;
								blockNumber++;
							}

							tagText = '';
						}
					}
				}

				// Loading dialog parser table
				var $dialogParserTable = $divDialogParsedScriptsContainer.children('table');
				var $tbody = $dialogParserTable.children('tbody');
				var $spanTotalSections = $dialogParserTable.find('span.total-sections');
				var $spanTotalDialogBlocks = $dialogParserTable.find('span.total-dialog-blocks');

				$divDialogFileFormContainer.hide();
				$dialogParserTable.attr({
					'id': scriptTabId,
					'data-filename': filename
				});

				// Loading dialog parser table's row template
				var template = $.templates(dpr[0]);

				var order = 1;
				var totalSections = 0;
				var totalDialogBlocks = 0;
				
				// Iterating into section blocks to create a table row for each
				for(var sectionNumber in sectionBlocks){
					totalSections++;

					// Iterating through all section blocks, in order to mount the table rows.
					var section = sectionBlocks[sectionNumber];
					for(var blockNumber in section){
						totalDialogBlocks++;

						var block = section[blockNumber];
						var text = $.trim( block['text'] );
						var characterCode = block['characterCode'];
						var color = block['color'];
						var textWithoutTags = that.getTextWithoutTags(text);
						var dialogId = scriptTabId + '-s-' + sectionNumber + '-b-' + blockNumber + '-dialog';

						var checkHasEndjmpTag = block['hasEndjmp'];

						var rowInfo = {
							'order': order,
							'section': sectionNumber,
							'blockNumber': blockNumber,
							'dialogId': dialogId,
							'characterCode': characterCode,
							'color': color,
							'textWithoutTags': textWithoutTags
						}
						var $tr = $( template.render(rowInfo) );
						var $textarea = $tr.find('textarea.text-field');

						$tbody.append($tr);
						$textarea.html(text);

						// Removing "add new block" button if there's an end tag inside the block
						if(checkHasEndjmpTag){
							$tr.find('a.add-new-block').remove();
						}

						order++;
					}
				}

				// Updating total counters in table footer
				$spanTotalSections.html(totalSections);
				$spanTotalDialogBlocks.html(totalDialogBlocks);
			}

			// Hiding loading indicator and calling callback after all files
			// area loaded
			that.hideLoadingIndicator();
			if(callback) callback();
		});
	}
	
	this.calculateMainContainerHeight = function(){
		var $divMainContainer = $('#main-container');
		var $divMainPanel = $divMainContainer.parent();
		
		var windowHeight = $(window).height();
		
		$divMainPanel.css('height', windowHeight);
		
		$(window).on('resize.calculateMainContainerHeight', this.calculateMainContainerHeight);
	}
	
	this.disableMainConteinerHeightCalculation = function(){
		var $divMainContainer = $('#main-container');
		var $divMainPanel = $divMainContainer.parent();
		
		$divMainPanel.css('height', 'auto');
		
		$(window).off('resize.calculateMainContainerHeight');
	}
	
	this.getTextWithoutTags = function(text){
		var destinationTool = this.destinationTool;
		
		if(destinationTool == 'opf'){
			text = text.replace(/<(.*?)>/g, '');
		} else {
			text = text.replace(/{(.*?)}/g, '');
		}
		text = text.replace(/\n/g, ' ');
		text = $.trim( text );
		return text;
	}
	
	this.instantiatePaginationDialogParsing = function(){
		var $dialogParserTables = $('table.dialog-parser-table');
		
		if($dialogParserTables.length == 0){
			return;
		}
		
		var that = this;
		
		$dialogParserTables.each(function(){
			var $dialogParserTable = $(this);
			
			var confirmLengthySearch = false;
			var limitRows = 5;
			var originalPage = 0;
			var originalLimitRows = limitRows;
			var filename = $dialogParserTable.attr('data-filename');

			// Instantiation
			var object = $dialogParserTable.on({
				// Table draw event
				'draw.dt': function(){
					var $tbody = $dialogParserTable.children('tbody');
					var $trs = $tbody.children('tr');
					
					var mobileShowInitially = that.configs.mobileShowInitially;
					var checkNoValidRows = (($trs.length == 0) || (($trs.length == 1) && ($trs.find('td.dataTables_empty').length == 1)));

					// If there's no valid rows, there's no need
					// to instantiate the components below
					if(checkNoValidRows){
						return;
					}

					// Saving selector with all textareas in an property, in order to
					// accessing it faster afterwards
					if(typeof that.dialogParserTableTextareas[filename] == 'undefined'){
						that.dialogParserTableTextareas[filename] = $();
					}
					if(that.dialogParserTableTextareas[filename].length == 0){
						var tableObject = $dialogParserTable.DataTable();
						that.dialogParserTableTextareas[filename] = $( tableObject.rows().nodes() ).find("textarea.text-field");
					}

					// Iterating over each visible row, instantiate "copy to clipboard"
					// buttons and update the preview
					$trs.each(function(){
						var $tr = $(this);
						var $textareaTextField = $tr.find('textarea.text-field');
						var $divDialogPreview = $tr.find('div.dialog-preview');
						var $tdFormFields = $tr.children('td.form-fields');
						var $tdPreviewConteiners = $tr.children('td.preview-conteiners');
						var $aShowPreviewMobile = $tr.find('a.show-preview-mobile');
						var $aShowTextfieldMobile = $tr.find('a.show-textfield-mobile');
						var $asCopyClipboard = $tr.find('a.copy-clipboard');

						var previewFieldId = $divDialogPreview.attr('id');

						that.updatePreview($textareaTextField, previewFieldId, 't');
						that.instantiateCopyClipboardButtons($asCopyClipboard, $textareaTextField);

						if(mobileShowInitially == 'p' && $tdPreviewConteiners.hasClass('hidden-xs')){
							$aShowTextfieldMobile.trigger('click');
						} else if(mobileShowInitially == 't' && $tdFormFields.hasClass('hidden-xs')){
							$aShowPreviewMobile.trigger('click');
						}
					});

					// Instantiating word highlighting on all visible textareas
					var $visibleTextareas = $tbody.find('textarea.text-field');
					that.highlightWordsTextareas($visibleTextareas);
				},
				// Pagination change event
				'page.dt': function(){
					var $dialogParserTableWrapper = $dialogParserTable.closest('div.dataTables_wrapper');
					
					var info = object.page.info();
					var currentPage = (info.page + 1);
					var previousPage;
					if($dialogParserTable.is("[data-current-page]")){
						previousPage = parseInt($dialogParserTable.attr('data-current-page'), 10);
					} else {
						previousPage = currentPage;
					}
					$dialogParserTable.attr('data-current-page', currentPage);

					if(currentPage < previousPage){
						that.lastColor = '';
					}

					// Scrolling to top of page, if not an automatic page change
					if(!that.automaticPageChange){
						$('html, body').animate({
							scrollTop: $dialogParserTableWrapper.offset().top
						}, 'slow');
					}
				},
				// Length change event ("Show" field)
				'length.dt': function(e, s){
					var $dialogParserTableWrapper = $dialogParserTable.closest('div.dataTables_wrapper');
					var $lengthField = $dialogParserTableWrapper.find('div.dataTables_length select');

					var length = s._iDisplayLength;
					var totalRows = object.data().length;

					// If user is trying to show all rows, and current script
					// has more than 500 rows, ask confirmation from user first.
					if(length == -1 && totalRows > 500 && !confirmLengthySearch){
						var confirm_message = "Esta pesquisa retornará muitos blocos e pode demorar um pouco.\n\n";
						confirm_message += 'Existe inclusive a possibilidade do seu navegador ficar congelado por alguns minutos, ';
						confirm_message += "dependendo da potência do seu computador, e/ou da quantidade de blocos desse script.\n\n";
						confirm_message += 'Deseja continuar?';
						var r = confirm(confirm_message);

						confirmLengthySearch = false;
						s._iDisplayStart = originalPage;
						s._iDisplayLength = originalLimitRows;

						if(r == true){
							confirmLengthySearch = true;
							originalPage = s._iDisplayStart;
							originalLimitRows = length;

							// Showing all rows, between a loading indicator
							that.showLoadingIndicator();
							setTimeout(function(){
								object.page.len(-1).draw();
								that.hideLoadingIndicator();
							}, 250);
						} else {
							setTimeout(function(){
								$lengthField.val(originalLimitRows);
							}, 250);
						}
					} else {
						originalLimitRows = length;
					}
				}
			}).DataTable({
				'order': [[0, 'asc']],
				columnDefs: [{
					orderable: false,
					targets: [1, 2]
				}],
				'autoWidth': false,
				'lengthMenu': [
					[1, 2, 3, 5, 7, 10, 15, 25, 50, 75, 100, 150, 200, 300, 400, 500, -1],
					[1, 2, 3, 5, 7, 10, 15, 25, 50, 75, 100, 150, 200, 300, 400, 500, 'Todos']
				],
				'pageLength': 5,
				'pagingType': 'input',
				"dom":  "<'row'<'col-sm-5'lf><'col-sm-2 hidden-xs'><'col-sm-5 paginate_col'p>>" +
						"<'row'<'col-sm-12'tr>>" +
						"<'row'<'col-sm-5'i><'col-sm-7 paginate_col'p>>",
				'language': {
					'sEmptyTable': 'Nenhum registro encontrado',
					'sInfo': '',
					'sInfoEmpty': '(Sem resultados)',
					'sInfoFiltered': '',
					'sInfoPostFix': '',
					'sInfoThousands': '.',
					'sLengthMenu': 'Exibir: _MENU_',
					'sLoadingRecords': 'Carregando...<br />Por favor, aguarde!',
					'sProcessing': 'Processando...<br />Por favor, aguarde!',
					'sZeroRecords': 'Nenhum registro encontrado',
					'sSearch': 'Pesquisar:',
					'oPaginate': {
						'sFirst': '<span class="glyphicon glyphicon-step-backward"></span>',
						'sPrevious': '<span class="glyphicon glyphicon-backward"></span>',
						'sNext': '<span class="glyphicon glyphicon-forward"></span>',
						'sLast': '<span class="glyphicon glyphicon-step-forward"></span>'
					},
					'oAria': {
						'sSortAscending': ': Ordenar colunas de forma ascendente',
						'sSortDescending': ': Ordenar colunas de forma descendente'
					}
				}
			});
			
			// Updating window title in order to prepend filename on it
			if($dialogParserTables.length == 1){
				var title = that.getTitle();
				that.setTitle(filename + ' - ' + title);
			}
		});
		
		// Disabling main conteiner height calculation, after instantiating
		// the pagination
		that.disableMainConteinerHeightCalculation();

		// Showing the rest of the options in the global actions menu
		var $dropdownGlobalActions = $('#global-actions-dropdown');
		$dropdownGlobalActions.children('li').show();

		// Asking user to save script before exiting
		$(window).on("beforeunload", function() { 
			return 'Há um ou mais arquivos abertos na aba "Tradutor de Diálogos". É recomendável salvá-los antes de sair.\nTem certeza que quer continuar?'; 
		});
	}
	
	this.instantiateEventMobileToggleFieldPreview = function(){
		var that = this;
		$(window).on('resize.mobileToggleFieldPreview', function () {
			var $dialogParserTables = $('table.dialog-parser-table');
			
			var mobileShowInitially = that.configs.mobileShowInitially;
			
			$dialogParserTables.each(function(){
				var $dialogParserTable = $(this);
				var $tbody = $dialogParserTable.children('tbody');
				
				var tableObject = $dialogParserTable.DataTable();
				var checkUpdateTable = false;

				$tbody.children('tr').each(function(){
					var $tr = $(this);
					var $buttonShowPreviewMobile = $tr.find('button.show-preview-mobile');
					var $buttonShowTextfieldMobile = $tr.find('button.show-textfield-mobile');

					if(mobileShowInitially == 'p'){
						$buttonShowTextfieldMobile.trigger('click');
						checkUpdateTable = true;
					} else if(mobileShowInitially == 't'){
						$buttonShowPreviewMobile.trigger('click');
						checkUpdateTable = true;
					}
				});

				if(checkUpdateTable) tableObject.draw(false);
			})
		});
	}
	
	this.highlightWordsTextareas = function(textareas){
		var $textareas = $(textareas);
		var $equivalenceTable = $('#equivalence-table');
		var $inputsOriginalNames = $equivalenceTable.find('input.original-name');
		var $inputsAdaptedNames = $equivalenceTable.find('input.adapted-name');
		
		var that = this;
		var theme = that.configs.theme;
		var themeColors = that.configs.highlightingColors[theme];
		var destinationTool = that.destinationTool;
		var originalNames = [], adaptedNames = [];
		$inputsOriginalNames.each(function(){
			originalNames.push(this.value);
		});
		$inputsAdaptedNames.each(function(){
			adaptedNames.push(this.value);
		});
		
		$textareas.each(function(){
			var $textarea = $(this);
			var $tdFormFields = $textarea.closest('td.form-fields');
			
			if($textarea.is("[data-highlight-instantiated='true']")){
				$textarea.appendTo($tdFormFields);
				$tdFormFields.find('div.highlightTextarea').remove();
				delete $textarea.data()['highlighter'];
			}
			
			$textarea.highlightTextarea({
				'words': [{
					'color': themeColors['tags'],
					'words': (destinationTool == 'opf') ? (['<(.+?)>']) : (['{(.+?)}'])
				}, {
					'color': themeColors['originalNames'],
					'words': originalNames
				}, {
					'color': themeColors['adaptedNames'],
					'words': adaptedNames
				}, {
					'color': themeColors['lineBreak'],
					'words': (destinationTool == 'opf') ? (['<b>']) : (['{b}'])
				}, {
					'color': themeColors['endSection'],
					'words': (destinationTool == 'opf') ? (['<endjmp>']) : (['{endjmp}'])
				}, {
					'color': themeColors['wait'],
					'words': (destinationTool == 'opf') ? (['<wait: [0-9]*>']) : (['{wait: [0-9]*}'])
				}]
			}).attr('data-highlight-instantiated', 'true');
		});
	}
	
	this.instantiateCopyClipboardButtons = function(as, textarea){
		var $as = $(as);
		var $textarea = $(textarea);
		
		var that = this;
		var destinationTool = that.destinationTool;
		
		$as.each(function(){
			var $a = $(this);

			var clipboard = new Clipboard(this, {
				'text': function(){
					var regex_tags;
					if(destinationTool == 'opf'){
						regex_tags = /<(.*?)>/g;
					} else {
						regex_tags = /{(.*?)}/g;
					}
					
					var text = $textarea.val();
					text = $.trim( text.replace(regex_tags, '').replace(/\n/g, ' ') );
					return text;
				}
			});

			clipboard.on('success', function(e) {
				var $test = $a.closest('tr').find('textarea.text-field, div.dialog-preview').filter(':visible');
				
				that.showPopover($test, 'Copiado para a área de transferência!', 'top', 'primary');
				setTimeout(function(){
					that.hidePopover($test);
				}, 5000);
			});
		})
	}
	
	this.showPreviewOnMobile = function(button){
		var $button = $(button);
		var $tr = $button.closest('tr');
		var $tdFormFields = $tr.find('td.form-fields');
		var $tdPreviewConteiners = $tr.find('td.preview-conteiners');
		var $textarea = $tdFormFields.find('textarea');
		
		if($tdPreviewConteiners.hasClass('visible-xs')){
			$tdFormFields.removeClass('hidden-xs').addClass('visible-xs');
			$tdPreviewConteiners.removeClass('visible-xs').addClass('hidden-xs');
		} else {
			$tdFormFields.removeClass('visible-xs').addClass('hidden-xs');
			$tdPreviewConteiners.removeClass('hidden-xs').addClass('visible-xs');
		}
		
		$textarea.trigger('keyup');
	}
	
	this.updatePreview = function(field, previewFieldId, textType, event, platform){
		if(typeof textType == 'undefined') textType = 't';
		if(typeof platform == 'undefined') platform = this.configs.platform;
		
		var checkPlatformDS = (platform == 'ds_jacutemsabao' || platform == 'ds_american' || platform == 'ds_european');
		
		var keyCode;
		if(typeof event != 'undefined'){
			keyCode = (typeof event.which != 'undefined') ? (event.which) : (0);
		} else {
			keyCode = 0;
		}
		
		var invalidKeycodes = [9, 16, 17, 18, 20, 27, 33, 34, 35, 36, 37, 38, 39, 40, 45, 91, 92, 93, 144, 145, 225];
		var checkKeycodeInvalid = ($.inArray(keyCode, invalidKeycodes) !== -1);
		if(checkKeycodeInvalid){
			return;
		}
		
		var $field = $(field);
		var $dialogParserTable = $field.closest('table.dialog-parser-table');
		var $divTextWithoutTags = $field.closest('td').children('div.text-without-tags');
		var $divPreview = $('#' + previewFieldId);
		
		var $previousField;
		if($dialogParserTable.length > 0){
			var filename = $dialogParserTable.attr('data-filename');
			$previousField = this.dialogParserTableTextareas[filename].filter("[data-order='" + (parseInt($field.attr('data-order'), 10) - 1) + "']");
		} else {
			$previousField = $();
		}
		
		var text = $field.val();
		var tag = false;
		var hasNameTag = false;
		var tagText = '';
		var checkFirstField = ($previousField.length == 0);
		var fieldSection = parseInt($field.attr('data-section'), 10);
		var previousFieldSection = parseInt($previousField.attr('data-section'), 10);
		var destinationTool = this.destinationTool;
		
		// Adding parent class for DS platform detection
		if(checkPlatformDS){
			$divPreview.addClass('ds');
		} else {
			$divPreview.removeClass('ds');
		}
		
		if(textType == 'c'){
			var $divCharacterName = $divPreview.children('div.character-name');
			$divCharacterName.html(text);
		} else if(textType == 't'){
			var $divTextWindow = $divPreview.children('div.text-window');
			var $divCharacterName = $divPreview.children('div.character-name');
			$divTextWindow.html('');
			
			// Setting platform for preview
			$divTextWindow.removeClass('n3ds ds_jacutemsabao ds_american ds_european');
			if(checkPlatformDS){
				$divTextWindow.addClass(platform);
			} else {
				$divTextWindow.addClass('n3ds');
			}
			
			// Inserting {b} when user presses enter
			if(keyCode == 13){
				var cursorPos = $field.prop('selectionStart') - 1;
				var textBefore = text.substring(0,  cursorPos);
				var textAfter  = $.trim( text.substring(cursorPos, text.length) );
				if(destinationTool == 'opf'){
					text = textBefore + '<b>\n' + textAfter;
				} else {
					text = textBefore + '{b}\n' + textAfter;
				}
				
				$field.val(text).prop('selectionEnd', cursorPos + 4).trigger('input');
			}
			
			// Defining last color, if from second field onwards
			if(!checkFirstField){
				// Setting color of previous field as last used color.
				// However, if the section changes, color must be resetted.
				var lastColor;
				if((fieldSection == previousFieldSection)){
					lastColor = parseInt($previousField.attr('data-color'), 10);
				} else {
					lastColor = 0;
				}
				this.lastColor = this.getColorClass(lastColor);
			}
			
			// Iterating over all characters inside text field
			for (var i = 0, size = text.length; i < size; i++) {
				var char = text[i];
				
				if(destinationTool == 'opf'){
					if(char == "<"){
						tag = true;
					} else if(char == ">"){
						tag = false;
					}
				} else {
					if(char == "{"){
						tag = true;
					} else if(char == "}"){
						tag = false;
					}
				}
				
				if(tag){
					if(destinationTool == 'opf'){
						if(char != '<'){
							tagText += char;
						}
					} else {
						if(char != '{'){
							tagText += char;
						}
					}
				} else {
					// Tags for all contexts
					if(tagText == 'b'){
						$divTextWindow.append('<br />');
					} else if(((destinationTool == 'opf' && char != '>') || (destinationTool != 'opf' && char != '}')) && char != '\n'){
						var newChar = this.formatChar(char);

						$divTextWindow.append(
							$('<span />').addClass('letter ' + newChar + ' ' + this.lastColor).html('&nbsp;')
						);
					} else {
						// Specific tags for dialog parsing
						if(tagText.startsWith('name:')){
							hasNameTag = true;

							var tmp = tagText.split(':');
							var characterCode = parseInt(tmp.pop(), 10);
							this.lastName = this.getName(characterCode);
						} else if(tagText.startsWith('color:')){
							var tmp = tagText.split(':');
							var colorCode = parseInt(tmp.pop(), 10);
							
							this.lastColor = this.getColorClass(colorCode);
						} else if(tagText.startsWith('center_text:')){
							var tmp = tagText.split(':');
							var centerCode = parseInt(tmp.pop(), 10);
							if(centerCode == 1){
								$divTextWindow.addClass('centered');
							} else {
								$divTextWindow.removeClass('centered');
							}
						} else if(tagText == 'p' || tagText == 'nextpage_button'){
							$divTextWindow.remove('span.caret').append(
								$('<span />').addClass('caret').html('&nbsp;')
							);
						}
					}
					tagText = '';
				}
			}
			
			if(!hasNameTag){
				var code_server = $divCharacterName.attr('data-character-code');
				this.lastName = this.getName(code_server);
			}

			$divCharacterName.html(this.lastName);

			var regex_tag;
			if(destinationTool == 'opf'){
				regex_tag = /<(.*?)>/g;
			} else {
				regex_tag = /{(.*?)}/g;
			}
			$divTextWithoutTags.html( $.trim( text.replace(regex_tag, '').replace(/\n/g, ' ') ) );

			// Analysing current block
			var returnAnalysis = this.analyzeScriptBlock($divTextWindow);
			if(returnAnalysis !== true){
				$divTextWindow.closest('div.dialog-preview').addClass('invalid').attr('title', returnAnalysis.message);
			} else {
				$divTextWindow.closest('div.dialog-preview').removeClass('invalid').removeAttr('title');
			}
		}
	}
	
	this.updateRow = function(field){
		var $field = $(field);
		var $trField = $field.closest('tr');
		var $dialogParserTable = $trField.closest('table.dialog-parser-table');
		var tableObject = $dialogParserTable.DataTable();
		
		tableObject.row($trField).invalidate();
	}
	
	this.getName = function(code){
		var $equivalenceTable = $('#equivalence-table');
		var $tbodyEquivalenceTable = $equivalenceTable.children('tbody');
		var $inputName;
		
		if(this.configs.nameType == 'a'){
			$inputName = $tbodyEquivalenceTable.find("[name='character[" + code + "][adapted_name]']");
		} else {
			$inputName = $tbodyEquivalenceTable.find("[name='character[" + code + "][original_name]']");
		}
		
		if($inputName.length > 0){
			return $inputName.val();
		} else {
			return '???';
		}
	}
	
	this.showScriptConfigSettings = function(){
		var $divConfigSettings = $('#config-settings');
		var $divColorpickerFields = $('div.colorpicker-component');
		
		// Showing modal
		$divConfigSettings.modal('show');
		
		// Instantiating colorpicker components
		$divColorpickerFields.colorpicker();
		
		// Loading configs into form
		this.loadConfigsForm();
	}
	
	this.loadConfigsForm = function(){
		var $radioGameFieldAA1 = $('#config-game-field-aa1');
		var $radioGameFieldAA2 = $('#config-game-field-aa2');
		var $radioGameFieldAA3 = $('#config-game-field-aa3');
		var $radioNameTypeOriginal = $('#config-name-type-original');
		var $radioNameTypeAdapted = $('#config-name-type-adapted');
		var $radioPlatform3DS = $('#config-platform-3ds');
		var $radioPlatformDSJTS = $('#config-platform-ds-jacutemsabao');
		var $radioPlatformDSAmerican = $('#config-platform-ds-american');
		var $radioPlatformDSEuropean = $('#config-platform-ds-european');
		var $radioInvalidateLargeLinesTrue = $('#invalidate-large-lines-true');
		var $radioInvalidateLargeLinesFalse = $('#invalidate-large-lines-false');
		var $radioMobileShowInitiallyPreview = $('#config-mobile-show-initially-preview');
		var $radioMobileShowInitiallyTextfield = $('#config-mobile-show-initially-textfield');
		var $radioThemeLight = $('#config-theme-light');
		var $radioThemeDark = $('#config-theme-dark');
		var $divColorpickerFields = $('div.colorpicker-component');
		
		// Checking default options for each field
		if(this.configs.game == 'aa3'){
			$radioGameFieldAA3.prop('checked', true);
		} else if(this.configs.game == 'aa2'){
			$radioGameFieldAA2.prop('checked', true);
		} else {
			$radioGameFieldAA1.prop('checked', true);
		}
		if(this.configs.nameType == this.defaultConfigs.nameType){
			$radioNameTypeOriginal.prop('checked', true);
		} else {
			$radioNameTypeAdapted.prop('checked', true);
		}
		if(this.configs.platform == 'ds_jacutemsabao'){
			$radioPlatformDSJTS.prop('checked', true);
		} else if(this.configs.platform == 'ds_american'){
			$radioPlatformDSAmerican.prop('checked', true);
		} else if(this.configs.platform == 'ds_european'){
			$radioPlatformDSEuropean.prop('checked', true);
		} else {
			$radioPlatform3DS.prop('checked', true);
		}
		if(this.configs.invalidateLargeLines == this.defaultConfigs.invalidateLargeLines){
			$radioInvalidateLargeLinesTrue.prop('checked', true);
		} else {
			$radioInvalidateLargeLinesFalse.prop('checked', true);
		}
		if(this.configs.mobileShowInitially == this.defaultConfigs.mobileShowInitially){
			$radioMobileShowInitiallyPreview.prop('checked', true);
		} else {
			$radioMobileShowInitiallyTextfield.prop('checked', true);
		}
		if(this.configs.theme == this.defaultConfigs.theme){
			$radioThemeLight.prop('checked', true);
		} else {
			$radioThemeDark.prop('checked', true);
		}
		
		// Loading default highlighting colors
		var that = this;
		$divColorpickerFields.each(function(){
			var $div = $(this);
			var $input = $div.children('input');
			
			var name = $input.attr('name');
			var dataInBrackets = name.match(/\[(.*?)\]\[(.*?)\]/);
			var theme = dataInBrackets[1];
			var type = dataInBrackets[2];
			var color = that.configs.highlightingColors[theme][type];
			
			$input.val(color).trigger('change');
		});
		
		// Avoid form resetting default behaviour
		return false;
	}
	
	this.loadDefaultConfigs = function(){
		var $radioGameFieldAA1 = $('#config-game-field-aa1');
		var $radioGameFieldAA2 = $('#config-game-field-aa2');
		var $radioGameFieldAA3 = $('#config-game-field-aa3');
		var $radioNameTypeOriginal = $('#config-name-type-original');
		var $radioNameTypeAdapted = $('#config-name-type-adapted');
		var $radioPlatform3DS = $('#config-platform-3ds');
		var $radioPlatformDSJTS = $('#config-platform-ds-jacutemsabao');
		var $radioPlatformDSAmerican = $('#config-platform-ds-american');
		var $radioPlatformDSEuropean = $('#config-platform-ds-european');
		var $radioInvalidateLargeLinesTrue = $('#invalidate-large-lines-true');
		var $radioInvalidateLargeLinesFalse = $('#invalidate-large-lines-false');
		var $radioMobileShowInitiallyPreview = $('#config-mobile-show-initially-preview');
		var $radioMobileShowInitiallyTextfield = $('#config-mobile-show-initially-textfield');
		var $radioThemeLight = $('#config-theme-light');
		var $radioThemeDark = $('#config-theme-dark');
		var $divColorpickerFields = $('div.colorpicker-component');
		
		// Checking default options for each field
		if(this.defaultConfigs.game == 'aa3'){
			$radioGameFieldAA3.prop('checked', true);
		} else if(this.defaultConfigs.game == 'aa2'){
			$radioGameFieldAA2.prop('checked', true);
		} else {
			$radioGameFieldAA1.prop('checked', true);
		}
		if(this.defaultConfigs.nameType == 'o'){
			$radioNameTypeOriginal.prop('checked', true);
		} else {
			$radioNameTypeAdapted.prop('checked', true);
		}
		if(this.defaultConfigs.platform == 'ds_jacutemsabao'){
			$radioPlatformDSJTS.prop('checked', true);
		} else if(this.defaultConfigs.platform == 'ds_american'){
			$radioPlatformDSAmerican.prop('checked', true);
		} else if(this.defaultConfigs.platform == 'ds_european'){
			$radioPlatformDSEuropean.prop('checked', true);
		} else {
			$radioPlatform3DS.prop('checked', true);
		}
		if(this.defaultConfigs.invalidateLargeLines){
			$radioInvalidateLargeLinesTrue.prop('checked', true);
		} else {
			$radioInvalidateLargeLinesFalse.prop('checked', true);
		}
		if(this.defaultConfigs.mobileShowInitially == 'p'){
			$radioMobileShowInitiallyPreview.prop('checked', true);
		} else {
			$radioMobileShowInitiallyTextfield.prop('checked', true);
		}
		if(this.defaultConfigs.theme == 'light'){
			$radioThemeLight.prop('checked', true);
		} else {
			$radioThemeDark.prop('checked', true);
		}
		
		// Loading default highlighting colors
		var that = this;
		$divColorpickerFields.each(function(){
			var $div = $(this);
			var $input = $div.children('input');
			
			var name = $input.attr('name');
			var dataInBrackets = name.match(/\[(.*?)\]\[(.*?)\]/);
			var theme = dataInBrackets[1];
			var type = dataInBrackets[2];
			var color = that.defaultConfigs.highlightingColors[theme][type];
			
			$input.val(color).trigger('change');
		});
		
		// Avoid form resetting default behaviour
		return false;
	}
	
	this.hideScriptConfigSettings = function(){
		$('#config-settings').modal('hide');
	}
	
	this.saveConfigs = function(){
		var $radioGameField = $("input[name='config-game-field']:checked");
		var $radioNameType = $("input[name='config-name-type']:checked");
		var $radioPlatform = $("input[name='config-platform']:checked");
		var $radioInvalidateLargeLines = $("input[name='invalidate-large-lines']:checked");
		var $radioMobileShowInitially = $("input[name='config-mobile-show-initially']:checked");
		var $radioTheme = $("input[name='config-theme']:checked");
		var $divColorpickerFields = $('div.colorpicker-component');
		
		var checkGameFieldChanged = ($radioGameField.val() != this.configs.game);
		var checkNameTypeChanged = ($radioNameType.val() != this.configs.nameType);
		var checkPlatformChanged = ($radioPlatform.val() != this.configs.platform);
		var checkInvalidateLargeLinesChanged = (/^true$/i.test($radioInvalidateLargeLines.val()) != this.configs.invalidateLargeLines);
		var checkMobileShowInitiallyChanged = ($radioMobileShowInitially.val() != this.configs.mobileShowInitially);
		var checkThemeChanged = ($radioTheme.val() != this.configs.theme);
		
		this.hideScriptConfigSettings();
		this.showLoadingIndicator();
		
		var that = this;
		setTimeout(function(){
			if(checkGameFieldChanged) that.loadEquivalenceTableFromFileForm( $radioGameField.val() );
			if(checkNameTypeChanged) that.changeDefaultNameTypes( $radioNameType[0] );
			if(checkPlatformChanged) that.changePreviewPlatform( $radioPlatform[0] );
			if(checkInvalidateLargeLinesChanged) that.toggleLargeLinesInvalidation( $radioInvalidateLargeLines[0] );
			if(checkMobileShowInitiallyChanged) that.changeMobileShowInitially( $radioMobileShowInitially[0] );
			if(checkThemeChanged) that.changeTheme( $radioTheme[0] );
			that.updateHighlightingColors( $divColorpickerFields );

			that.hideLoadingIndicator();
		}, 25);
		
		// Needed to avoid form submission
		return false;
	}
	
	this.updateHighlightingColors = function(divColorpickerFields){
		var that = this;
		var checkAtLeastOneColorChanged = false;
		
		// Updating colors and detecting if at least one change was made
		var $divColorpickerFields = $(divColorpickerFields);
		$divColorpickerFields.each(function(){
			var $input =  $(this).children('input');
			
			var name = $input.attr('name');
			var dataInBrackets = name.match(/\[(.*?)\]\[(.*?)\]/);
			var theme = dataInBrackets[1];
			var type = dataInBrackets[2];
			var newColor = $input.val();
			var previousColor = that.configs.highlightingColors[theme][type];
			
			if(newColor != previousColor){
				checkAtLeastOneColorChanged = true;
				that.configs.highlightingColors[theme][type] = newColor;
			}
		});
		
		// Update table, since there's at least one color change
		if(checkAtLeastOneColorChanged){
			var $dialogParserTables = $('table.dialog-parser-table');
			$dialogParserTables.each(function(){
				var tableObject = $(this).DataTable();
				tableObject.draw(false);
			});
		}
	}
	
	this.showScriptSaveSettings = function(){
		var $dialogParserTables = $('table.dialog-parser-table');
		var $divSaveSettings = $('#save-settings');
		var $saveNameField = $('#save-name-field');
		var $saveFileFormat = $('#save-file-format');
		var $spanFilenameExtension = $('#filename-extension');
		
		var filename;
		if($dialogParserTables.length > 1){
			filename = 'teste';
		} else {
			filename = $dialogParserTables.first().attr('data-filename');
		}
		filename = filename.replace(/\..+$/, '');
		var saveFormat = this.saveFormat;
		var extension = '.txt';
		
		// Appending current date / time into the filename
		var data = new Date();
		data = new Date(data.getTime() - (data.getTimezoneOffset() * 60000)).toJSON();
		data = data.slice(0, 19).replace(/T/g, '-').replace(/:/g, '-');
		filename += ' (' + data + ')';
		
		// Triggering click on first main tab, in case of the user has clicked
		// on another tab
		this.triggerClickOnFirstMainTab();
		
		// Showing save settings modal window, and filling the form fields afterwards
		$divSaveSettings.modal('show');
		$saveNameField.val(filename).focus();
		$saveFileFormat.val(saveFormat);
		$spanFilenameExtension.html(extension);
	}
	
	this.hideScriptSaveSettings = function(){
		$('#save-settings').modal('hide');
	}
	
	this.showScriptAnalysisSettings = function(){
		var $divAnalysisSettings = $('#analysis-settings');
		
		var $tbodyAnalysisResultsTable = $('#analysis-results-table').children('tbody');
		
		// Triggering click on first main tab, in case of the user has clicked
		// on another tab
		this.triggerClickOnFirstMainTab();
		
		// If there's previous analysis results, show them instead
		var checkHasPreviousAnalysisResults = ($tbodyAnalysisResultsTable.children('tr').not('.empty').length > 0);
		if(checkHasPreviousAnalysisResults){
			this.changeTitleScriptAnalysisResults('Resultados da Última Análise');
			this.showScriptAnalysisResults();
			return;
		}
		
		// Showing analysis settings modal, and filling form fields afterwards
		$divAnalysisSettings.modal('show');
		if(this.configs.invalidateLargeLines){
			$('#analysis-invalidate-large-lines-true').prop('checked', true);
		} else {
			$('#analysis-invalidate-large-lines-false').prop('checked', true);
		}
	}
	
	this.hideScriptAnalysisSettings = function(){
		$('#analysis-settings').modal('hide');
	}
	
	this.startNewScriptAnalysis = function(){
		if(confirm('Os resultados da última análise serão perdidos. Confirmar?') == true){
			var $tbodyAnalysisResultsTable = $('#analysis-results-table').children('tbody');
			$tbodyAnalysisResultsTable.html('');

			this.hideScriptAnalysisResults();
			this.showScriptAnalysisSettings();
		}
	}
	
	this.showScriptAnalysisResults = function(){
		$('#analysis-results').modal('show');
	}
	
	this.changeTitleScriptAnalysisResults = function(title){
		if(typeof title == 'undefined') title = 'Resultados da Análise';
		$('#analysis-results').find('h4.modal-title').html(title);
	}
	
	this.hideScriptAnalysisResults = function(){
		$('#analysis-results').modal('hide');
	}
	
	this.showScriptExportSettings = function(){
		var $divExportSettings = $('#export-settings');
		var $selectScript = $('#export-script');
		var $inputNameField = $('#export-name-field');
		
		// Loading options for script field, based on the opened files
		var currentlyActiveScriptTabId = 'script-tab-0';
		var filename = '';
		$selectScript.html('');
		for(var i in this.openedFiles){
			var file = this.openedFiles[i];
			
			var $option = $('<option />').val(file.scriptTabId).html(file.filename);
			if(file.scriptTabId == currentlyActiveScriptTabId){
				$option.attr('selected', 'selected');
				filename = (file.filename).replace(/\..+$/, '');
			}
			
			$selectScript.append($option);
		}
		
		// Adding current date time in the filename
		var data = new Date();
		data = new Date(data.getTime() - (data.getTimezoneOffset() * 60000)).toJSON();
		data = data.slice(0, 19).replace(/T/g, '-').replace(/:/g, '-');
		filename += ' (' + data + ')';
		
		// Triggering click on first main tab, in case of the user has clicked
		// on another tab
		this.triggerClickOnFirstMainTab();
		
		// Showing export settings modal, and filling the form fields afterwards
		$divExportSettings.modal('show');
		$inputNameField.val(filename).focus();
	}
	
	this.hideScriptExportSettings = function(){
		$('#export-settings').modal('hide');
	}
	
	this.openAboutPage = function(){
		window.open('https://github.com/leomontenegro6/aade-mobile');
	}
	
	this.toggleFileOrigin = function(radio){
		var $radio = $(radio);
		var $inputFileField = $('#file-field');
		var $divTestScriptsList = $('#test-scripts-list');
		var $divScriptsFolderList = $('#scripts-folder-list');
		
		var fileOrigin = $radio.val();
		if(fileOrigin == 'f'){ // File input
			$inputFileField.removeAttr('disabled').attr('required', 'required');
			
			$divScriptsFolderList.hide().find("[type='checkbox']").prop('checked', false).removeAttr('required').closest("label").removeClass('active');
			
			$divTestScriptsList.hide().find("[type='radio']").prop('checked', false).removeAttr('required').closest("label").removeClass('active');
			
			$inputFileField.trigger('click');
			setTimeout(function(){
				$radio.prop('checked', false).parent().removeClass('active');
				$inputFileField.attr('disabled', 'disabled').removeAttr('required');
			}, 25);
		} else if(fileOrigin == 't'){ // Test scripts
			$inputFileField.attr('disabled', 'disabled').removeAttr('required');
			
			$divScriptsFolderList.hide().find("[type='checkbox']").prop('checked', false).removeAttr('required');
			
			$divTestScriptsList.show().find("[type='radio']").attr('required', 'required');
		}
	}
	
	this.changePreviewPlatform = function(radio){
		var $radio = $(radio);
		
		var platform = $radio.val();
		stash.set('platform', platform);
		
		this.loadConfigs();
		
		this.updatePreviewVisibleTextareas();
	}
	
	this.changeDefaultGame = function(radio){
		var $radio = $(radio);
		
		var game = $radio.val();
		stash.set('game', game);
		
		this.loadConfigs();
		
		this.updatePreviewVisibleTextareas();
	}
	
	this.changeDefaultNameTypes = function(radio){
		var $radio = $(radio);
		
		var nameType = $radio.val();
		stash.set('nameType', nameType);
		
		this.loadConfigs();
		
		this.updatePreviewVisibleTextareas();
	}
	
	this.changeDestinationTool = function(radio){
		var $radio = $(radio);
		
		var destinationTool = $radio.val();	
	
		this.destinationTool = destinationTool;
	}
	
	this.changeMobileShowInitially = function(radio){
		var $radio = $(radio);
		var $dialogParserTables = $('table.dialog-parser-table');
		
		var mobileShowInitially = $radio.val();
		stash.set('mobileShowInitially', mobileShowInitially);
		
		this.loadConfigs();
		
		this.updatePreviewVisibleTextareas();
		
		$dialogParserTables.each(function(){
			var tableObject = $(this).DataTable();
			tableObject.draw(false);
		});
	}
	
	this.changeSaveFormat = function(select){
		var $select = $(select);
		
		var saveFormat = $select.val();	
	
		this.saveFormat = saveFormat;
	}
	
	this.toggleLargeLinesInvalidation = function(radio){
		var $radio = $(radio);
		
		var invalidateLargeLines = $radio.val();
		
		stash.set('invalidateLargeLines', (invalidateLargeLines == 'true'));
		
		this.loadConfigs();
	}
	
	this.updatePreviewVisibleTextareas = function(){
		var $dialogParserTable = $('table.dialog-parser-table:visible');
		var $textareas = $dialogParserTable.find('textarea');
		$textareas.trigger('keyup');
	}
	
	this.addNewDialogBlock = function(a){
		var $a = $(a);
		var $tr = $a.closest('tr');
		var $divDialogPreview = $a.closest('div.dialog-preview');
		var $divCharacterName = $divDialogPreview.children('div.character-name');
		var $dialogParserTable = $tr.closest('table.dialog-parser-table');
		
		var tableObject = $dialogParserTable.DataTable();
		var filename = $dialogParserTable.attr('data-filename');
		var scriptTabId = $dialogParserTable.attr('id');
		
		var that = this;
		var characterCode = $divCharacterName.attr('data-character-code');
		var destinationTool = that.destinationTool;
		var mobileShowInitially = that.configs.mobileShowInitially;
		var regex_brackets;
		if(destinationTool == 'opf'){
			regex_brackets = /\&[A-z]*;/g;
		} else {
			regex_brackets = /[{}]/g;
		}
		var currentOrder = parseFloat( $tr.find('.order').first().html() );
		var currentSection = ( $tr.find('.section').first().html() ).replace(regex_brackets, '');
		var currentBlockNumber = parseFloat( $tr.find('.block-number').first().html() );
		
		var newOrder = (currentOrder + 0.01).toFixed(2);
		var newBlockNumber = (currentBlockNumber + 0.01).toFixed(2);
		var newDialogId = scriptTabId + '-s-' + currentSection + '-b-' + (newOrder.toString().replace(/\./g, '_')) + '-dialog';
		
		$.get('dialog-parser-row.html').then(function(response){
			var template = $.templates(response);
			
			var rowInfo = {
				'order': newOrder,
				'section': currentSection,
				'blockNumber': newBlockNumber,
				'dialogId': newDialogId,
				'characterCode': '',
				'textWithoutTags': ''
			}
			var $newTr = $( template.render(rowInfo) );
			var $newTdPreviewConteiners = $newTr.children('td.preview-conteiners');
			var $newTdFormFields = $newTr.children('td.form-fields');
			var $newTextarea = $newTdFormFields.find('textarea');
			var $newDivCharacterName = $newTdPreviewConteiners.find('div.character-name');

			// Setting name from previous block into the new one
			$newDivCharacterName.attr('data-character-code', characterCode);
			
			// Updating selector property with all textareas in an property
			tableObject.row.add($newTr);
			that.dialogParserTableTextareas[filename] = $( tableObject.rows().nodes() ).find("textarea.text-field");
			tableObject.draw(false);

			// Adding end block tag in the new block, according to the script format.
			if(destinationTool == 'opf'){
				$newTdFormFields.find('textarea').val('<p>');
			} else {
				$newTdFormFields.find('textarea').val('{p}');
			}
			
			// Adding remove button
			var $newActionMenus = $newTdPreviewConteiners.find('ul.dropdown-menu');
			var $newButtonRemoveDialogBlock = $('<li />').html(
				$('<a />').addClass('remove-block').attr({
					'href': '#',
					'tabindex': '-1',
					'onclick': 'aade.removeDialogBlock(this); event.preventDefault()'
				}).html("<span class='glyphicon glyphicon-minus'></span>\nRemover bloco de diálogo")
			);
			$newActionMenus.append($newButtonRemoveDialogBlock[0].outerHTML);

			// Incrementing row counter in the footer of the table
			that.incrementTotalDialogsFooter();

			// Focusing new textarea and placing cursor at beginning of the field
			if(mobileShowInitially == 't'){
				$newTextarea.focus();
				$newTextarea[0].setSelectionRange(0, 0);
			}
		});
	}
	
	this.removeDialogBlock = function(button){
		var $button = $(button);
		var $tr = $button.closest('tr');
		var $dialogParserTable = $tr.closest('table.dialog-parser-table');
		
		var tableObject = $dialogParserTable.DataTable();
		var filename = $dialogParserTable.attr('data-filename');
		
		// Updating selector property with all textareas in an property
		tableObject.row($tr).remove();
		this.dialogParserTableTextareas[filename] = $( tableObject.rows().nodes() ).find("textarea.text-field");
		tableObject.draw(false);
		
		this.decrementTotalDialogsFooter();
	}
	
	this.incrementTotalDialogsFooter = function(){
		var $dialogParserTable = $('table.dialog-parser-table:visible');
		var $tfoot = $dialogParserTable.children('tfoot');
		var $spanTotalDialogBlocks = $tfoot.find('span.total-dialog-blocks');
		var total = parseInt($spanTotalDialogBlocks.html(), 10);
		
		total++;
		
		$spanTotalDialogBlocks.html(total);
	}
	
	this.decrementTotalDialogsFooter = function(){
		var $dialogParserTable = $('table.dialog-parser-table:visible');
		var $tfoot = $dialogParserTable.children('tfoot');
		var $spanTotalDialogBlocks = $tfoot.find('span.total-dialog-blocks');
		var total = parseInt($spanTotalDialogBlocks.html(), 10);
		
		total--;
		
		$spanTotalDialogBlocks.html(total);
	}
	
	this.toggleValueFields = function(selectFilterType){
		var $selectFilterType = $(selectFilterType);
		var $divOrder = $('#div-goto-row-order');
		var $divBlockNumber = $('#div-goto-row-block-number');
		var $divSection = $('#div-goto-row-section');
		var $inputOrder = $('#goto-row-order');
		var $inputBlockNumber = $('#goto-row-block-number');
		var $inputSection = $('#goto-row-section');
		
		var filterType = $selectFilterType.val();
		
		if(filterType == 'o'){
			$divOrder.show();
			$divSection.add($divBlockNumber).hide();
			$inputSection.add($inputBlockNumber).val('');
		} else {
			$divOrder.hide();
			$divSection.add($divBlockNumber).show();
			$inputOrder.val('');
		}
	}
	
	this.maskFilterInput = function(event){
		// Allow: backspace, delete, tab, escape and enter
		if ($.inArray(event.keyCode, [46, 8, 9, 27, 13, 110]) !== -1 ||
			 // Allow: Ctrl+A, Command+A
			(event.keyCode === 65 && (event.ctrlKey === true || event.metaKey === true)) || 
			 // Allow: home, end, left, right, down, up
			(event.keyCode >= 35 && event.keyCode <= 40)) {
				 // let it happen, don't do anything
				 return true;
		}
		// Ensure that it is a number and stop the keypress
		if ((event.shiftKey || (event.keyCode < 48 || event.keyCode > 57)) && (event.keyCode < 96 || event.keyCode > 105)) {
			return false;
		} else {
			return true;
		}
	}
	
	this.maskFilenameInput = function(event){
		var keyCode = event.which;
		
		var invalidKeycodes = [106, 111, 188, 191, 192, 220, 221, 225];
		var checkKeycodeInvalid = ($.inArray(keyCode, invalidKeycodes) !== -1);
		if(checkKeycodeInvalid){
			return false;
		} else {
			return true;
		}
	}
	
	this.previewScripts = function(){
		var that = this;
		
		that.triggerClickOnFirstMainTab();
		that.showLoadingIndicator();
		
		setTimeout(function(){
			var scriptText = that.generateScriptText();
			
			that.hideLoadingIndicator();
			
			that.showTextPreview(scriptText);
		}, 500);
	}
	
	this.showTextPreview = function(scriptText){
		var $divTextPreview = $('#text-preview');
		var $textareaPreview = $divTextPreview.find('textarea');
		
		$divTextPreview.on({
			'shown.bs.modal': function(){
				$textareaPreview.val(scriptText);
			},
			'hidden.bs.modal': function(){
				$textareaPreview.val('');
			}
		});
		$divTextPreview.modal('show');
	}
	
	this.saveScripts = function(saveFileForm){
		var $saveNameField = $('#save-name-field');
		
		var that = this;
		that.hideScriptSaveSettings();
		that.showLoadingIndicator();
		
		var scriptsToSave = ( this.openedFiles ).slice(0);
		var currentScriptNumber = 0;
		var saveFormat = that.saveFormat;
		var scriptsTexts = [];
		
		var saveScript = function(scriptsToSave){
			setTimeout(function(){
				// Getting first script from the list and remove it from the main array
				var currentScript = scriptsToSave.shift();
				
				scriptsTexts.push({
					'filename': currentScript.filename,
					'text': that.generateScriptText(currentScript.scriptTabId)
				});
				
				// Updating processing indicator with the current progress percentage
				var percentage = Math.ceil( (currentScriptNumber / 1) * 100 );
				that.updateProcessingIndicator('default', percentage);
				currentScriptNumber++;
				
				// Checking if there's at least one more script to save
				if(scriptsToSave.length > 0){
					// More than one script to save, so call the recursive function
					// again, passing the main array of scripts as parameter
					saveScript(scriptsToSave);
				} else {
					// All scripts saved, so proceed with the generation of the files
					var finalFilename = $saveNameField.val() + '.txt';
					var scriptText = scriptsTexts[0];
					var text = scriptText.text;

					if(saveFormat == 'ansi'){
						// Saving script in ANSI encoding
						var scriptBinary = new Uint8Array(text.length);
						for(var i = 0; i < scriptBinary.length; i++) {
							var charCode = text.charCodeAt(i);

							scriptBinary[i] = charCode;
						}

						safeSave(finalFilename, scriptBinary);
					} else if(saveFormat == 'utf-8_without_bom'){
						// Saving script in UTF-8 without BOM
						saveAs(new Blob([text], {type: 'text/plain;charset=utf-8'}), finalFilename, true);
					} else {
						// Saving script in UTF-8 with BOM
						saveAs(new Blob([text], {type: 'text/plain;charset=utf-8'}), finalFilename, false);
					}

					that.hideLoadingIndicator();
				}
			}, 1);
		}
		saveScript(scriptsToSave);
		
		// Needed to avoid form submission
		return false;
	}
	
	this.showNotify = function(message, type){
		if(typeof type == 'undefined') type = 'info';
		var icon;
		if(type == 'warning' || type == 'danger'){
			icon = 'warning-sign';
		} else {
			icon = 'info-sign';
		}
		
		$.notify({
			icon: 'glyphicon glyphicon-' + icon,
			message: message
		}, {
			type: type
		});
	}
	
	this.exportScript = function(){
		var $inputNameField = $('#export-name-field');
		var $selectFormatField = $('#export-format-field');
		
		var scriptTabId = 'script-tab-0';
		var filename = $inputNameField.val();
		var format = $selectFormatField.val();
		
		var that = this;
		
		that.hideScriptExportSettings();
		that.showLoadingIndicator();
		
		setTimeout(function(){
			var exportedScriptText = convertHtmlToRtf( that.generateExportedScriptText(scriptTabId) );
			
			that.hideLoadingIndicator();
			
			var filenameWithFormat = filename + '.' + format;
			
			var blob = new Blob([exportedScriptText], {type: "text/plain"});
			saveAs(blob, filenameWithFormat, true);
		}, 25);
		
		// Needed to avoid form submission
		return false;
	}
	
	this.generateScriptText = function(scriptTabId){
		if(typeof scriptTabId == 'undefined') scriptTabId = 'script-tab-0';
		
		var $dialogParserTable = $('#' + scriptTabId);
		var tableObject = $dialogParserTable.DataTable();
		
		var destinationTool = this.destinationTool;
		var scriptText = '';
		var scriptSections = [];

		$( tableObject.rows().nodes() ).find('textarea.text-field').sort(function(a, b){
			// Sort all textareas by id attribute, to avoid messing
			// with the order of dialogues
			return parseFloat( $(a).attr('data-order') ) - parseFloat( $(b).attr('data-order') );
		}).each(function(){
			var $textarea = $(this);
			var section = $textarea.attr('data-section');
			var text = $textarea.val();

			var checkSectionInserted = ($.inArray(section, scriptSections) !== -1);
			if(!checkSectionInserted){
				scriptSections.push(section);
				
				if(destinationTool == 'opf'){
					scriptText += ('\n\n<<' + section + '>>\n');
				} else {
					scriptText += ('\n\n{{' + section + '}}\n');
				}
			}

			scriptText += (text + '\n');
		});
		
		return scriptText;
	}
	
	this.generateExportedScriptText = function(scriptTabId){
		if(typeof scriptTabId == 'undefined') scriptTabId = 'script-tab-0';
		
		var $dialogParserTable = $('#' + scriptTabId);
		var tableObject = $dialogParserTable.DataTable();
		
		var destinationTool = this.destinationTool;
		var scriptText = "<b>SCRIPT DUMPADO APENAS PARA FINS DE ANÁLISE E REVISÃO</b><br />";
		scriptText += "<b>NÃO TRADUZA O SCRIPT POR AQUI, MAS SIM PELO PRÓPRIO AADE!</b><br /><br />";
		var scriptSections = [];
		var that = this;
		var characterCode = null;

		$( tableObject.rows().nodes() ).find('textarea.text-field').sort(function(a, b){
			// Sort all textareas by id attribute, to avoid messing
			// with the order of dialogues
			return parseFloat( $(a).attr('data-order') ) - parseFloat( $(b).attr('data-order') );
		}).each(function(){
			var $textarea = $(this);
			var order = $textarea.attr('data-order');
			var section = $textarea.attr('data-section');
			var block = $textarea.attr('data-block');
			var text = $textarea.val();
			
			// Getting character name
			var characterTags;
			if(destinationTool == 'opf'){
				characterTags = text.match(/<name:[ ]*[0-9]*>/g);
			} else {
				characterTags = text.match(/{name:[ ]*[0-9]*}/g);
			}
			if(characterTags != null && characterTags.length > 0){
				var tagText = characterTags[0];
				var tmp = tagText.split(':');
				characterCode = parseInt(tmp.pop(), 10);
			}
			var characterName = that.getName(characterCode);
			
			// Formatting text, in order to remove all tags
			if(destinationTool == 'opf'){
				text = $.trim( text.replace(/<b>/g, '|').replace(/<(.*?)>/g, '').replace(/\n/g, '').replace(/\|/g, '<br />') );
			} else {
				text = $.trim( text.replace(/{b}/g, '|').replace(/{(.*?)}/g, '').replace(/\n/g, '').replace(/\|/g, '<br />') );
			}
			text = '<b>Ordem: ' + order + ' - Número: ' + block + ' - Personagem: ' + characterName + '</b><br />' + text;

			var checkSectionInserted = ($.inArray(section, scriptSections) !== -1);
			if(!checkSectionInserted){
				scriptSections.push(section);

				scriptText += ('<b>SEÇÃO ' + section + '</b><br /><br />');
			}

			scriptText += (text + '<br /><br />');
		});
		
		return scriptText;
	}
	
	this.analyzeScripts = function(){
		var that = this;
		var scriptTabId = 'script-tab-0';
		
		that.hideScriptAnalysisSettings();
		that.showScriptAnalysisProcessingIndicator();
		that.automaticPageChange = true;
		
		var scriptsToAnalyze = [];
		for(var i in that.openedFiles){
			var file = that.openedFiles[i];

			if(file.scriptTabId == scriptTabId){
				scriptsToAnalyze.push(file);
			}
		}
		var totalScriptsToAnalyze = scriptsToAnalyze.length;
		var invalidBlocks = [];
		var currentScriptNumber = 0;
		
		// Recursive function for analysing each script
		var analyzeScript = function(scriptsToAnalyze){
			setTimeout(function(){
				// Getting first script from the list and remove it from the main array
				var currentScript = scriptsToAnalyze.shift();
				var scriptTabId = currentScript.scriptTabId;
				
				var $dialogParserTable = $('#' + scriptTabId);

				var tableObject = $dialogParserTable.DataTable();

				var totalPages = tableObject.page.info().pages;
				var pages = [];
				for(var page=0; page<totalPages; page++){
					pages.push(page);
				}

				// Updating processing indicator with the current progress percentage
				var scriptsPercentage = Math.ceil( (currentScriptNumber / totalScriptsToAnalyze) * 100 );
				that.updateProcessingIndicator('analysisScripts', scriptsPercentage);
				currentScriptNumber++;
				
				// Updating processing indicator label, according to the total of scripts to be analyzed
				var messageLabel;
				if(totalScriptsToAnalyze > 1){
					// Multiple scripts to analyze, so fill the message label with the current script
					// number and the total scripts to analyze
					messageLabel = 'Script ' + currentScriptNumber + ' / ' + totalScriptsToAnalyze;
				} else {
					// Only one script to analyze, so change the label back to the default message
					// number and the total scripts to analyze
					messageLabel = 'Script';
				}
				that.updateLabelScriptAnalysisProcessingIndicator(messageLabel);

				// Recursive function for analysing each page
				var analyzeScriptPage = function(pages){
					setTimeout(function(){
						// Getting first page from the list, and remove it from the main array
						var currentPage = pages.shift();

						tableObject.page(currentPage).draw(false);
						$dialogParserTable.find('div.text-window').each(function(){
							var $divTextWindow = $(this);
							var returnAnalysis = that.analyzeScriptBlock($divTextWindow);

							if(returnAnalysis !== true){
								invalidBlocks.push(returnAnalysis);
							}
						});

						// Updating processing indicator with the current progress percentage
						var pagesPercentage = Math.ceil( (currentPage / totalPages) * 100 );
						that.updateProcessingIndicator('analysisScriptsPages', pagesPercentage);

						// Checking if there's at least one more page to analyze
						if(pages.length > 0){
							// More than one page to analyze, so call the recursive function again,
							// passing the main array of pages as parameter
							analyzeScriptPage(pages);
						} else {
							// All pages analyzed, so proceed with the analysis of the next files.
							// Checking if there's at least one more script to analyze
							if(scriptsToAnalyze.length > 0){
								// More than one script to analyze, so call the recursive function again,
								// passing the main array of pages as parameter

								analyzeScript(scriptsToAnalyze);
							} else {
								// All scripts analyzed, so proceed with the exhibition of results
								that.hideScriptAnalysisProcessingIndicator();
								that.changeTitleScriptAnalysisResults();
								that.showScriptAnalysisResults();

								var $analysisResultsTable = $('#analysis-results-table');
								var $tbody = $analysisResultsTable.children('tbody');
								var $spanTotalInvalidBlocks = $analysisResultsTable.find('span.total-invalid-blocks');

								$tbody.html('');

								var totalInvalidBlocks = invalidBlocks.length;
								if(totalInvalidBlocks > 0){
									$.get('modal-analysis-results-row.html').then(function(response){
										var template = $.templates(response);
										
										for(var i in invalidBlocks){
											var invalidBlock = invalidBlocks[i];

											var scriptTabId = invalidBlock.scriptTabId;
											var order = invalidBlock.order;
											var section = invalidBlock.section;
											var blockNumber = invalidBlock.blockNumber;
											var $invalidBlock = $(invalidBlock.invalidBlock).clone();
											var message = invalidBlock.message;

											var $previewElement = $('<div />').addClass('dialog-preview text-only invalid').css('marginTop', '0').html(
												$invalidBlock
											);
											if($invalidBlock.hasClass('ds_jacutemsabao') || $invalidBlock.hasClass('ds_american') || $invalidBlock.hasClass('ds_european')){
												$previewElement.addClass('ds');
											}
											
											var rowInfo = {
												'scriptTabId': scriptTabId,
												'order': order,
												'section': section,
												'blockNumber': blockNumber,
												'previewElement': $previewElement[0].outerHTML,
												'message': message
											}
											var $newTr = $( template.render(rowInfo) );

											$tbody.append($newTr);
										}

										$spanTotalInvalidBlocks.html(totalInvalidBlocks).closest('tfoot').show();
									});
								} else {
									$tbody.append(
										$('<tr />').addClass('empty').append(
											$('<td />').addClass('text-center').html('Nenhum bloco inválido encontrado!')
										)
									);
									$spanTotalInvalidBlocks.html('...').closest('tfoot').hide();
								}

								that.automaticPageChange = false;
							}
						}
					}, 1);
				}
				analyzeScriptPage(pages);
			}, 1);
		}
		analyzeScript(scriptsToAnalyze);
		
		// Needed to avoid form submission
		return false;
	}
	
	this.analyzeScriptBlock = function(divTextWindow){
		var $divTextWindow = $(divTextWindow);
		var $dialogParserTable = $divTextWindow.closest('table.dialog-parser-table');
		var $tr = $divTextWindow.closest('tr');
		var $tdOrder = $tr.children('td.order');
		var $spanSection = $tr.find('span.section').first();
		var $spanBlockNumber = $tr.find('span.block-number').first();
		
		var scriptTabId = $dialogParserTable.attr('id');
		var filename = $dialogParserTable.attr('data-filename');
		var order = $tdOrder.html();
		var section = $spanSection.html();
		var blockNumber = $spanBlockNumber.html();
		var blockWidth = $divTextWindow.outerWidth();
		var caretRightPadding = 0;
		var lineNumber = 1;
		var lineWidth = 10;
		var charactersPerLine = 0;
		var message = '';
		var that = this;
		var platform = that.configs.platform;
		var checkPlatformDS = (platform == 'ds_jacutemsabao' || platform == 'ds_american' || platform == 'ds_european');
		
		var checkValidBlock = true;
		var checkBlockWidthLastLineReduced = false;
		var checkCenteredBlock = $divTextWindow.hasClass('centered');
		var checkHasCaret = ($divTextWindow.children('span.caret').length > 0);

		$divTextWindow.children('*').each(function(){
			var $elem = $(this);
			
			var checkAtLeastOneCharacterInLine = false;
			
			if($elem.is('span.letter')){
				// Counting line width and characters on each line
				lineWidth += $elem.width();
				charactersPerLine++;
				checkAtLeastOneCharacterInLine = true;
			} else if($elem.is('br')){
				// Counting each line break
				lineNumber++;
				lineWidth = 10;
				charactersPerLine = 0;
				checkAtLeastOneCharacterInLine = false;
			}
			
			// For blocks with three lines, defining caret right padding
			// and reducing block width with its value
			if(checkHasCaret && lineNumber == 3 && !checkBlockWidthLastLineReduced){
				if(checkCenteredBlock){
					if(checkPlatformDS){
						caretRightPadding = 15;
					} else {
						caretRightPadding = 23;
					}
				} else {
					if(checkPlatformDS){
						caretRightPadding = 13;
					} else {
						caretRightPadding = 17;
					}
				}
				blockWidth -= caretRightPadding;
				checkBlockWidthLastLineReduced = true;
			}
			
			// Validating block
			if(lineNumber > 3 && checkAtLeastOneCharacterInLine){
				checkValidBlock = false;
				message = 'Bloco com mais de 3 linhas!';
				return false; // Exit $.each
			}
			if(lineWidth > blockWidth){
				var checkInsideCaretArea;
				if(checkHasCaret && lineNumber == 3){
					var caret_start = blockWidth;
					var caret_ending = (blockWidth + caretRightPadding);
					if(checkCenteredBlock){
						caret_ending += 5;
					}
					
					if((lineWidth >= caret_start) && (lineWidth <= caret_ending)){
						checkInsideCaretArea = true;
					} else {
						checkInsideCaretArea = false;
					}
				} else {
					checkInsideCaretArea = false;
				}
				
				checkValidBlock = false;
				if(checkInsideCaretArea){
					message = 'Texto sobrepondo a área do cursor da terceira linha!';
				} else {
					message = 'Largura da linha ultrapassa limite do bloco!';
				}
			}
			if((that.configs.invalidateLargeLines) && (charactersPerLine > 32)){
				checkValidBlock = false;
				message = 'Contém linhas com mais de 32 caracteres!';
				return false; // Exit $.each
			}
		});
		
		// Returning true if block is valid, or an array containing the block element
		// and the message being returned
		if(checkValidBlock){
			return true;
		} else {
			return {
				'scriptTabId': scriptTabId,
				'filename': filename,
				'order': order,
				'section': section,
				'blockNumber': blockNumber,
				'invalidBlock': $divTextWindow,
				'message': message
			}
		}
	}
	
	this.showPopover = function(element, message, placement, popoverClass){
		if(typeof placement == 'undefined') placement = 'auto left';
		if(typeof popoverClass == 'undefined') popoverClass = 'danger';
		
		var $template = $("<div />").addClass('popover ' + popoverClass).attr('role', 'tooltip').append(
			$('<div />').addClass('arrow')
		).append(
			$('<h3 />').addClass('popover-title')
		).append(
			$('<div />').addClass('popover-content')
		);
		
		element.popover({
			'html': true,
			'placement': placement,
			'template': $template,
			'content': message,
			'delay': 200,
			'trigger': 'manual'	
		});
		element.popover('show');
		
		element.add($template).click(function(){
			element.closest('div.dialog-preview').removeClass('invalid');
			element.popover('hide');
		});
	}
	
	this.hidePopover = function(element){
		element.popover('hide');
	}
	
	this.showGotoRowFilters = function(){
		var $divGotoRowSettings = $('#goto-row-settings');
		var $selectFilterType = $('#goto-row-filter-type');
		var $divOrder = $('#div-goto-row-order');
		var $divBlockNumber = $('#div-goto-row-block-number');
		var $divSection = $('#div-goto-row-section');
		var $inputOrder = $('#goto-row-order');
		var $inputBlockNumber = $('#goto-row-block-number');
		var $inputSection = $('#goto-row-section');
		
		// Selecting default option in filter type field
		var filterType = 'o';
		$selectFilterType.val(filterType);
		
		// Triggering click on first main tab, in case of the user has clicked
		// on another tab
		this.triggerClickOnFirstMainTab();
		
		// Showing modal
		$divGotoRowSettings.modal('show');
		
		// Resetting all text fields
		$inputOrder.add($inputSection).add($inputBlockNumber).val('');
		
		// Toggling text fields based on filter type
		if(filterType == 'o'){
			$divOrder.show();
			$divSection.add($divBlockNumber).hide();
		} else {
			$divOrder.hide();
			$divSection.add($divBlockNumber).show();
		}
		
		// Focusing filter type
		$inputOrder.focus();
	}
	
	this.hideGotoRowFilters = function(){
		$('#goto-row-settings').modal('hide');
	}
	
	this.gotoRow = function(scriptTabId, order){
		var $dialogParserTable = $('#' + scriptTabId);
		
		var tableObject = $dialogParserTable.DataTable();
		var pageLength = tableObject.page.info().length;
		var that = this;
		
		that.hideScriptAnalysisResults();
		that.showLoadingIndicator();
		
		setTimeout(function(){
			var destinationPage = Math.ceil( order / pageLength ) - 1;
			var checkRowFound = !isNaN(destinationPage);
			if(checkRowFound){
				tableObject.page(destinationPage).draw(false);
				var $trFound = $dialogParserTable.find('td.order:contains("' + order + '")').closest('tr');

				$('html, body').animate({
					scrollTop: $trFound.offset().top
				}, 'slow');

				$trFound.addClass('highlight');
				setTimeout(function(){
					$trFound.removeClass('highlight');
				}, 5000);
			} else {
				alert('Linha não encontrada!');
			}

			that.hideLoadingIndicator();
		}, 25)
	}
	
	this.gotoRowByFilters = function(gotoRowForm){
		var $selectFilterType = $('#goto-row-filter-type');
		var $inputOrder = $('#goto-row-order');
		var $inputBlockNumber = $('#goto-row-block-number');
		var $inputSection = $('#goto-row-section');
		
		var scriptTabId = 'script-tab-0';
		var filterType = $selectFilterType.val();
		var order = $inputOrder.val();
		var section = $inputSection.val();
		var blockNumber = $inputBlockNumber.val();
		
		var $dialogParserTable = $('#' + scriptTabId);
		var tableObject = $dialogParserTable.DataTable();
		var currentPage = tableObject.page();
		var pageLength = tableObject.page.info().length;
		
		var checkOrderProvided = (order != '');
		var checkSectionProvided = (section != '');
		var checkBlockNumberProvided = (blockNumber != '');
		
		this.hideGotoRowFilters();
		this.showLoadingIndicator();
		var that = this;
		
		setTimeout(function(){
			var checkRowFound = false;
			var destinationPage;
			
			var $trFound;
			
			that.automaticPageChange = true;
			
			var checkFormValid = true;
			var invalidFormMessage = '';
			if(filterType == 'o' && !checkOrderProvided){
				checkFormValid = false;
				invalidFormMessage = 'Ordem não fornecida!';
			} else if(filterType == 'sn' && (!checkSectionProvided && !checkBlockNumberProvided)){
				checkFormValid = false;
				invalidFormMessage = 'Nem a seção e nem o número do bloco foram fornecidos!';
			}
			
			if(checkFormValid){
				$( tableObject.rows().nodes() ).each(function(i){
					var $tr = $(this);
					var $tdFormFields = $tr.children('td.form-fields');
					var $spanOrder = $tdFormFields.find('span.order');
					var $spanSection = $tdFormFields.find('span.section');
					var $spanBlockNumber = $tdFormFields.find('span.block-number');

					var checkOrderFound = false;
					var checkSectionAndOrBlockNumberFound = false;

					if(filterType == 'o'){
						if(checkOrderProvided){
							if($.trim( order ) == ($.trim( $spanOrder.html() ))){
								checkOrderFound = true;
							}
						} else {
							// No value provided, so abort
							return false;
						}
					} else if(filterType == 'sn'){
						if(checkSectionProvided && checkBlockNumberProvided){
							// Section and block filled
							if((('{{' + $.trim( section ) + '}}') == $.trim( $spanSection.html() )) && ($.trim( blockNumber ) == $.trim( $spanBlockNumber.html() ))){
								checkSectionAndOrBlockNumberFound = true;
							}
						} else if(checkSectionProvided && !checkBlockNumberProvided){
							// Only section provided
							if(('{{' + $.trim( section ) + '}}') == $.trim( $spanSection.html() )){
								checkSectionAndOrBlockNumberFound = true;
							}
						} else if(!checkSectionProvided && checkBlockNumberProvided){
							// Only block number provided
							if($.trim( blockNumber ) == $.trim( $spanBlockNumber.html() )){
								checkSectionAndOrBlockNumberFound = true;
							}
						} else {
							// No value provided, so abort
							return false;
						}
					}

					if(checkSectionAndOrBlockNumberFound || checkOrderFound){
						$trFound = $tr;
						destinationPage = Math.ceil((i + 1) / pageLength) - 1;
						checkRowFound = true;
						return false;
					}
				});
				
				that.hideLoadingIndicator();
			
				if(checkRowFound){
					tableObject.page(destinationPage).draw(false);
					
					$('html, body').animate({
						scrollTop: $trFound.offset().top
					}, 'slow');

					$trFound.addClass('highlight');
					setTimeout(function(){
						$trFound.removeClass('highlight');
					}, 5000);
				} else {
					alert('Linha não encontrada!');
					tableObject.page(currentPage).draw(false);
				}

				that.automaticPageChange = false;
			} else {
				that.hideLoadingIndicator();
				
				alert(invalidFormMessage);
			}
		}, 25);
		
		// Needed to avoid form submission
		return false;
	}
	
	this.loadEquivalenceTable = function(game){
		if(game == ''){
			return;
		}
		
		this.game = game;
		
		var that = this;
		$.getScript('js/aade.et.' + game + '.js', function(){
			var $tableEquivalenceTable = $('#equivalence-table');
			var $tbody = $tableEquivalenceTable.children('tbody');
			
			$tbody.children('tr.default').remove();
			var $firstTr = $tbody.children('tr').first();
			
			for(var code in that.equivalenceTable){
				var name = that.equivalenceTable[code];
				var originalName = name.original;
				var adaptedName = name.adapted;
				
				var $newTr = $('<tr />').addClass('default').append(
					$('<td />').append(
						$('<span />').addClass('code').html('Cód.: ' + code)
					).append(
						$('<input />').attr({
							'type': 'text',
							'name': 'character[' + code + '][original_name]',
							'placeholder': 'Digite o nome original'
						}).val(originalName).addClass('form-control original-name').on({
							'keyup': that.updatePreviewVisibleTextareas
						})
					)
				).append(
					$('<td />').append('&nbsp;').append(
						$('<input />').attr({
							'type': 'text',
							'name': 'character[' + code + '][adapted_name]',
							'placeholder': 'Digite o nome adaptado'
						}).val(adaptedName).addClass('form-control adapted-name').on({
							'keyup': that.updatePreviewVisibleTextareas
						})
					)
				).append(
					$('<td />').append('&nbsp;').append(
						$('<button />').attr({
							'type': 'button',
							'onclick': 'aade.removeCharacterEquivalenceTable(this)',
							'disabled': 'disabled'
						}).addClass('btn btn-danger').html(
							$('<span />').addClass('glyphicon glyphicon-remove')
						)
					)
				);
				
				if($firstTr.length > 0){
					$firstTr.before($newTr);
				} else {
					$tbody.append($newTr)
				}
			}
			
			that.updatePreviewVisibleTextareas();
		})
	}
	
	this.loadEquivalenceTableFromFileForm = function(game){
		var $selectEquivalenceTable = $('#equivalence-table-field');
		$selectEquivalenceTable.val(game).trigger('change');
	}
	
	this.addCharacterEquivalenceTable = function(){
		var code = prompt('Digite o código do personagem');
		if(code == null){
			return;
		}
		
		var $equivalenceTable = $('#equivalence-table');
		var $tbody = $equivalenceTable.children('tbody');
		var codes = [];

		$tbody.find('td.code').each(function(){
			var code = this.innerHTML;
			codes.push(code);
		});
		
		if($.inArray(code, codes) !== -1){
			alert('Esse código já está sendo usado.');
			return;
		}
		
		var $clonedTr = $tbody.find('tr').last().clone().removeClass('default');
		var $spanCode = $clonedTr.find('span.code');
		var $inputOriginalName = $clonedTr.find('input.original-name');
		var $inputAdaptedName = $clonedTr.find('input.adapted-name');
		var $buttonRemove = $clonedTr.find('button');
		
		$spanCode.html('Cód.: ' + code);
		$inputOriginalName.attr('name', 'character[' + code + '][original_name]').val('');
		$inputAdaptedName.attr('name', 'character[' + code + '][adapted_name]').val('');
		$buttonRemove.removeAttr('disabled');
		
		$clonedTr.appendTo($tbody);
		$inputOriginalName.focus();
	}
	
	this.removeCharacterEquivalenceTable = function(button){
		var $button = $(button);
		var $tr = $button.closest('tr');
		$tr.remove();
	}
	
	this.showInstructions = function(){
		$('#instructions').modal('show');
	}
	
	this.hideInstructions = function(){
		$('#instructions').modal('hide');
	}
	
	this.showLoadingIndicator = function(){
		$('#loading-indicator').modal('show');
	}
	
	this.hideLoadingIndicator = function(){
		$('#loading-indicator').modal('hide');
	}
	
	this.showProcessingIndicator = function(){
		$('#processing-indicator').modal('show');
		
		this.processingProgressbars['default'] = $('#processing-progress-bar');
		
		this.processingProgressbars['default'].addClass('active');
		this.updateProcessingIndicator('default', 0);
	}
	
	this.updateProcessingIndicator = function(progressbarType, percentage){
		if((typeof percentage == 'undefined') || (percentage < 0)){
			percentage = 0;
		} else if(percentage > 100) {
			percentage = 100;
		}
		
		var $progressBar = this.processingProgressbars[progressbarType];
		
		$progressBar.attr('aria-valuenow', percentage).css('width', percentage + '%').html(percentage + '%');
		if(percentage == 100) $progressBar.removeClass('active');
	}
	
	this.hideProcessingIndicator = function(){
		this.updateProcessingIndicator('default', 100);
		$('#processing-indicator').modal('hide');
	}
	
	this.showScriptAnalysisProcessingIndicator = function(){
		$('#analysis-processing-indicator').modal('show');
		
		this.processingProgressbars['analysisScripts'] = $('#scripts-progress-bar');
		this.processingProgressbars['analysisScriptsPages'] = $('#pages-progress-bar');
		
		this.processingProgressbars['analysisScripts'].addClass('active');
		this.processingProgressbars['analysisScriptsPages'].addClass('active');
		
		this.updateProcessingIndicator('analysisScripts', 0);
		this.updateProcessingIndicator('analysisScriptsPages', 0);
	}
	
	this.updateLabelScriptAnalysisProcessingIndicator = function(message){
		var $pLabelScriptAnalysis = $('#label-scripts-progress-bar');
		
		$pLabelScriptAnalysis.html(message);
	}
	
	this.hideScriptAnalysisProcessingIndicator = function(){
		this.updateProcessingIndicator('analysisScripts', 100);
		this.updateProcessingIndicator('analysisScriptsPages', 100);
		
		$('#analysis-processing-indicator').modal('hide');
	}
	
	this.formatChar = function(char){
		var charTable = {
			// Symbols
			' ': 'space', '!': 'exclamation', '"': 'double-quotes', '#': 'cerquilha',
			'$': 'money-sign', '%': 'percent', '&': 'ampersand', "'": 'quotes',
			"(": 'open-parenthesis', ")": 'close-parenthesis', '*': 'asterisk',
			'+': 'plus', ',': 'comma', '-': 'minus', '.': 'dot', '/': 'slash',
			':': 'colon', ';': 'semicolon', '=': 'equal',
			'?': 'interrogation', '@': 'at-sign',
			'©': 'copyright', '[': 'open-square-brackets', ']': 'close-square-brackets',
			'_': 'underscore', '¡': 'inverted-exclamation',
			'¿': 'inverted-interrogation', 'º': 'o-ordinal', 'ª': 'a-ordinal',
			
			// Numbers
			'0': 'n0', '1': 'n1', '2': 'n2', '3': 'n3', '4': 'n4', '5': 'n5',
			'6': 'n6', '7': 'n7', '8': 'n8', '9': 'n9',
			
			// Uppercase accents
			'À': 'A-grave', 'Á': 'A-acute', 'Â': 'A-circumflex', 'Ã': 'A-tilde',
			'Ä': 'A-diaeresis', 'Ç': 'C-cedilla', 'È': 'E-grave', 'É': 'E-acute', 
			'Ê': 'E-circumflex', 'Ë': 'E-diaeresis', 'Ẽ': 'E-tilde', 'Ì': 'I-grave',
			'Í': 'I-acute', 'Ï': 'I-diaeresis', 'Î': 'I-circumflex', 'Ò': 'O-grave',
			'Ó': 'O-acute', 'Ô': 'O-circumflex', 'Õ': 'O-tilde', 'Ö': 'O-diaeresis',
			'Ù': 'U-grave', 'Ú': 'U-acute', 'Û': 'U-circumflex', 'Ü': 'U-diaeresis',
			'Ñ': 'N-tilde', 'Ÿ': 'Y-diaeresis',
			
			// Lowercase accents
			'à': 'a-grave', 'á': 'a-acute', 'â': 'a-circumflex', 'ã': 'a-tilde',
			'ä': 'a-diaeresis', 'ç': 'c-cedilla', 'è': 'e-grave', 'é': 'e-acute', 
			'ê': 'e-circumflex', 'ẽ': 'e-tilde', 'ë': 'e-diaeresis', 'ì': 'i-grave',
			'í': 'i-acute', 'ï': 'i-diaeresis', 'î': 'i-circumflex', 'ò': 'o-grave',
			'ó': 'o-acute', 'ô': 'o-circumflex', 'õ': 'o-tilde', 'ö': 'o-diaeresis',
			'ù': 'u-grave', 'ú': 'u-acute', 'û': 'u-circumflex', 'ü': 'u-diaeresis',
			'ñ': 'n-tilde', 'ÿ': 'y-diaeresis'
			
		}
		var destinationTool = this.destinationTool;
		if(destinationTool == 'dhh'){
			charTable['<'] = 'less-than';
			charTable['>'] = 'greater-than';
		}
		
		var alphabet = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz".split("");
		for(var i in alphabet){
			var letter = alphabet[i];
			
			charTable[letter] = letter;
		}
		
		var key, newChar;
		for (key in charTable) {
			if(key == char){
				var newValue = charTable[key];
				newChar = char.replace(key, newValue);
				break;
			}
		}
		if(typeof newChar == 'string'){
			return newChar;
		} else {
			return 'unknown';
		}
	}
	
	this.getColorClass = function(colorCode){
		if(colorCode == 1){
			return 'color-orange';
		} else if(colorCode == 2){
			return 'color-blue';
		} else if(colorCode == 3){
			return 'color-green';
		} else {
			return '';
		}
	}
	
	this.getTitle = function(){
		return $('title').html();
	}
	
	this.setTitle = function(title){
		$('title').html(title);
	}
	
	this.renderPreviewImageOnBrowser = function(button){
		var $button = $(button);
		var $tdPreviewConteiners = $button.closest('td.preview-conteiners');
		var $divBlockData = $tdPreviewConteiners.children('div.block-data');
		var $previewField = $tdPreviewConteiners.children('div.dialog-preview');
		var $td = $button.closest('td.preview-conteiners');
		
		var previewFieldId = $previewField.attr('id');
		var filename = 'preview-' + previewFieldId;
		
		$divBlockData.removeClass('row visible-xs').hide();
		html2canvas($td, {
			'onrendered': function(canvas) {
				var width = 320, height = 104;
				var ctx = canvas.getContext('2d');
				var imageData = ctx.getImageData(7, 2, width, height);
				
				canvas.width = width;
				canvas.height = height;
				ctx.putImageData(imageData, 0, 0);
				
				var a = document.createElement('a');
				a.href = canvas.toDataURL("image/png").replace("image/png", "image/octet-stream");
				a.download = filename + '.png';
				var $a = $(a);
				$('body').append($a);
				a.click();
				$a.remove();
				
				$divBlockData.addClass('row visible-xs').show();
			}
		});
	}
	
	this.checkOnCordova = function(){
		return !!window.cordova;
	}
}

// Instantiating objct for class above
var aade = new aade();

// Disabling cache for all ajax requests
$.ajaxSetup ({
	cache: false
});
