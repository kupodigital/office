const { ipcRenderer } = require('electron');
const fs = require('fs');
const mime = require('mime');
const path = require('path');

const buttonCreated = document.getElementById('upload');

buttonCreated.addEventListener('click', function () {
    ipcRenderer.send('open-file-dialog-for-file');
});

async function updateFileList(fileList) {
    console.group('loop file');
    const fileListElement = document.getElementById('fileList');
    fileListElement.innerHTML = '';
    for (const fileName of fileList) {
        const pathFile = path.join(__dirname + '../../', '_operations', 'original', fileName);

        try {
            const row = document.createElement('tr');
            const nameCell = document.createElement('td');
            const sizeCell = document.createElement('td');
            const formatCell = document.createElement('td');
            const actionsCell = document.createElement('td');
            const deleteButton = document.createElement('button');

            // type file
            formatCell.textContent = mime.getType(pathFile);;

            // size file
            const stats = await fs.promises.stat(pathFile);
            sizeCell.textContent = stats.size ? Math.round(stats.size / 1024) + " MB" : 0;

            // Configurar as células com os dados do arquivo
            nameCell.textContent = fileName;
            deleteButton.textContent = 'Delete';
            deleteButton.onclick = () => deleteFile(fileName);

            // Adicionar células à linha
            row.appendChild(nameCell);
            row.appendChild(sizeCell);
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
    // TODO: Implementar lógica para deletar o arquivo
    // Você pode usar ipcRenderer.send para enviar uma mensagem para o processo principal
    // e, em seguida, atualizar a lista após a exclusão
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