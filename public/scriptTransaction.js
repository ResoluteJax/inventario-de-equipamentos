$(document).ready(function () {
    // Carregar transações existentes ao carregar a página
    loadTransactions();

    // Evento de submissão do formulário
    $('#transaction-form').on('submit', function (event) {
        event.preventDefault();

        const description = $('#description').val();
        const responsible = $('#responsible').val();
        const dateTime = $('#date-time').val();
        const destination = $('#destination').val();
        const observations = $('#observations').val();

        const newTransaction = {
            description: description,
            responsible: responsible,
            dateTime: dateTime,
            destination: destination,
            observations: observations,
            status: 'Aguardando Devolução' // Status padrão ao criar uma nova transação
        };

        $.ajax({
            url: '/transactions',
            type: 'POST',
            contentType: 'application/json',
            data: JSON.stringify(newTransaction),
            success: function (response) {
                response.dateTime = formatDateTime(response.dateTime); // Formatar a data e hora antes de adicionar à tabela
                addTransactionToTable(response, true);
                $('#transaction-form')[0].reset();
            },
            error: function (error) {
                console.error('Erro ao registrar transação:', error);
            }
        });
    });

    // Função para carregar transações existentes
    function loadTransactions() {
        $.ajax({
            url: '/transactions',
            type: 'GET',
            success: function (transactions) {
                transactions.sort((a, b) => new Date(b.date_time) - new Date(a.date_time)); // Ordenar transações por data de forma decrescente
                $('#transactions-table-body').empty(); // Limpar a tabela antes de adicionar as novas linhas
                transactions.forEach(transaction => {
                    transaction.date_time = formatDateTime(transaction.date_time); // Formatar a data e hora ao carregar
                    if (transaction.returned_at) {
                        transaction.returned_at = formatDateTime(transaction.returned_at);
                    }
                    addTransactionToTable(transaction, false);
                });
            },
            error: function (error) {
                console.error('Erro ao carregar transações:', error);
            }
        });
    }

    // Função para adicionar uma nova transação à tabela
    function addTransactionToTable(transaction, addToTop) {
        const disabled = transaction.status === 'Devolvido' ? 'disabled' : '';
        const returnedAt = transaction.returned_at ? `<br>(${transaction.returned_at})` : '';
        const buttonLabel = transaction.status === 'Devolvido' ? 'Devolvido' : 'Marcar como Devolvido';
        const row = `<tr data-id="${transaction.id}">
            <td>${transaction.id}</td>
            <td>${transaction.description}</td>
            <td>${transaction.responsible}</td>
            <td>${transaction.date_time}</td>
            <td>${transaction.destination}</td>
            <td>${transaction.observations}</td>
            <td class="status">${transaction.status}${returnedAt}</td>
            <td>
                <button class="btn btn-sm btn-success update-status" ${disabled}>${buttonLabel}</button>
            </td>
        </tr>`;

        if (addToTop) {
            $('#transactions-table-body').prepend(row);
        } else {
            $('#transactions-table-body').append(row);
        }
    }

    // Evento de clique para atualizar o status
    $('#transactions-table-body').on('click', '.update-status', function () {
        const row = $(this).closest('tr');
        const transactionId = row.data('id');
        const dateTime = new Date().toISOString();

        $.ajax({
            url: `/transactions/${transactionId}`,
            type: 'PATCH',
            contentType: 'application/json',
            data: JSON.stringify({
                status: 'Devolvido',
                returnedAt: dateTime
            }),
            success: function (response) {
                row.find('.status').html(`Devolvido<br>(${formatDateTime(dateTime)})`);
                row.find('.update-status').prop('disabled', true).text('Devolvido');
            },
            error: function (error) {
                console.error('Erro ao atualizar status:', error);
            }
        });
    });

    // Função para formatar a data e hora
    function formatDateTime(dateTime) {
        const date = new Date(dateTime);
        return date.toLocaleString('pt-BR', {
            dateStyle: 'short',
            timeStyle: 'short'
        });
    }

    // Evento de clique para exportar a tabela para PDF
    $('#export-pdf').on('click', function () {
        const { jsPDF } = window.jspdf;
        const doc = new jsPDF();

        // Ocultar e remover a coluna "Ações" temporariamente
        $('#transactions-table-body td:nth-child(8), #transactions-table-body th:nth-child(8)').hide();
        $('#transactions-table-head th:nth-child(8)').hide();

        html2canvas(document.querySelector('.table-wrapper')).then(canvas => {
            const imgData = canvas.toDataURL('image/png');
            const imgProps = doc.getImageProperties(imgData);
            const pdfWidth = doc.internal.pageSize.getWidth();
            const pdfHeight = (imgProps.height * pdfWidth) / imgProps.width;

            doc.addImage(imgData, 'PNG', 0, 0, pdfWidth, pdfHeight);
            doc.save('transacoes_hardware.pdf');

            // Mostrar a coluna "Ações" novamente
            $('#transactions-table-body td:nth-child(8), #transactions-table-body th:nth-child(8)').show();
            $('#transactions-table-head th:nth-child(8)').show();
        });
    });

    // Função auxiliar para atualizar o status (se necessário)
    function updateStatus(id, status) {
        const returnedAt = new Date().toISOString(); // Data e hora atual no formato ISO

        fetch(`/transactions/${id}`, {
                method: 'PATCH',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    status,
                    returnedAt
                })
            })
            .then(response => response.json())
            .then(data => {
                if (data.error) {
                    alert('Erro: ' + data.error);
                } else {
                    alert('Status atualizado com sucesso!');
                    loadTransactions();
                }
            })
            .catch(error => {
                console.error('Erro ao atualizar status:', error);
            });
    }
});
