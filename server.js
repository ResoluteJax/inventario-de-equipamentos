// server.js

const express = require('express');
const app = express();
const sqlite3 = require('sqlite3').verbose();
const bodyParser = require('body-parser');
const path = require('path');

// Configurações do middleware
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({
    extended: true
}));
app.use(express.static(path.join(__dirname, 'public')));

// Conexão com o banco de dados SQLite
let db = new sqlite3.Database('./inventory.db', (err) => {
    if (err) {
        console.error('Erro ao conectar com o banco de dados:', err.message);
    } else {
        console.log('Conectado ao banco de dados SQLite.');
    }
});

// Criação das tabelas se não existirem
db.run(`CREATE TABLE IF NOT EXISTS equipment (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    hostname TEXT,
    nomeProp TEXT,
    departamento TEXT,
    modelo TEXT,
    numeroSerie TEXT
)`);


// Endpoint para adicionar um novo equipamento
app.post('/add-equipment', (req, res) => {
    const {
        hostname,
        nomeProp,
        departamento,
        modelo,
        numeroSerie
    } = req.body;
    db.run(`INSERT INTO equipment (hostname, nomeProp, departamento, modelo, numeroSerie) 
            VALUES (?, ?, ?, ?, ?)`, [hostname, nomeProp, departamento, modelo, numeroSerie], function (err) {
        if (err) {
            return res.status(500).send('Erro ao adicionar equipamento ao inventário: ' + err.message);
        }
        res.status(200).send('Equipamento adicionado ao inventário com sucesso!');
    });
});

// Endpoint para buscar todo o inventário
app.get('/inventory', (req, res) => {
    db.all(`SELECT * FROM equipment`, [], (err, rows) => {
        if (err) {
            return res.status(500).send('Erro ao buscar inventário: ' + err.message);
        }
        res.status(200).json(rows);
    });
});


// Endpoint para buscar os dados de um item específico para edição
app.get('/edit-item/:id', (req, res) => {
    const itemId = req.params.id;
    db.get(`SELECT * FROM equipment WHERE id = ?`, [itemId], (err, row) => {
        if (err) {
            return res.status(500).send('Erro ao buscar os dados do item: ' + err.message);
        }
        res.status(200).json(row);
    });
});

// Endpoint para atualizar um item específico
app.put('/update-item/:id', (req, res) => {
    const itemId = req.params.id;
    const {
        hostname,
        nomeProp,
        departamento,
        modelo,
        numeroSerie
    } = req.body;
    db.run(`UPDATE equipment SET hostname = ?, nomeProp = ?, departamento = ?, modelo = ?, numeroSerie = ? WHERE id = ?`,
        [hostname, nomeProp, departamento, modelo, numeroSerie, itemId],
        function (err) {
            if (err) {
                return res.status(500).send('Erro ao atualizar o item: ' + err.message);
            }
            res.status(200).send('Item atualizado com sucesso!');
        });
});


// Criação da tabela de transações com status adicional
db.run(`CREATE TABLE IF NOT EXISTS transactions (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    description TEXT,
    responsible TEXT,
    date_time TEXT,
    destination TEXT,
    observations TEXT,
    status TEXT DEFAULT 'Aguardando Devolução',
    returned_at TEXT
)`);

// Rota para registrar uma nova transação
app.post('/transactions', (req, res) => {
    const {
        description,
        responsible,
        dateTime,
        destination,
        observations
    } = req.body;
    const status = 'Aguardando Devolução'; // Certifique-se de que o status padrão está correto

    const query = `INSERT INTO transactions (description, responsible, date_time, destination, observations, status)
                   VALUES (?, ?, ?, ?, ?, ?)`;

    db.run(query, [description, responsible, dateTime, destination, observations, status], function (err) {
        if (err) {
            return res.status(500).json({
                error: err.message
            });
        }
        const newTransaction = {
            id: this.lastID,
            description,
            responsible,
            dateTime,
            destination,
            observations,
            status
        };
        res.status(201).json(newTransaction);
    });
});

// Rota para obter todas as transações
app.get('/transactions', (req, res) => {
    const query = `SELECT * FROM transactions`;

    db.all(query, [], (err, rows) => {
        if (err) {
            return res.status(500).json({
                error: err.message
            });
        }
        res.json(rows);
    });
});

// Rota para atualizar o status de uma transação
app.patch('/transactions/:id', (req, res) => {
    const {
        id
    } = req.params;
    const {
        status,
        returnedAt
    } = req.body;

    const query = `UPDATE transactions SET status = ?, returned_at = ? WHERE id = ?`;

    db.run(query, [status, returnedAt, id], function (err) {
        if (err) {
            return res.status(500).json({
                error: err.message
            });
        }
        if (this.changes === 0) {
            return res.status(404).json({
                error: 'Transação não encontrada'
            });
        }
        res.json({
            id,
            status,
            returnedAt
        });
    });
});


//FIM DAS ROTAS PARA ATUALIZAR STATUS DE DELVOLVIDO NA TABELA


// Iniciando o servidor na porta 3000
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`O Sistema de Inventário está On-Line na porta ${PORT}!`);
});