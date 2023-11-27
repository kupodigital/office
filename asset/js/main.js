const { app, BrowserWindow, ipcMain, dialog } = require('electron');
const path = require('path');
const fs = require('fs');

let mainWindow;

function createWindow() {
    mainWindow = new BrowserWindow({

        transparent: true,
        width: 1080,
        height: 750,
        webPreferences: {
            nodeIntegration: true,
            enableRemoteModule: true,
            contextIsolation: false
        },
    });

    mainWindow.webContents.openDevTools();

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
                const destinationFolder = path.join(__dirname + '../../../', '_operations', 'original');

                // Certifique-se de que a pasta de destino exista
                if (!fs.existsSync(destinationFolder)) {
                    fs.mkdirSync(destinationFolder, { recursive: true });
                }

                // Copie cada arquivo para a pasta de destino
                result.filePaths.forEach(filePath => {
                    const fileName = path.basename(filePath);
                    const destinationPath = path.join(destinationFolder, fileName);
                    fs.copyFileSync(filePath, destinationPath);
                });

                event.sender.send('selected-files', result.filePaths);
            }
        }).catch(err => {
            console.error('Error opening file dialog:', err);
        });
    });


    ipcMain.on('list-files', async (event) => {
        const folderPath = path.join(__dirname + "../../../", '_operations', 'original');

        console.log('Listing files in folder:', folderPath);

        try {
            const fileList = await listFilesInFolder(folderPath);
            console.log('File list:', fileList);
            event.sender.send('file-list', fileList);
        } catch (error) {
            console.error('Error listing files:', error);
            event.sender.send('file-list-error', error.message);
        }
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