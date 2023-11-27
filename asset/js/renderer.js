const { ipcRenderer } = require('electron');
const fs = require('fs');
const mime = require('mime');
const path = require('path');
const sharp = require("sharp");

const buttonCreated = document.getElementById('upload');

const folderPath = path.join(__dirname + '../../', '_operations', 'original');

buttonCreated.addEventListener('click', function () {
    ipcRenderer.send('open-file-dialog-for-file');
});

async function updateFileList(fileList) {
    console.group('loop file');
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

            row.className = "pb-4 hover:bg-lime-500 hover:text-black";
            row.setAttribute('title', fileName);
            previewCell.className = "align-middle hover:bg-lime-500 hover:text-black rounded-l-full";
            nameCell.className = "w-28 align-middle hover:bg-lime-500 hover:text-black";
            sizeCell.className = "align-middle hover:bg-lime-500 hover:text-black";
            formatCell.className = "align-middle hover:bg-lime-500 hover:text-black";
            dimensionCell.className = "align-middle hover:bg-lime-500 hover:text-black";
            densityCell.className = "align-middle hover:bg-lime-500 hover:text-black";
            hasAlphaCell.className = "align-middle hover:bg-lime-500 hover:text-black";
            actionsCell.className = "align-middle hover:bg-lime-500 hover:text-black";
            deleteButton.className = "align-middle hover:bg-lime-500 hover:text-black";

            sharp(pathFile)
                .metadata()
                .then((metadata) => {
                    formatCell.innerHTML = metadata.format.toUpperCase();
                    dimensionCell.innerHTML = `${metadata.width} x ${metadata.height}`;
                    densityCell.innerHTML = `${metadata.density}`;
                    hasAlphaCell.innerHTML = `${metadata.hasAlpha}`;
                })
                .catch((err) => {
                    console.error("52", err);
                });

            // size file
            const stats = await fs.promises.stat(pathFile);
            const sizefile = stats.size ? Math.round(stats.size / 1024) + " MB" : 0;
            sizeCell.innerHTML = `<span>${sizefile}</span>`;

            // image preview
            previewCell.innerHTML = `<img src="${pathFile}" class="w-full h-full rounded-xl border-2 border-lime-500 bg-lime-500 " />`


            nameCell.innerHTML = `<span class="truncate w-80 grid text-md px-3" >${fileName}</span>`;


            deleteButton.innerHTML = `<svg title="Delete File" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" class="w-6 h-6  hover:text-black cursor-pointer"> <path stroke-linecap="round" stroke-linejoin="round" d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728A9 9 0 015.636 5.636m12.728 12.728L5.636 5.636" /> </svg>`;
            deleteButton.onclick = () => deleteFile(fileName);

            // Adicionar células à linha

            row.appendChild(previewCell);
            row.appendChild(nameCell);
            row.appendChild(sizeCell);
            row.appendChild(dimensionCell);
            row.appendChild(formatCell);
            row.appendChild(actionsCell);
            actionsCell.appendChild(deleteButton);

            // Adicionar linha à tabela
            fileListElement.appendChild(row);
        } catch (error) {
            console.error('Erro ao ler o arquivo:', error);
        }
    }

    console.groupEnd();
}

// Função para deletar um arquivo
function deleteFile(fileName) {

    const filePath = path.join(folderPath, fileName);

    if (fs.existsSync(filePath)) {
        console.error('deleteFile rendered', filePath);
        ipcRenderer.send('delete-file', fileName);
        ipcRenderer.send('list-files'); // update

    } else {
        console.error('File not found:', filePath);
    }
}

// Quando a página é carregada, solicite a lista de arquivos ao processo principal
document.addEventListener('DOMContentLoaded', () => {

    ipcRenderer.send('list-files');

    ipcRenderer.on('file-list', (event, fileList) => {
        updateFileList(fileList);
    });

    ipcRenderer.on('file-list-error', (event, errorMessage) => {
        console.error('File list error:', errorMessage);
        // Adicione lógica adicional se necessário
    });

});