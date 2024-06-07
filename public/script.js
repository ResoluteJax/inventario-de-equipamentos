document.addEventListener('DOMContentLoaded', function () {
    // Carregar inventário ao carregar a página
    loadInventory();

    const searchInput = document.getElementById('search-input');

    if (searchInput) {
        searchInput.addEventListener('input', function () {
            const searchTerm = searchInput.value.trim().toLowerCase();
            if (searchTerm === '') {
                loadInventory();
                return;
            }

            fetch('/inventory')
                .then(response => {
                    if (!response.ok) {
                        throw new Error('Erro ao carregar o inventário');
                    }
                    return response.json();
                })
                .then(data => {
                    const filteredData = data.filter(item =>
                        item.hostname.toLowerCase().includes(searchTerm) ||
                        item.nomeProp.toLowerCase().includes(searchTerm) ||
                        item.departamento.toLowerCase().includes(searchTerm) ||
                        item.modelo.toLowerCase().includes(searchTerm) ||
                        item.numeroSerie.toLowerCase().includes(searchTerm)
                    );

                    const tbody = document.getElementById('inventory-table-body');
                    if (tbody) {
                        tbody.innerHTML = '';
                        filteredData.forEach(item => {
                            const row = document.createElement('tr');
                            row.innerHTML = `
                                <td>${item.hostname}</td>
                                <td>${item.nomeProp}</td>
                                <td>${item.departamento}</td>
                                <td>${item.modelo}</td>
                                <td>${item.numeroSerie}</td>
                                <td>
                                    <button class="btn btn-primary btn-sm" onclick="editItem(${item.id})">Editar</button>
                                </td>
                            `;
                            tbody.appendChild(row);
                        });
                    } else {
                        console.error('Elemento tbody não encontrado.');
                    }
                })
                .catch(error => {
                    console.error('Erro:', error);
                });
        });
    } else {
        console.error('Elemento search-input não encontrado.');
    }
});

function loadInventory() {
    fetch('/inventory')
        .then(response => response.json())
        .then(data => {
            const tbody = document.getElementById('inventory-table-body');
            if (tbody) {
                tbody.innerHTML = '';
                data.forEach(item => {
                    const row = document.createElement('tr');
                    row.innerHTML = `
                        <td>${item.hostname}</td>
                        <td>${item.nomeProp}</td>
                        <td>${item.departamento}</td>
                        <td>${item.modelo}</td>
                        <td>${item.numeroSerie}</td>
                        <td>
                            <button class="btn btn-primary btn-sm" onclick="editItem(${item.id})">Editar</button>
                        </td>
                    `;
                    tbody.appendChild(row);
                });
            } else {
                console.error('Elemento tbody não encontrado.');
            }
        });
}

function editItem(itemId) {
    fetch(`/edit-item/${itemId}`)
        .then(response => {
            if (!response.ok) {
                throw new Error('Erro ao buscar os dados do item');
            }
            return response.json();
        })
        .then(data => {
            const editForm = document.getElementById('edit-equipment-form');
            if (editForm) {
                const hostnameInput = document.getElementById('edit-hostname');
                const nomePropInput = document.getElementById('edit-nomeProp');
                const departamentoInput = document.getElementById('edit-departamento');
                const modeloInput = document.getElementById('edit-modelo');
                const numeroSerieInput = document.getElementById('edit-numeroSerie');

                if (hostnameInput && nomePropInput && departamentoInput && modeloInput && numeroSerieInput) {
                    hostnameInput.value = data.hostname;
                    nomePropInput.value = data.nomeProp;
                    departamentoInput.value = data.departamento;
                    modeloInput.value = data.modelo;
                    numeroSerieInput.value = data.numeroSerie;

                    editForm.onsubmit = function (event) {
                        event.preventDefault();
                        saveChanges(itemId);
                    };
                } else {
                    console.error('Um ou mais elementos de entrada não foram encontrados no DOM.');
                }
            } else {
                console.error('O formulário de edição não foi encontrado no DOM.');
            }
        })
        .catch(error => {
            console.error('Erro:', error);
        });
}

function saveChanges(itemId) {
    const hostname = document.getElementById('edit-hostname').value;
    const nomeProp = document.getElementById('edit-nomeProp').value;
    const departamento = document.getElementById('edit-departamento').value;
    const modelo = document.getElementById('edit-modelo').value;
    const numeroSerie = document.getElementById('edit-numeroSerie').value;

    fetch(`/update-item/${itemId}`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                hostname,
                nomeProp,
                departamento,
                modelo,
                numeroSerie
            })
        })
        .then(response => {
            if (!response.ok) {
                throw new Error('Erro ao salvar as alterações');
            }
            return response.text();
        })
        .then(data => {
            alert('Alterações salvas com sucesso');
            loadInventory();
        })
        .catch(error => {
            console.error('Erro:', error);
        });
}



