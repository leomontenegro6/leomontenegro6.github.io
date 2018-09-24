const electron = require('electron')
const fs = require('fs')

const app = electron.app
const BrowserWindow = electron.BrowserWindow
const Menu = electron.Menu
const ipc = electron.ipcMain
const globalShortcut = electron.globalShortcut

const path = require('path')
const url = require('url')

// Keep a global reference of the variables below, if you don't, the app may
// be affected by javascript garbage collection routines
let mainWindow
let menu
let aboutWindow

function createWindow () {
	// Create windows
	mainWindow = new BrowserWindow({
		width: 1280,
		height: 768,
		title: app.getName()
	})
	
	// Maximize window, if needed
	//mainWindow.maximize();

	// and load the index.html of the app.
	mainWindow.loadURL(url.format({
		pathname: path.join(__dirname, 'index.html'),
		protocol: 'file:',
		slashes: true
	}))

	// Open the DevTools.
	//mainWindow.webContents.openDevTools()
	
	// Injecting custom CSS for changing styles in electron
	mainWindow.webContents.on('did-finish-load', function() {
		fs.readFile(__dirname + '/css/css-electron.css', "utf-8", function(error, data) {
			if (!error){
				var formatedData = data.replace(/\s{2,10}/g, ' ').trim()
				mainWindow.webContents.insertCSS(formatedData)
			}
		})
	})

	// Emitted when the window is closed.
	mainWindow.on('closed', (e) => {
		// Dereference the window object, usually you would store windows
		// in an array if your app supports multi windows, this is the time
		// when you should delete the corresponding element.
		aboutWindow = null
		mainWindow = null
	})

	// Instantiating menus
	const menuTemplate = [
		{
			id: 'file',
			label: 'Arquivo',
			submenu: [
				{
					id: 'openTextFile',
					label: 'Abrir arquivo de texto',
					accelerator: 'CmdOrCtrl+Shift+A',
					click () {
						mainWindow.webContents.executeJavaScript("aaig.openTextFile()")
					}
				},
				{
					id: 'exit',
					label: 'Sair',
					role: 'close'
				}
			]
		},
		{
			id: 'tools',
			label: 'Ferramentas',
			submenu: [
				{
					id: 'configSettings',
					label: 'Configurações',
					accelerator: 'CmdOrCtrl+Shift+C',
					click () {
						mainWindow.webContents.executeJavaScript("aaig.showConfigSettings()")
					}
				}
			]
		},
		{
			id: 'help',
			label: 'Ajuda',
			submenu: [
				{
					id: 'about',
					label: 'Sobre',
					accelerator: 'F1',
					click () {
						// Creating about window, and setting it as child of main window
						aboutWindow = new BrowserWindow({
							width: 640,
							height: 384,
							title: 'Sobre o programa',
							parent: mainWindow,
							resizable: false,
							fullscreenable: false,
							minimizable: false,
							maximizable: false,
							center: true,
							modal: true
						})
						
						// Loading "about.html" inside the window
						aboutWindow.loadURL(url.format({
							pathname: path.join(__dirname, 'about.html'),
							protocol: 'file:',
							slashes: true
						}))
						
						// Open the DevTools for the about window.
						//aboutWindow.webContents.openDevTools()
						
						// Removing menubar from about window
						aboutWindow.setMenu(null)
					}
				}
			]
		}
	];
	menu = Menu.buildFromTemplate(menuTemplate)
	Menu.setApplicationMenu(menu)
	
	// Global shortcuts
	for(let i=1; i<=6; i++){
		globalShortcut.register('CmdOrCtrl+'+i, () => {
			mainWindow.webContents.executeJavaScript("aaig.triggerClickTab(" + i + ")")
		})
	}
}

// This method will be called when Electron has finished
// initialization and is ready to create browser windows.
// Some APIs can only be used after this event occurs.
app.on('ready', createWindow)

// Quit when all windows are closed.
app.on('window-all-closed', function () {
	// On OS X it is common for applications and their menu bar
	// to stay active until the user quits explicitly with Cmd + Q
	if (process.platform !== 'darwin') {
		app.quit()
	}
})

app.on('activate', function () {
	// On OS X it's common to re-create a window in the app when the
	// dock icon is clicked and there are no other windows open.
	if (mainWindow === null) {
		createWindow()
	}
})

// In this file you can include the rest of your app's specific main process
// code. You can also put them in separate files and require them here.
ipc.on('getTitle', (e) => {
	e.returnValue = mainWindow.getTitle()
})
ipc.on('setTitle', (e, title) => {
	mainWindow.setTitle(title)
})
ipc.on('closeAboutWindow', () => {
	aboutWindow.close()
})