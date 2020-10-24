/* Javascript library containing methods related to Mega Man X4 Dialogue Editor
 * 
 */

function mmx4de(){
	
	// Properties
	this.equivalenceTable = {};
	this.dialogParserTableTextareas = $();
	this.lastAvatar = '';
	this.automaticPageChange = false;
	this.configs = {};
	this.defaultConfigs = {
		'theme': 'light',
		'mobileShowInitially': 'p'
	};
	
	// Methods
	this.loadConfigs = function(){
		var theme = stash.get('theme');
		var mobileShowInitially = stash.get('mobileShowInitially');
		
		if(typeof theme == 'undefined') theme = this.defaultConfigs.theme;
		if(typeof mobileShowInitially == 'undefined') mobileShowInitially = this.defaultConfigs.mobileShowInitially;
		
		this.configs = {
			'theme': theme,
			'mobileShowInitially': mobileShowInitially
		}
	}
	
	this.loadTheme = function(){
		var theme = this.configs.theme;
		$('body').addClass(theme);
	}
	
	this.changeTheme = function(element){
		var $element = $(element);
		var $body = $('body');
		var $dialogParserTable = $('#dialog-parser-table');
		
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
		if(($dialogParserTable.length > 0) && (theme != previousTheme)){
			var tableObject = $dialogParserTable.DataTable();
			tableObject.draw(false);
		}
		
		// Reloading configs after saving the new theme
		this.loadConfigs();
	}
	
	this.loadDialogFileForm = function(){
		var $divDialogFileFormContainer = $('#dialog-file-form-container');
		
		$divDialogFileFormContainer.load('dialog-file-form.html');
	}
	
	this.loadModalWindows = function(){
		var $divMainContainer = $('#main-container');
		
		$.get('modal-loading.html').then(function(response){
			$divMainContainer.append(response);
		});
		$.get('modal-goto.html').then(function(response){
			$divMainContainer.append(response);
		});
		$.get('modal-text-preview.html').then(function(response){
			$divMainContainer.append(response);
		});
		$.get('modal-save.html').then(function(response){
			$divMainContainer.append(response);
		});
		$.get('modal-analysis.html').then(function(response){
			$divMainContainer.append(response);
		});
		$.get('modal-config.html').then(function(response){
			$divMainContainer.append(response);
		});
	}
	
	this.readScriptFile = function(dialogFileForm){
		var $radioFileOrigin = $("[name='file-origin']:checked");
		var $inputFileField = $('#file-field');
		var $radioFileItemList = $("[name='file-item-list']:checked");
		
		var file_origin = $radioFileOrigin.val();
		var file_item_list = $radioFileItemList.val();
		var that = this;
		
		if(file_origin == 'f'){
			var file = $inputFileField[0].files[0];
			if(file){
				var reader = new FileReader();
				var filename = file.name;
				
				reader.readAsText(file, "iso-8859-1");
				reader.onload = function (evt) {
					var fileContents = evt.target.result;
					that.showLoadingIndicator();
					that.parseScriptFile(filename, fileContents, function(){
						that.instantiatePaginationDialogParsing();
					});
				}
			}
		} else {
			var filename = file_item_list.split('/').pop();
			
			that.showLoadingIndicator();
			
			$.ajax({
				url: file_item_list,
				type: 'GET',
				contentType: 'Content-type: text/plain; charset=utf-8',
				beforeSend: function(jqXHR) {
					jqXHR.overrideMimeType('text/html;charset=utf-8');
				},
				success: function(fileContents){
					that.parseScriptFile(filename, fileContents, function(){
						that.instantiatePaginationDialogParsing();
					});
				}
			});
		}
		
		return false;
	}
	
	this.parseScriptFile = function(filename, fileContents, callback){
		var $divDialogFileFormContainer = $('#dialog-file-form-container');
		var $divDialogParserTableContainer = $('#dialog-parser-table-container');
		
		// Separating strings in blocks
		var that = this;
		var number = 1;
		var sections = [];
		var lines = fileContents.split('\n');
		
		// Separating strings in sections
		for(var i in lines){
			var line = $.trim( lines[i] );
			
			if(typeof sections[number] == 'undefined'){
				sections[number] = line + '\n';
			} else {
				sections[number] += line + '\n';
			}
			
			if(line == '------------------------------'){
				number++;
			}
		}
		
		var sectionBlocks = [];
		var tag = false;
		var tagText = '';
		
		// Iterating into sections to separate them into blocks	
		for(var sectionNumber in sections){
			var section = sections[sectionNumber];
			var blockNumber = 1;
			
			for(var j = 0; j < section.length; j++){
				var char = section[j];
				var previousChar;
				if(j > 0){
					previousChar = section[j - 1];
				} else {
					previousChar = char;
				}
				
				if(char == '['){
					tag = true;
				} else if(char == ']'){
					tag = false;
				}
				
				// Creating additional variables in section_blocks array, in order to
				// mount the table with textarea fields below
				if(typeof sectionBlocks[sectionNumber] == 'undefined'){
					sectionBlocks[sectionNumber] = [];
				}
				if(typeof sectionBlocks[sectionNumber][blockNumber] == 'undefined'){
					sectionBlocks[sectionNumber][blockNumber] = [];
				}
				if(typeof sectionBlocks[sectionNumber][blockNumber]['text'] == 'undefined'){
					sectionBlocks[sectionNumber][blockNumber]['text'] = char;
				} else {
					sectionBlocks[sectionNumber][blockNumber]['text'] += char;
				}
				
				if(tag){
					if(char != '['){
						tagText += $.trim( char );
					}
				} else {
					if(char == '\n' && previousChar == '\n'){
						blockNumber++;
					}
					
					tagText = '';
				}
			}
		}
		
		// Loading dialog parser table
		$divDialogParserTableContainer.load('dialog-parser-table.html', function(){
			var $dialogParserTable = $divDialogParserTableContainer.children('table');
			var $tbody = $dialogParserTable.children('tbody');
			var $spanTotalDialogBlocks = $dialogParserTable.find('span.total-dialog-blocks');
			
			$divDialogFileFormContainer.hide();
			$dialogParserTable.attr('data-filename', filename);
			
			// Loading dialog parser table's row template
			$.get('dialog-parser-row.html').then(function(response){
				var template = $.templates(response);
				
				var order = 1;
				var totalSections = 0;
				var totalDialogBlocks = 0;
				
				for(var sectionNumber in sectionBlocks){
					totalSections++;
					
					// Iterating through all section blocks, in order to mount the table rows.
					var section = sectionBlocks[sectionNumber];
					for(var blockNumber in section){
						totalDialogBlocks++;
						
						var block = section[blockNumber];
						var text = $.trim( block['text'] );
						var textWithoutTags = that.getTextWithoutTags(text);
						var dialogId = 's-' + sectionNumber + '-b-' + blockNumber + '-dialog';

						var checkHasEndSection = /![*]{3,}!/g.test(text);

						var rowInfo = {
							'blockNumber': order,
							'dialogId': dialogId,
							'textWithoutTags': textWithoutTags
						}
						var $tr = $( template.render(rowInfo) );
						var $textarea = $tr.find('textarea.text-field');

						$tbody.append($tr);
						$textarea.val(text);

						if(checkHasEndSection){
							$tr.find('button.add-new-block').remove();
						}
						
						order++;
					}
				}
				
				// Updating total row count in table footer
				var totalRows = $tbody.children('tr').length;
				$spanTotalDialogBlocks.html(totalRows);
				
				that.hideLoadingIndicator();
				
				if(callback) callback();
			});
		});
	}
	
	this.getTextWithoutTags = function(text){
		text = text.replace(/![-*]*!/g, '');
		text = text.replace(/\n/g, ' ');
		text = $.trim( text );
		return text;
	}
	
	this.instantiatePaginationDialogParsing = function(){
		var $dialogParserTable = $('#dialog-parser-table');
		
		if($dialogParserTable.length == 0){
			return;
		}
		
		var confirmLengthySearch = false;
		var limitRows = 5;
		var originalPage = 0;
		var originalLimitRows = limitRows;
		
		// Instantiation
		var that = this;
		var object = $dialogParserTable.on({
			// Table draw event
			'draw.dt': function(a, b, c){
				var $tbody = $dialogParserTable.children('tbody');
				var $trs = $tbody.children('tr');
				
				var device = that.getDevice();
				var mobileShowInitially = that.configs.mobileShowInitially;
				var checkNoValidRows = (($trs.length == 0) || (($trs.length == 1) && ($trs.find('td.dataTables_empty').length == 1)));
				
				// If there's no valid rows, there's no need
				// to instantiate the components below
				if(checkNoValidRows){
					return;
				}
				
				// Saving selector with all textareas in an property, in order to
				// accessing it faster afterwards
				if(that.dialogParserTableTextareas.length == 0){
					var tableObject = $dialogParserTable.DataTable();
					that.dialogParserTableTextareas = $( tableObject.rows().nodes() ).find("textarea.text-field");
				}
			
				// Iterating over each visible row and update the preview
				$trs.each(function(){
					var $tr = $(this);
					var $textareaTextField = $tr.find('textarea.text-field');
					var $divDialogPreview = $tr.find('div.dialog-preview');
					var $tdFormFields = $tr.children('td.form-fields');
					var $tdPreviewConteiners = $tr.children('td.preview-conteiners');
					var $buttonShowPreviewMobile = $tr.find('button.show-preview-mobile');
					var $buttonShowTextfieldMobile = $tr.find('button.show-textfield-mobile');

					var previewFieldId = $divDialogPreview.attr('id');

					that.updatePreview($textareaTextField, previewFieldId);
					
					if(device == 'xs'){
						if(mobileShowInitially == 'p' && $tdPreviewConteiners.hasClass('hidden-xs')){
							$buttonShowTextfieldMobile.trigger('click');
						} else if(mobileShowInitially == 't' && $tdFormFields.hasClass('hidden-xs')){
							$buttonShowPreviewMobile.trigger('click');
						}
					} else {
						$tdFormFields.add($tdPreviewConteiners).removeClass('hidden-xs visible-xs');
					}
				});
				
				// Instantiating word highlighting on all visible textareas
				var $visibleTextareas = $tbody.find('textarea.text-field');
				that.highlightWordsTextareas($visibleTextareas);
			},
			// Pagination change event
			'page.dt': function(){
				var info = object.page.info();
				var currentPage = (info.page + 1);
				var previousPage;
				if($dialogParserTable.is("[data-current-page]")){
					previousPage = parseInt($dialogParserTable.attr('data-current-page'), 10);
				} else {
					previousPage = currentPage;
				}
				$dialogParserTable.attr('data-current-page', currentPage);
				
				// Scrolling to top of page, if not an automatic page change
				if(!that.automaticPageChange){
					$('html, body').animate({
						scrollTop: $(".dataTables_wrapper").offset().top
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
			'autoWidth': false,
			'lengthMenu': [
				[1, 2, 3, 5, 7, 10, 15, 25, 50, 75, 100, 150, 200, 300, 400, 500, -1],
				[1, 2, 3, 5, 7, 10, 15, 25, 50, 75, 100, 150, 200, 300, 400, 500, 'Todos']
			],
			'pageLength': 5,
			'pagingType': 'input',
			"dom":  "<'row'<'col-sm-5'lf><'col-sm-2 script-name hidden-xs'><'col-sm-5 paginate_col'p>>" +
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
		
		// Showing script filename on top of table
		var filename = $dialogParserTable.attr('data-filename');
		$dialogParserTable.closest('div.dataTables_wrapper').find('div.script-name').html('Script: <span class="script-filename">Nenhum aberto</span>');
		$('.script-filename').html(filename);
		
		if( this.checkOnElectron() ){
			// Enabling script menus that was previously disabled
			var ipc = require('electron').ipcRenderer;
			ipc.send('activateScriptMenus');
			
			// Showing exit prompt before discarding changes
			ipc.send('showExitPromptBeforeDiscard');
		} else {
			// Showing the rest of the options in the global actions menu
			var $dropdownGlobalActions = $('#global-actions-dropdown');
			$dropdownGlobalActions.children('li').show();
			
			// Asking user to save script before exiting
			$(window).on("beforeunload", function() { 
				return 'Há um arquivo aberto na aba "Tradutor de Diálogos". É recomendável salvá-lo antes de sair.\nTem certeza que quer continuar?'; 
			});
		}
		
		// Updating window title in order to prepend filename on it
		var title = this.getTitle();
		this.setTitle(filename + ' - ' + title);
	}
	
	this.instantiateEventMobileToggleFieldPreview = function(){
		var that = this;
		$(window).on('resize.mobileToggleFieldPreview', function () {
			var $dialogParserTable = $('#dialog-parser-table');
			var $tbody = $dialogParserTable.children('tbody');
			
			var device = mmx4de.getDevice();
			var tableObject = $dialogParserTable.DataTable();
			var mobileShowInitially = that.configs.mobileShowInitially;
			var checkUpdateTable = false;
			
			$tbody.children('tr').each(function(){
				var $tr = $(this);
				var $tdFormFields = $tr.children('td.form-fields');
				var $tdPreviewConteiners = $tr.children('td.preview-conteiners');
				var $buttonShowPreviewMobile = $tr.find('button.show-preview-mobile');
				var $buttonShowTextfieldMobile = $tr.find('button.show-textfield-mobile');
				
				if(device == 'xs'){
					if(mobileShowInitially == 'p'){
						$buttonShowTextfieldMobile.trigger('click');
						checkUpdateTable = true;
					} else if(mobileShowInitially == 't'){
						$buttonShowPreviewMobile.trigger('click');
						checkUpdateTable = true;
					}
				} else {
					if($tdFormFields.hasClass('hidden-xs')){
						$tdFormFields.removeClass('hidden-xs');
						checkUpdateTable = true;
					}
					if($tdPreviewConteiners.hasClass('hidden-xs')){
						$tdPreviewConteiners.removeClass('hidden-xs');
						checkUpdateTable = true;
					}
					if($tdFormFields.hasClass('visible-xs')){
						$tdFormFields.removeClass('visible-xs');
						checkUpdateTable = true;
					}
					if($tdPreviewConteiners.hasClass('visible-xs')){
						$tdPreviewConteiners.removeClass('visible-xs');
						checkUpdateTable = true;
					}	
				}
			});
			
			if(checkUpdateTable) tableObject.draw(false);
		});
	}
	
	this.highlightWordsTextareas = function(textareas){
		var $textareas = $(textareas);
		$textareas.each(function(){
			var $textarea = $(this);
			
			if($textarea.is("[data-highlight-instantiated='true']")){
				$textarea.highlightWithinTextarea('destroy');
			}
			
			$textarea.highlightWithinTextarea({
				'highlight': [
					{
						'highlight': /\[(.+?)\]/g,
						'className': 'red'
					}, {
						'highlight': '------------------------------',
						'className': 'gray'
					}
				]
			}).attr('data-highlight-instantiated', 'true');
		});
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
	
	this.updatePreview = function(field, previewFieldId, event){
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
		var $divTextWithoutTags = $field.closest('td').children('div.text-without-tags');
		var $divPreview = $('#' + previewFieldId);
		
		var text = $field.val();
		var tag = false;
		var tagText = '';
		
		var $divTextWindow = $divPreview.children('div.text-window');
		$divTextWindow.html('');
		
		// Removing end block tags
		text = text.replace('------------------------------', '');

		// Iterating over all characters inside text field
		for (var i = 0, size = text.length; i < size; i++) {
			var char = text[i];

			if(char == "["){
				tag = true;
			} else if(char == "]"){
				tag = false;
			}

			if(tag){
				if(char != '['){
					tagText += char;
				}
			} else {
				// Tags for all contexts
				if(char == '\n'){
					$divTextWindow.append('<br />');
				} else if(isNaN(tagText)){
					for(var j = 0; j < tagText.length; j++){
						var char = tagText[j];
						var newChar = this.formatChar(char);

						$divTextWindow.append(
							$('<span />').addClass('letter ' + newChar).html('&nbsp;')
						);
					}
				} else if(char != ']' && char != '\n'){
					var newChar = this.formatChar(char);

					$divTextWindow.append(
						$('<span />').addClass('letter ' + newChar).html('&nbsp;')
					);
				}
				tagText = '';
			}
		}
		
		var textWithoutTags = this.getTextWithoutTags(text);
		$divTextWithoutTags.html(textWithoutTags);

		// Analysing current block
		var returnAnalysis = this.analyseScriptBlock($divTextWindow);
		if(returnAnalysis !== true){
			$divTextWindow.closest('div.dialog-preview').addClass('invalid').attr('title', returnAnalysis.message);
		} else {
			$divTextWindow.closest('div.dialog-preview').removeClass('invalid').removeAttr('title');
		}
	}
	
	this.updateRow = function(field){
		var $field = $(field);
		var $trField = $field.closest('tr');
		var $dialogParserTable = $('#dialog-parser-table');
		var tableObject = $dialogParserTable.DataTable();
		
		tableObject.row($trField).invalidate();
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
	
	this.showScriptConfigSettings = function(){
		var $divConfigSettings = $('#config-settings');
		
		// Showing modal
		$divConfigSettings.modal('show');
		
		// Loading configs into form
		this.loadConfigsForm();
	}
	
	this.loadConfigsForm = function(){
		var $radioMobileShowInitiallyPreview = $('#config-mobile-show-initially-preview');
		var $radioMobileShowInitiallyTextfield = $('#config-mobile-show-initially-textfield');
		var $radioThemeLight = $('#config-theme-light');
		var $radioThemeDark = $('#config-theme-dark');
		
		// Checking default options for each field
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
		
		// Avoid form resetting default behaviour
		return false;
	}
	
	this.loadDefaultConfigsForm = function(){
		var theme = this.defaultConfigs.theme;
		var mobileShowInitially = this.defaultConfigs.mobileShowInitially;
		
		var $radioThemeDefault = $('#config-theme-' + theme);
		var $radioMobileShowInitiallyDefault;
		if(mobileShowInitially == 'p'){
			$radioMobileShowInitiallyDefault = $('#config-mobile-show-initially-preview');
		} else {
			$radioMobileShowInitiallyDefault = $('#config-mobile-show-initially-textfield');
		}
		
		// Checking default options for each field
		$radioThemeDefault.prop('checked', true);
		$radioMobileShowInitiallyDefault.prop('checked', true);
		
		// Avoid form resetting default behaviour
		return false;
	}
	
	this.hideScriptConfigSettings = function(){
		$('#config-settings').modal('hide');
	}
	
	this.saveConfigs = function(){
		var $radioMobileShowInitially = $("input[name='config-mobile-show-initially']:checked");
		var $radioTheme = $("input[name='config-theme']:checked");
		
		var checkMobileShowInitiallyChanged = ($radioMobileShowInitially.val() != this.configs.mobileShowInitially);
		var checkThemeChanged = ($radioTheme.val() != this.configs.theme);
		
		this.hideScriptConfigSettings();
		this.showLoadingIndicator();
		
		var that = this;
		setTimeout(function(){
			if(checkMobileShowInitiallyChanged) that.changeMobileShowInitially( $radioMobileShowInitially[0] );
			if(checkThemeChanged) that.changeTheme( $radioTheme[0] );

			that.hideLoadingIndicator();
		}, 25);
		
		// Needed to avoid form submission
		return false;
	}
	
	this.openAboutPage = function(){
		var url_github = 'https://github.com/hansenhahn/mmbn-2/blob/master/Editor/README.md';
		if( this.checkOnElectron() ){
			var shell = require('electron').shell;
			shell.openExternal(url_github);
		} else {
			window.open(url_github);
		}
	}
	
	this.showScriptSaveSettings = function(){
		var $dialogParserTable = $('#dialog-parser-table');
		var $divSaveSettings = $('#save-settings');
		var $saveNameField = $('#save-name-field');
		
		var filename = $dialogParserTable.attr('data-filename');
		filename = filename.replace(/\..+$/, '');
		
		var data = new Date();
		data = new Date(data.getTime() - (data.getTimezoneOffset() * 60000)).toJSON();
		data = data.slice(0, 19).replace(/T/g, '-').replace(/:/g, '-');
		filename += ' (' + data + ')';
		
		$divSaveSettings.modal('show');
		$saveNameField.val(filename).focus();
	}
	
	this.hideScriptSaveSettings = function(){
		$('#save-settings').modal('hide');
	}
	
	this.showScriptAnalysisSettings = function(){
		$('#analysis-settings').modal('show');
	}
	
	this.hideScriptAnalysisSettings = function(){
		$('#analysis-settings').modal('hide');
	}
	
	this.toggleFileOrigin = function(radio){
		var $radio = $(radio);
		var $inputFileField = $('#file-field');
		var $divFileList = $('#file-list');
		
		var fileOrigin = $radio.val();
		if(fileOrigin == 'f'){
			$inputFileField.removeAttr('disabled').attr('required', 'required');
			$divFileList.hide().find("[type='radio']").prop('checked', false).removeAttr('required');
			$divFileList.find("label.btn-primary").removeClass('btn-primary').addClass('btn-default');
		} else {
			$inputFileField.attr('disabled', 'disabled').removeAttr('required');
			$divFileList.show().find("[type='radio']").attr('required', 'required');
		}
	}
	
	this.selectFileFromList = function(radio){
		var $radio = $(radio);
		var $label = $("label[for='" + $radio.attr('id') + "']");
		var $divFileList = $('#file-list');
		
		$divFileList.find('div.col').find('label.btn').removeClass('btn-primary').addClass('btn-default');
		$label.addClass('btn-primary').removeClass('btn-default');
	}
	
	this.changeMobileShowInitially = function(radio){
		var $radio = $(radio);
		var $dialogParserTable = $('#dialog-parser-table');
		
		var tableObject = $dialogParserTable.DataTable();
		var mobileShowInitially = $radio.val();
		stash.set('mobileShowInitially', mobileShowInitially);
		
		this.loadConfigs();
		
		this.updatePreviewVisibleTextareas();
		tableObject.draw(false);
	}
	
	this.updatePreviewVisibleTextareas = function(){
		var $dialogParserTable = $('#dialog-parser-table');
		var $textareas = $dialogParserTable.find('textarea');
		$textareas.trigger('keyup');
	}
	
	this.addNewDialogBlock = function(button){
		var $button = $(button);
		var $tr = $button.closest('tr');
		var $divDialogPreview = $button.closest('div.dialog-preview');
		var $divCharacterAvatar = $divDialogPreview.children('div.character-avatar');
		var $dialogParserTable = $('#dialog-parser-table');
		
		var tableObject = $dialogParserTable.DataTable();
		
		var that = this;
		var characterCode = $divCharacterAvatar.attr('data-character-code');
		var currentBlockNumber = parseFloat( $tr.find('.block-number').first().html() );
		var newBlockNumber = (currentBlockNumber + 0.01).toFixed(2);
		var newDialogId = (newBlockNumber.toString().replace(/\./g, '_')) + '-dialog';
		
		$.get('dialog-parser-row.html').then(function(response){
			var template = $.templates(response);

			var rowInfo = {
				'blockNumber': newBlockNumber,
				'dialogId': newDialogId,
				'characterCode': '',
				'textWithoutTags': ''
			}
			var $newTr = $( template.render(rowInfo) );
			var $newTdPreviewConteiners = $newTr.children('td.preview-conteiners');
			var $newTdFormFields = $newTr.children('td.form-fields');
			var $newTextarea = $newTdFormFields.find('textarea');
			var $newDivCharacterAvatar = $newTdPreviewConteiners.find('div.character-avatar');
			
			// Setting avatar from previous block into the new one
			$newDivCharacterAvatar.attr('data-character-code', characterCode);

			// Updating selector property with all textareas in an property
			tableObject.row.add($newTr);
			that.dialogParserTableTextareas = $( tableObject.rows().nodes() ).find("textarea.text-field");
			tableObject.draw(false);
			
			// Adding end block tag in the new block
			$newTextarea.val('\n------------------------------');
			
			// Adding remove button
			var $newButtonGroups = $newTdPreviewConteiners.find('div.btn-group');
			var $newButtonRemoveDialogBlock = $('<button />').addClass('btn btn-danger remove-block').attr({
				'tabindex': '-1',
				'title': 'Remover bloco de diálogo',
				'onclick': 'mmx4de.removeDialogBlock(this)'
			}).html('<span class="glyphicon glyphicon-minus"></span>');

			$newButtonGroups.append($newButtonRemoveDialogBlock[0].outerHTML);
			
			// Incrementing row counter in the footer of the table
			that.incrementTotalDialogsFooter();
			
			// Focusing new textarea and placing cursor at beginning of the field
			$newTextarea.focus();
			$newTextarea[0].setSelectionRange(0, 0);
		});
	}
	
	this.removeDialogBlock = function(button){
		var $button = $(button);
		var $tr = $button.closest('tr');
		var $dialogParserTable = $('#dialog-parser-table');
		var tableObject = $dialogParserTable.DataTable();
		
		// Updating selector property with all textareas in an property
		tableObject.row($tr).remove();
		this.dialogParserTableTextareas = $( tableObject.rows().nodes() ).find("textarea.text-field");
		tableObject.draw(false);
		
		this.decrementTotalDialogsFooter();
	}
	
	this.incrementTotalDialogsFooter = function(){
		var $dialogParserTable = $('#dialog-parser-table');
		var $tfoot = $dialogParserTable.children('tfoot');
		var $spanTotalDialogBlocks = $tfoot.find('span.total-dialog-blocks');
		var total = parseInt($spanTotalDialogBlocks.html(), 10);
		
		total++;
		
		$spanTotalDialogBlocks.html(total);
	}
	
	this.decrementTotalDialogsFooter = function(){
		var $dialogParserTable = $('#dialog-parser-table');
		var $tfoot = $dialogParserTable.children('tfoot');
		var $spanTotalDialogBlocks = $tfoot.find('span.total-dialog-blocks');
		var total = parseInt($spanTotalDialogBlocks.html(), 10);
		
		total--;
		
		$spanTotalDialogBlocks.html(total);
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
		
		var invalidKeycodes = [81, 87, 106, 111, 188, 190, 191, 192, 220, 221];
		var checkKeycodeInvalid = ($.inArray(keyCode, invalidKeycodes) !== -1);
		if(checkKeycodeInvalid){
			return false;
		} else {
			return true;
		}
	}
	
	this.previewScript = function(){
		var that = this;
		that.showLoadingIndicator();
		
		setTimeout(function(){
			var scriptText = that.generateScriptText();
			
			that.hideLoadingIndicator();
			
			that.showTextPreview(scriptText);
		}, 500);
	}
	
	this.saveScript = function(saveFileForm){
		var $saveNameField = $('#save-name-field');
		
		var that = this;
		that.hideScriptSaveSettings();
		that.showLoadingIndicator();
		
		setTimeout(function(){
			var scriptText = that.generateScriptText();
			var filename = $saveNameField.val() + '.txt';

			saveAs(new Blob([scriptText], {type: 'text/plain;charset=utf-8'}), filename, true);
			
			that.hideLoadingIndicator();
		}, 500);
		
		// Needed to avoid form submission
		return false;
	}
	
	this.generateScriptText = function(){
		var $dialogParserTable = $('#dialog-parser-table');
		var tableObject = $dialogParserTable.DataTable();
		
		var scriptText = '';

		$( tableObject.rows().nodes() ).find('textarea.text-field').sort(function(a, b){
			// Sort all textareas by id attribute, to avoid messing
			// with the order of dialogues
			return parseFloat( $(a).attr('data-block') ) - parseFloat( $(b).attr('data-block') );
		}).each(function(){
			var $textarea = $(this);
			var text = $textarea.val();
			
			if(text.endsWith('------------------------------')){
				scriptText += (text + '\n');
			} else {
				scriptText += (text + '\n\n');
			}
		});
		
		return scriptText;
	}
	
	this.analyzeScript = function(){
		var $dialogParserTable = $('#dialog-parser-table');
		var tableObject = $dialogParserTable.DataTable();
		
		var totalPages = tableObject.page.info().pages;
		
		this.hideScriptAnalysisSettings();
		this.showLoadingIndicator();
		var that = this;
		
		setTimeout(function(){
			var returnAnalysis = true;
			var $divInvalidTextWindow;
			var message = '';
			
			that.automaticPageChange = true;
			for(var page=0; page<totalPages; page++){
				tableObject.page(page).draw(false);
				$dialogParserTable.find('div.text-window').each(function(){
					var $divTextWindow = $(this);
					returnAnalysis = that.analyseScriptBlock($divTextWindow);
					
					if(returnAnalysis !== true){
						$divInvalidTextWindow = returnAnalysis.invalidBlock;
						message = returnAnalysis.message;
						return false;
					}
				});

				if(returnAnalysis !== true){
					break;
				}
			}
			that.hideLoadingIndicator();
			
			if(returnAnalysis !== true){
				$divInvalidTextWindow.closest('div.dialog-preview').addClass('invalid');
				that.showPopoverInvalidBlock($divInvalidTextWindow, message);
			} else {
				alert('Script OK!');
			}
			
			that.automaticPageChange = false;
		}, 500);
	}
	
	this.analyseScriptBlock = function(divTextWindow){
		var $divTextWindow = $(divTextWindow);
		
		var block_width = $divTextWindow.outerWidth();
		var line_number = 1;
		var line_width = 0;
		var characters_per_line = 0;
		var message = '';
		
		var checkValidBlock = true;

		$divTextWindow.children('*').each(function(){
			var $elem = $(this);
			
			var checkAtLeastOneCharacterInLine = false;
			
			if($elem.is('span.letter')){
				// Counting line width and characters on each line
				line_width += $elem.width() + parseInt($elem.css('marginLeft'), 10);
				characters_per_line++;
				checkAtLeastOneCharacterInLine = true;
			} else if($elem.is('br')){
				// Counting each line break
				line_number++;
				line_width = 0;
				characters_per_line = 0;
				checkAtLeastOneCharacterInLine = false;
			}
			
			// Validating block
			if(line_number > 3 && checkAtLeastOneCharacterInLine){
				checkValidBlock = false;
				message = 'Bloco com mais de 3 linhas!';
				return false; // Exit $.each
			}
			
			if(line_width > block_width){
				checkValidBlock = false;
				message = 'Largura da linha ultrapassa limite do bloco!';
			}
		});
		
		// Returning true if block is valid, or an array containing the block element
		// and the message being returned
		if(checkValidBlock){
			return true;
		} else {
			return {
				'invalidBlock': $divTextWindow,
				'message': message
			}
		}
	}
	
	this.showPopoverInvalidBlock = function(element, message){
		var $template = $("<div />").addClass('popover danger').attr('role', 'tooltip').append(
			$('<div />').addClass('arrow')
		).append(
			$('<h3 />').addClass('popover-title')
		).append(
			$('<div />').addClass('popover-content')
		);
		
		element.popover({
			'html': true,
			'placement': 'auto left',
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
	
	this.hidePopoverInvalidBlock = function(element){
		element.popover('hide');
	}
	
	this.showGotoRowFilters = function(){
		var $divGotoRowSettings = $('#goto-row-settings');
		var $inputBlockNumber = $('#goto-row-block-number');
		
		// Showing modal
		$divGotoRowSettings.modal('show');
		
		// Resetting all text fields
		$inputBlockNumber.val('').focus();
	}
	
	this.hideGotoRowFilters = function(){
		$('#goto-row-settings').modal('hide');
	}
	
	this.gotoRow = function(gotoRowForm){
		var $inputBlockNumber = $('#goto-row-block-number');
		var $dialogParserTable = $('#dialog-parser-table');
		
		var blockNumber = $inputBlockNumber.val();
		var tableObject = $dialogParserTable.DataTable();
		var pageLength = tableObject.page.info().length;
		
		var checkBlockNumberProvided = (blockNumber != '');
		
		this.hideGotoRowFilters();
		this.showLoadingIndicator();
		var that = this;
		
		setTimeout(function(){
			var checkRowFound = false;
			var $trFound;
			
			var checkFormValid = true;
			var invalidFormMessage = '';
			if(!checkBlockNumberProvided){
				checkFormValid = false;
				invalidFormMessage = 'Número do bloco não fornecido!';
			}
			
			if(checkFormValid){
				blockNumber = parseInt(blockNumber, 10);
				var destinationPage = Math.ceil( blockNumber / pageLength ) - 1;
				
				that.hideLoadingIndicator();
				
				checkRowFound = !isNaN(destinationPage);
				if(checkRowFound){
					tableObject.page(destinationPage).draw(false);
					$trFound = $dialogParserTable.find('td.block-number:contains("' + blockNumber + '")').closest('tr');
					
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
			} else {
				that.hideLoadingIndicator();
				
				alert(invalidFormMessage);
			}
		}, 500);
		
		// Needed to avoid form submission
		return false;
	}
	
	this.showLoadingIndicator = function(){
		$('#loading-indicator').modal('show');
	}
	
	this.hideLoadingIndicator = function(){
		$('#loading-indicator').modal('hide');
	}
	
	this.formatChar = function(char){
		var charTable = {
			// Symbols
			' ': 'space', '!': 'exclamation', '"': 'open-double-quotes', '#': 'cerquilha',
			'$': 'money-sign', '%': 'percent', '&': 'ampersand', "'": 'quotes',
			"(": 'open-parenthesis', ")": 'close-parenthesis', '*': 'asterisk',
			'+': 'plus', ',': 'comma', '-': 'minus', '.': 'dot', '/': 'slash',
			':': 'colon', ';': 'semicolon', '<': 'less-than', '=': 'equal', '>': 'greater-than',
			'?': 'interrogation', '@': 'at-sign',
			'©': 'copyright', '[': 'open-square-brackets', ']': 'close-square-brackets',
			'_': 'underscore', '¡': 'inverted-exclamation',
			'¿': 'inverted-interrogation', 'º': 'o-ordinal', 'ª': 'a-ordinal',
			'“': 'open-double-quotes', '”': 'close-double-quotes', '·': 'middot',
			
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
	
	this.getTitle = function(){
		if( this.checkOnElectron() ){
			var ipc = require('electron').ipcRenderer;
			return ipc.sendSync('getTitle');
		} else {
			return $('title').html();
		}
	}
	
	this.setTitle = function(title){
		if( this.checkOnElectron() ){
			var ipc = require('electron').ipcRenderer;
			ipc.send('setTitle', title);
		} else {
			$('title').html(title);
		}
	}
	
	this.removeTitleAttributeOnElectron = function(){
		if( this.checkOnElectron() ){
			var $title = $('title');
			var title = $title.html();
			
			$title.remove();
			this.setTitle(title);
		}
	}
	
	this.closeAboutWindowOnEscEvent = function(){
		if( this.checkOnElectron() ){
			document.addEventListener('keydown', function(e){
				if(e.which == 27){
					var ipc = require('electron').ipcRenderer;
					ipc.send('closeAboutWindow');
				}
			});
		}
	}
	
	this.getDevice = function(onresize){
		var that = this;
		if (typeof onresize == 'undefined') onresize = false;
		if (onresize) {
			$(window).off('resize.updateGlobalVariable').on('resize.updateGlobalVariable', function () {
				window.device = that.getDevice(false);
			});
		}
		var envs = ['xs', 'sm', 'md', 'lg'];

		var $el = $('<div>');
		$el.appendTo($('body'));

		for (var i = envs.length - 1; i >= 0; i--) {
			var env = envs[i];

			$el.addClass('hidden-' + env);
			if ($el.is(':hidden')) {
				$el.remove();
				return env;
			}
		}
	}
	
	this.checkOnElectron = function(){
		return (typeof process == 'object');
	}
}

// Instantiating object for class above
var mmx4de = new mmx4de();

// Disabling cache for all ajax requests
$.ajaxSetup ({
	cache: false
});