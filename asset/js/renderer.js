const { ipcRenderer, BrowserWindow } = require('electron');
const fs = require('fs');
const mime = require('mime');
const path = require('path');
const sharp = require("sharp");

const folderPath = path.join(__dirname + '../../', '_operations', 'original');

const buttonCreated = document.getElementById('upload');
buttonCreated.addEventListener('click', function () {
    ipcRenderer.send('open-file-dialog-for-file');
});


const externalLinks = document.querySelectorAll('.external-link');

externalLinks.forEach(link => {
    link.addEventListener('click', function (event) {
        event.preventDefault();

        // Obtém o valor do href do link clicado
        const externalUrl = this.href;

        // Envia uma mensagem para o processo principal para abrir o link externo
        ipcRenderer.send('open-external-link', externalUrl);
    });
});



async function updateFileList(fileList) {

    const fileListElement = document.getElementById('fileList');
    fileListElement.innerHTML = '';
    for (const fileName of fileList) {

        const pathFile = path.join(folderPath, fileName);
        const type = mime.getType(pathFile);

        if (!fs.existsSync(pathFile)) {
            continue;
        }

        if (!type || type.indexOf('image') === -1) {
            continue;
        }

        try {
            const row = document.createElement('tr');
            const previewCell = document.createElement('td');
            const nameCell = document.createElement('td');
            const sizeCell = document.createElement('td');
            const formatCell = document.createElement('td');
            const dimensionCell = document.createElement('td');
            const densityCell = document.createElement('td');
            const hasAlphaCell = document.createElement('td');
            const actionsCell = document.createElement('td');
            const deleteButton = document.createElement('button');
            const previewButton = document.createElement('button');

            row.className = "pb-4 hover:bg-lime-500 hover:text-black";
            row.setAttribute('title', fileName);
            previewCell.className = "align-middle hover:bg-lime-500 rounded-l-xl";
            nameCell.className = "w-28 align-middle hover:bg-lime-500 hover:text-black";
            sizeCell.className = "align-middle hover:bg-lime-500 hover:text-black";
            formatCell.className = "align-middle hover:bg-lime-500 hover:text-black";
            dimensionCell.className = "align-middle hover:bg-lime-500 hover:text-black";
            densityCell.className = "align-middle hover:bg-lime-500 hover:text-black";
            hasAlphaCell.className = "align-middle hover:bg-lime-500 hover:text-black";
            actionsCell.className = "align-middle hover:bg-lime-500 hover:text-black";
            deleteButton.className = "align-middle hover:bg-lime-500 hover:text-black ml-3 inline";
            previewButton.className = "align-middle hover:bg-lime-500 hover:text-black ml-3 inline";


            let width = 800;
            let height = 600;

            sharp(pathFile)
                .metadata()
                .then((metadata) => {
                    formatCell.innerHTML = metadata.format.toUpperCase();
                    dimensionCell.innerHTML = `${metadata.width} x ${metadata.height}`;
                    densityCell.innerHTML = `${metadata.density}`;
                    hasAlphaCell.innerHTML = `${metadata.hasAlpha}`;
                    width = metadata.width;
                    height = metadata.height;
                })
                .catch((err) => {
                    console.error("72", err);
                });

            // size file
            const stats = await fs.promises.stat(pathFile);
            const sizefile = stats.size ? Math.round(stats.size / 1024) + " MB" : 0;
            sizeCell.innerHTML = `<span>${sizefile}</span>`;

            // image preview
            previewCell.innerHTML = `<img src="${pathFile}" class="w-full h-full rounded-xl border-2 hover:border-r-0 border-lime-500 bg-lime-500 " />`


            nameCell.innerHTML = `<span class="truncate w-80 grid text-md px-3" >${fileName}</span>`;

            deleteButton.innerHTML = `<svg class="w-6 h-6 hover:text-black cursor-pointer" aria-hidden="true" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 18 20"><path stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="0.7" d="M1 5h16M7 8v8m4-8v8M7 1h4a1 1 0 0 1 1 1v3H6V2a1 1 0 0 1 1-1ZM3 5h12v13a1 1 0 0 1-1 1H4a1 1 0 0 1-1-1V5Z"/></svg>`;
            deleteButton.onclick = () => deleteFile(fileName);

            previewButton.innerHTML = `<svg class="w-6 h-6 hover:text-black cursor-pointer" aria-hidden="true" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 20 14"> <g stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="0.7"> <path d="M10 10a3 3 0 1 0 0-6 3 3 0 0 0 0 6Z"/> <path d="M10 13c4.97 0 9-2.686 9-6s-4.03-6-9-6-9 2.686-9 6 4.03 6 9 6Z"/>  </g>  </svg>`;
            previewButton.onclick = () => previewFile(fileName, width, height);

            // Adicionar células à linha
            row.appendChild(previewCell);
            row.appendChild(nameCell);
            row.appendChild(sizeCell);
            row.appendChild(dimensionCell);
            row.appendChild(formatCell);
            row.appendChild(actionsCell);
            actionsCell.appendChild(deleteButton);
            actionsCell.appendChild(previewButton);

            // Adicionar linha à tabela
            fileListElement.appendChild(row);

        } catch (error) {
            console.error('Erro ao ler o arquivo:', error);
        }
    }
}

function previewFile(fileName, w, h) {
    const filePath = path.join(folderPath, fileName);
    if (fs.existsSync(filePath)) {
        ipcRenderer.send('preview-file', fileName, w / 1000, h / 1000);
    }
}

function deleteFile(fileName) {
    const filePath = path.join(folderPath, fileName);
    if (fs.existsSync(filePath)) {
        ipcRenderer.send('delete-file', fileName);
        ipcRenderer.send('list-files'); // update
    } else {
        console.error('File not found:', filePath);
    }
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


document.addEventListener('DOMContentLoaded', () => {

    ipcRenderer.send('list-files');

    ipcRenderer.on('file-list', (event, fileList) => {
        updateFileList(fileList);
    });

    ipcRenderer.on('refresh-list', async (event, fileList) => {
        try {
            const fileList = await listFilesInFolder(folderPath);

            updateFileList(fileList);
        } catch (error) {
            console.error('Error listing files:', error);
        }
    });

    ipcRenderer.on('file-list-error', (event, errorMessage) => {
        console.error('File list error:', errorMessage);
    });

});