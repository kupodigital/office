const { app, BrowserWindow, ipcMain, dialog, nativeImage, Menu, MenuItem, shell } = require('electron');
const path = require('path');
const fs = require('fs');
const Jimp = require("jimp");

let mainWindow;



const folderPath = path.join(__dirname + "../../../", '_operations', 'original');
const folderPathToJpeg = path.join(__dirname + "../../../", '_operations', 'toFormatJpeg');
const iconPath = path.join(__dirname + "../../../", 'asset', 'img');




function createWindow() {

    const menu = new Menu();

    menu.append(new MenuItem({
        label: 'Kupo Office',
        submenu: [{
            role: 'Donate',
            label: 'Donate Now',
            accelerator: process.platform === 'darwin' ? 'Alt+Cmd+I' : 'Alt+Shift+I',
            click: () => {
                console.log('Kupo Office rocks!')
            }
        }]
    }))

    Menu.setApplicationMenu(menu);

    mainWindow = new BrowserWindow({
        autoHideMenuBar: true,
        icon: nativeImage.createFromPath(path.join(iconPath, 'logo.png')),
        backgroundColor: '#000000',
        center: true,
        transparent: false,
        width: 1260,
        height: 750,
        minWidth: 860,
        frame: true,
        modal: true,
        show: true,
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

    ipcMain.on('open-file-dialog-for-file', async function (event) {
        try {
            const result = await dialog.showOpenDialog(mainWindow, {
                filters: [{ name: 'Images', extensions: ['jpg', 'jpeg', 'tiff', 'png', 'gif'] }],
                properties: ['openFile', 'multiSelections']
            });

            if (!result.canceled && result.filePaths.length > 0) {

                if (!fs.existsSync(folderPath)) {
                    fs.mkdirSync(folderPath, { recursive: true });
                }

                let files = [];
                for (const filePath of result.filePaths) {
                    const fileName = path.basename(filePath);
                    files.push(fileName);

                    const destinationPath = path.join(folderPath, fileName);
                    fs.copyFileSync(filePath, destinationPath);
                }

                event.sender.send('selected-files', result.filePaths);
                event.sender.send('refresh-list', files);
            }
        } catch (err) {
            console.error('Error opening file dialog:', err);
        }
    });
    /*
    ipcMain.on('open-file-dialog-for-file', function (event) {
        dialog.showOpenDialog(mainWindow, {
            filters: [{ name: 'Images', extensions: ['jpg', 'jpeg', 'tiff', 'png', 'gif'] }],
            properties: ['openFile', 'multiSelections']
        }).then(result => {
            if (!result.canceled && result.filePaths.length > 0) {

                if (!fs.existsSync(folderPath)) {
                    fs.mkdirSync(folderPath, { recursive: true });
                }

                let files = [];
                result.filePaths.forEach(filePath => {

                    const fileName = path.basename(filePath);
                    files.push(fileName);

                    const destinationPath = path.join(folderPath, fileName);
                    fs.copyFileSync(filePath, destinationPath);

                });
                event.sender.send('selected-files', result.filePaths);
                event.sender.send('refresh-list', files);
            }
        }).catch(err => {
            console.error('Error opening file dialog:', err);
        });
    });
    */


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


    ipcMain.on('preview-file', async (event, fileName, w, h) => {
        const filePath = folderPath + '/' + fileName;
        if (fs.existsSync(filePath)) {
            const previewWindow = new BrowserWindow({
                width: w,
                height: h,
                center: true,
                title: 'Preview',
                transparent: true,
                frame: true,
                modal: true,
                autoHideMenuBar: true,
                webPreferences: {
                    nodeIntegration: true
                }
            });
            previewWindow.loadURL(`file://${filePath}`);
        }
    });

    ipcMain.on('open-external-link', (event, url) => {
        shell.openExternal(url);
    });

    async function resizeImage(imagePath, w = Jimp.AUTO, h = 1000) {
        const newImageName = imagePath.replace('/original/', '/resized/');
        Jimp.read(imagePath)
            .then((image) => {
                return image.resize(w, h).writeAsync(newImageName); // save
            })
            .catch((err) => {
                console.error(err);
            });
    }

    async function greyscaleImage(imagePath) {
        // https://www.npmjs.com/package/jimp
        const newImageName = imagePath.replace('/original/', '/resized/');
        Jimp.read(imagePath)
            .then((image) => {
                return image.greyscale().writeAsync(newImageName); // save
            })
            .catch((err) => {
                console.error(err);
            });
    }

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