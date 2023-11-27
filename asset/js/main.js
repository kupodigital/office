const { app, BrowserWindow, ipcMain, dialog, nativeImage } = require('electron');
const path = require('path');
const fs = require('fs');

let mainWindow;



const folderPath = path.join(__dirname + "../../../", '_operations', 'original');
const iconPath = path.join(__dirname + "../../../", 'asset', 'img');




function createWindow() {

    //const appIcon = new Tray(iconPath);

    mainWindow = new BrowserWindow({
        autoHideMenuBar: true,
        icon: nativeImage.createFromPath(path.join(iconPath, 'logo.png')),
        backgroundColor: '#2e2c29',
        center: true,
        transparent: false,
        width: 1080,
        height: 750,
        frame: true,
        thickFrame: false,
        darkTheme: true,
        hasShadow: false,
        navigateOnDragDrop: true,
        enablePreferredSizeMode: true,
        webPreferences: {
            nodeIntegration: true,
            enableRemoteModule: true,
            contextIsolation: false
        },
    });

    mainWindow.webContents.openDevTools();

    //mainWindow.setIcon(path.join(iconPath, 'logo.png'));
    mainWindow.setOverlayIcon(nativeImage.createFromPath(path.join(iconPath, 'logo-office.ico')), 'Kupo Office');

    //mainWindow.webContents.capturePage();

    mainWindow.loadFile(__dirname + '../..' + '/index.html');

    mainWindow.on('closed', function () {
        mainWindow = null;
    });

    ipcMain.on('open-file-dialog-for-file', function (event) {
        dialog.showOpenDialog(mainWindow, {
            filters: [{ name: 'Images', extensions: ['jpg', 'jpeg', 'tiff', 'png', 'gif'] }],
            properties: ['openFile', 'multiSelections']
        }).then(result => {
            if (!result.canceled && result.filePaths.length > 0) {

                if (!fs.existsSync(folderPath)) {
                    fs.mkdirSync(folderPath, { recursive: true });
                }

                result.filePaths.forEach(filePath => {
                    const fileName = path.basename(filePath);
                    const destinationPath = path.join(folderPath, fileName);
                    fs.copyFileSync(filePath, destinationPath);
                });
                event.sender.send('selected-files', result.filePaths);

            }
        }).catch(err => {
            console.error('Error opening file dialog:', err);
        });
    });

    ipcMain.on('file-list', (event, fileList) => {
        event.sender.send('list-files');
    });

    ipcMain.on('list-files', async (event) => {
        try {
            const fileList = await listFilesInFolder(folderPath);
            event.sender.send('file-list', fileList);
        } catch (error) {
            console.error('Error listing files:', error);
            event.sender.send('file-list-error', error.message);
        }
    });

    ipcMain.on('delete-file', async (event, fileName) => {
        const filePath = folderPath + '/' + fileName;
        if (fs.existsSync(filePath)) {
            fs.promises.rm(filePath);
        }
        event.sender.send('update-file-list');
    });

    function listFilesInFolder(folderPath) {
        return new Promise((resolve, reject) => {
            fs.readdir(folderPath, (err, files) => {
                if (err) {
                    reject(err);
                } else {
                    resolve(files);
                }
            });
        });
    }

}



app.on('ready', createWindow);

app.on('window-all-closed', function () {
    if (process.platform !== 'darwin') app.quit();
});

app.on('activate', function () {
    if (mainWindow === null) createWindow();
});