// Função para exportar a tabela como PDF
document.getElementById('export-pdf').addEventListener('click', () => {
    const {
        jsPDF
    } = window.jspdf;

    // Remover a coluna "Ações" temporariamente
    const actionColumnHeader = document.querySelector('#inventory-table th:nth-child(6)');
    const actionColumnCells = document.querySelectorAll('#inventory-table td:nth-child(6)');
    actionColumnHeader.style.display = 'none';
    actionColumnCells.forEach(cell => cell.style.display = 'none');

    // Usar html2canvas para capturar a tabela como uma imagem
    html2canvas(document.getElementById('inventory-table')).then(canvas => {
        // Restaurar a coluna "Ações"
        actionColumnHeader.style.display = '';
        actionColumnCells.forEach(cell => cell.style.display = '');

        const imgData = canvas.toDataURL('image/png');
        const imgWidth = 210; // Largura da imagem em mm
        const pageHeight = 295; // Altura da página em mm
        const imgHeight = canvas.height * imgWidth / canvas.width;
        let heightLeft = imgHeight;

        // Criar uma nova instância do jsPDF
        const doc = new jsPDF();

        let position = 0;

        // Adicionar a imagem ao PDF
        doc.addImage(imgData, 'PNG', 0, position, imgWidth, imgHeight);
        heightLeft -= pageHeight;

        while (heightLeft >= 0) {
            position = heightLeft - imgHeight;
            doc.addPage();
            doc.addImage(imgData, 'PNG', 0, position, imgWidth, imgHeight);
            heightLeft -= pageHeight;
        }

        // Salvar o PDF
        doc.save('inventario.pdf');
    });
});

function loadInventory() {
    fetch('/inventory')
        .then(response => response.json())
        .then(data => {
            const tbody = document.getElementById('inventory-table-body');
            tbody.innerHTML = '';
            data.forEach(item => {
                const row = document.createElement('tr');
                row.innerHTML = `
                    <td>${item.hostname}</td>
                    <td>${item.nomeProp}</td>
                    <td>${item.departamento}</td>
                    <td>${item.modelo}</td>
                    <td>${item.numeroSerie}</td>
                    <td>
                        <button class="btn btn-primary btn-sm" onclick="editItem(${item.id})">Editar</button>
                    </td>
                `;
                tbody.appendChild(row);
            });
        });
}

function editItem(itemId) {
    fetch(`/edit-item/${itemId}`)
        .then(response => {
            if (!response.ok) {
                throw new Error('Erro ao buscar os dados do item');
            }
            return response.json();
        })
        .then(data => {
            document.getElementById('edit-hostname').value = data.hostname;
            document.getElementById('edit-nomeProp').value = data.nomeProp;
            document.getElementById('edit-departamento').value = data.departamento;
            document.getElementById('edit-modelo').value = data.modelo;
            document.getElementById('edit-numeroSerie').value = data.numeroSerie;

            document.getElementById('edit-equipment-form').onsubmit = function (event) {
                event.preventDefault();
                saveChanges(itemId);
            };
        })
        .catch(error => {
            console.error('Erro:', error);
        });
}

function saveChanges(itemId) {
    const hostname = document.getElementById('edit-hostname').value;
    const nomeProp = document.getElementById('edit-nomeProp').value;
    const departamento = document.getElementById('edit-departamento').value;
    const modelo = document.getElementById('edit-modelo').value;
    const numeroSerie = document.getElementById('edit-numeroSerie').value;

    fetch(`/update-item/${itemId}`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                hostname,
                nomeProp,
                departamento,
                modelo,
                numeroSerie
            })
        })
        .then(response => {
            if (!response.ok) {
                throw new Error('Erro ao salvar as alterações');
            }
            return response.text();
        })
        .then(data => {
            alert('Alterações salvas com sucesso');
            loadInventory();
        })
        .catch(error => {
            console.error('Erro:', error);
        });
}


document.addEventListener('DOMContentLoaded', function () {
    // Função para buscar transações ao carregar a página
    fetchTransactions();

    // Evento de submissão do formulário de transação
    document.getElementById('transaction-form').onsubmit = function (event) {
        event.preventDefault();
        const description = document.getElementById('description').value;
        const responsible = document.getElementById('responsible').value;
        const dateTime = document.getElementById('date-time').value;
        const destination = document.getElementById('destination').value;
        const observations = document.getElementById('observations').value;

        // Enviar os dados da transação para o servidor
        fetch('/record-transaction', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    description: description,
                    responsible: responsible,
                    date_time: dateTime,
                    destination: destination,
                    observations: observations
                })
            })
            .then(response => {
                if (!response.ok) {
                    throw new Error('Erro ao registrar transação');
                }
                return response.text();
            })
            .then(data => {
                alert('Transação registrada com sucesso!');
                document.getElementById('transaction-form').reset();
                fetchTransactions();
            })
            .catch(error => {
                console.error('Erro:', error);
            });
    };

    // Função para buscar transações do servidor
    function fetchTransactions() {
        fetch('/get-transactions')
            .then(response => response.json())
            .then(data => {
                const tableBody = document.getElementById('transactions-table-body');
                tableBody.innerHTML = '';
                data.forEach(transaction => {
                    const row = document.createElement('tr');
                    row.innerHTML = `
                        <td>${transaction.id}</td>
                        <td>${transaction.description}</td>
                        <td>${transaction.responsible}</td>
                        <td>${transaction.date_time}</td>
                        <td>${transaction.destination}</td>
                        <td>${transaction.observations}</td>
                        <td>${transaction.status}</td>
                        <td>
                            <button class="btn btn-success btn-sm" onclick="markAsReturned(${transaction.id})">Marcar como Devolvido</button>
                        </td>
                    `;
                    tableBody.appendChild(row);
                });
            })
            .catch(error => {
                console.error('Erro ao buscar transações:', error);
            });
    }

    // Função para marcar transação como devolvida
    window.markAsReturned = function (transactionId) {
        fetch(`/update-transaction-status/${transactionId}`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    status: 'Devolvido'
                })
            })
            .then(response => {
                if (!response.ok) {
                    throw new Error('Erro ao atualizar status da transação');
                }
                return response.text();
            })
            .then(data => {
                alert('Status da transação atualizado com sucesso!');
                fetchTransactions();
            })
            .catch(error => {
                console.error('Erro:', error);
            });
    };
});