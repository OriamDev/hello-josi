const { faker } = require('@faker-js/faker');
const db = require("./db");

function criaFuncionario(numero = 10) {
    const insertFuncionarioQuery = `INSERT INTO funcionarios (
                nome_funcionario, email_funcionario, servico_funcionario, salario_funcionario, regime_funcionario, data_nascimento_funcionario)
                VALUES (?, ?, ?, ?, ?, ?)`

    for (let i = 0; i < numero; i++) {
        let fakeFuncionarioArray = fakeFuncionario();
        db.query(insertFuncionarioQuery, fakeFuncionarioArray, (err, result) => {
           if(err) throw err;
       })
    }
    console.info('Funcionarios criados!')
}
function fakeFuncionario() {
    return [
        faker.person.fullName(),
        faker.internet.email(),
        faker.helpers.arrayElement(['Web Design', 'Brand Design', 'Web Development', '3D Design']),
        faker.number.float({ min: 900, max: 2100, precision: 0.01 }),
        faker.helpers.arrayElement(['Full-Time', 'Part-Time']),
        faker.date.birthdate({ min: 18, max: 50, mode: 'age' })
    ];
}
function criaCliente(numero = 20) {
    const query = `INSERT INTO clientes (nome_cliente, email_cliente, morada_cliente, pais_cliente, cidade_cliente, telefone_cliente) VALUES (?,?,?,?,?,?)`;

    for (let i = 0; i < numero; i++) {
        let fakeClienteArray = fakeCliente();
        db.query(query, fakeClienteArray, (err, result) => {
            if(err) throw err;
        })
    }
    console.info('Clientes criados!')
}
function fakeCliente() {
    return [
        faker.person.fullName(),
        faker.internet.email(),
        faker.location.streetAddress({ useFullAddress: true }),
        faker.location.country(),
        faker.location.city(),
        faker.phone.number()
    ];
}
function criaProdutos(numero = 25) {
    const query = `INSERT INTO produtos (nome_produto, categoria_produto, preco_produto, estado_produto, desconto_produto) VALUES (?,?,?,?,?)`;
    for (let i = 0; i < numero; i++) {
        let fakeProdutoArray = fakeProduto();
        db.query(query, fakeProdutoArray, (err, result) => {
            if(err) throw err;
        })
    }
    console.info('Produtos criados!')
}
function fakeProduto() {
    let estado_produto = faker.helpers.arrayElement(['Disponível', 'Indisponível', 'Em promoção']);
    return [
        faker.commerce.productName(),
        faker.helpers.arrayElement(['Digital books', 'Modelos 3D', 'Pressets', 'Template Website', 'Wallpapers']),
        faker.number.float({ min: 9.99, max: 1000, precision: 0.01 }),
        estado_produto,
        estado_produto === 'Em promoção' ? faker.number.int({ min: 5, max: 25 }) : 0
    ];
}
function criaProjetos(numero = 15) {
    const query = `INSERT INTO projetos (nome_projeto, id_cliente, servico_projeto, data_inicio_projeto, preco_projeto, data_fim_projeto, estado_projeto) VALUES (?,?,?,?,?,?,?)`;
    const funcionariosQuery = `SELECT id_funcionario FROM funcionarios WHERE servico_funcionario = ?`;
    const projetoFuncionariosQuery = `INSERT INTO funcionario_projetos (id_funcionario, id_projeto) VALUES (?,?)`;

    for (let i = 0; i < numero; i++) {
        let fakeProjetoArray = fakeProjeto();
        db.query(query, fakeProjetoArray, (err, projeto) => {
            if(err) throw err;

            if(projeto) {

                db.query(funcionariosQuery, [fakeProjetoArray[2]], (err, funcionarios) => {
                    if(err) throw err;

                    if(funcionarios.length > 0) {
                        let funcionariosIds = funcionarios.map(funcionario => funcionario.id_funcionario)
                        let funcionariosParaProjeto = funcionariosIds.length > 1 ? faker.helpers.arrayElements(funcionariosIds, { min: 1, max: funcionariosIds.length - 1  }) : funcionariosIds;
                        funcionariosParaProjeto.forEach(funcionario => {
                            db.query(projetoFuncionariosQuery, [funcionario, projeto.insertId], (err, result) => {
                                if(err) throw err;
                            })
                        })

                    }

                })

            }
        })
    }

    console.info('Projetos criados!')
}
function fakeProjeto() {
    let estado_projeto = faker.helpers.arrayElement(['A Decorrer', 'Aprovado', 'Terminado']);
    let data_inicio_projeto = faker.date.between({ from: '2023-01-01T00:00:00.000Z', to: '2023-12-10T00:00:00.000Z' });
    let data_fim_projeto = estado_projeto === 'Terminado' ? faker.date.between({ from: data_inicio_projeto, to: '2023-12-10T00:00:00.000Z' }) : null;
    return [
        faker.lorem.sentence({ min: 3, max: 5 }),
        faker.number.int({ min: 1, max: 20 }),
        faker.helpers.arrayElement(['Web Design', 'Brand Design', 'Web Development', '3D Design']),
        data_inicio_projeto,
        faker.number.float({ min: 99, max: 3000, precision: 0.01 }),
        data_fim_projeto,
        estado_projeto
    ];
}
function criaVendas(numero = 100) {

    const vendaQuery = `INSERT INTO pedidos (data_pedido, hora_pedido, metodo_pagamento, cliente_id, subtotal_pedidos, imposto_pedidos) VALUES (?,?,?,?,?,?)`;
    const vendaProdutosQuery = `INSERT INTO pedido_produto (id_pedido, id_produto, cantidade_produto, preco_produto) VALUES (?,?,?,?)`;

    for (let i = 0; i < numero; i++) {

        let numeroDeProdutos = faker.number.int({ min: 1, max: 5 })
        let produtosParaVendaQuery = `SELECT * FROM produtos WHERE estado_produto <> 'Indisponivel' ORDER BY RAND() LIMIT ${numeroDeProdutos};`;

        db.query(produtosParaVendaQuery, (err, produtos) => {
            if (err) throw err;
            if(produtos) {
                let subTotal = 0;
                let impostos = 0;
                let produtosDaVenda = [];
                produtos.forEach(produto => {
                    let preco =  produto.desconto_produto > 0 ? produto.preco_produto - (produto.preco_produto * (produto.desconto_produto / 100)) : produto.preco_produto;
                    let quantidade = faker.number.int({ min: 1, max: 10 })
                    subTotal += (preco * quantidade);
                    produtosDaVenda.push({id: produto.id_produto, preco: preco, quantidade:quantidade})
                })
                impostos = subTotal * 0.23;


                let data_pedido = faker.date.between({ from: '2023-01-01T00:00:00.000Z', to: '2023-12-10T00:00:00.000Z' });
                let hora_pedido = `${data_pedido.getHours()}:${data_pedido.getMinutes()}:${data_pedido.getSeconds()}`;

                db.query(vendaQuery, [
                    data_pedido,
                    hora_pedido,
                    faker.helpers.arrayElement(['Cartão de Crédito', 'PayPal', 'Transferência Bancária']),
                    faker.number.int({ min: 1, max: 20 }),
                    subTotal,impostos
                ], (err, venda) => {
                    if(err) throw err;

                    if(venda) {
                        produtosDaVenda.forEach(produto => {
                            db.query(vendaProdutosQuery, [venda.insertId, produto.id, produto.quantidade, produto.preco], (err, result) => {
                                if (err) throw err;
                            })
                        })
                    }
                })
            }
        })
    }

    console.info('Vendas Criadas!');
}
function truncateTablas() {
    const FOREIGN_KEY_CHECKS_0 = "SET FOREIGN_KEY_CHECKS = 0";
    const truncateFuncionarios = 'TRUNCATE TABLE funcionarios';
    const truncateclientes = 'TRUNCATE TABLE clientes';
    const truncateProdutos = 'TRUNCATE TABLE produtos';
    const truncateProjetos = 'TRUNCATE TABLE projetos';
    const truncatePedidos = 'TRUNCATE TABLE pedidos';
    const FOREIGN_KEY_CHECKS_1 = "SET FOREIGN_KEY_CHECKS = 1";
    const query = `${FOREIGN_KEY_CHECKS_0};${truncateFuncionarios};${truncateclientes};${truncateProdutos};${truncateProjetos};${truncatePedidos};${FOREIGN_KEY_CHECKS_1}`;
    db.query(query, (err, result) => {
        if(err) throw err;
    });
}
function criaFakeData() {
    truncateTablas();
    criaFuncionario();
    criaCliente();
    criaProdutos();
    criaProjetos();
    criaVendas();
}

criaFakeData();



