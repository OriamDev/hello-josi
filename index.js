const express = require("express");
const session = require("express-session");
const fileUpload = require("express-fileupload");
const path = require("path");
const app = express();
const db = require("./db");

app.use(express.urlencoded({ extended: true }))
app.use(express.static(path.join(__dirname, 'public')))
app.set('view engine', 'ejs')
app.set('views', path.join(__dirname, 'views'))
app.use(session({secret: 'secret', resave: false, saveUninitialized: false}))
app.use(fileUpload({}))

const server = app.listen(8080, function () {
    const host = server.address().address;
    const port = server.address().port;
    console.log("servidor a ser executado em " + host + ":" + port);
    console.info('Link => http://localhost:' + port);
});

const categoriasDoProduto = ['Digital books', 'Modelos 3D', 'Pressets', 'Template Website', 'Wallpapers'];
const estadosDoProduto = ['Disponível', 'Indisponível', 'Em promoção'];
const servicos = ['Web Design', 'Brand Design', 'Web Development', '3D Design'];
const estadosDoProjeto = ['A Decorrer', 'Aprovado', 'Terminado']

function transformarDataParaInput(data) {
    const year = data.getFullYear();
    const month = String(data.getMonth() + 1).padStart(2, '0');
    const day = String(data.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
}

function gerarPrecoHtmlComDesconto(produto) {
    let preco = parseFloat(produto.preco_produto);
    let descontoBadge = '';
    let precoComDesconto = '';
    let precoHtml = '';
    if(produto.desconto_produto) {
        let desconto = parseFloat(produto.desconto_produto);
        precoComDesconto = (preco - (preco * (desconto / 100))).toFixed(2)
        descontoBadge = `<span class="badge badge-danger position-absolute">-${desconto}%</span>`;
        precoHtml += `<span class="text-muted" style="text-decoration: line-through;">${preco.toFixed(2)} €</span>
            <span class="text-danger ml-2" style="font-size: 1.1rem;">${precoComDesconto} €</span>`;
    } else {
        precoHtml += `<span class="text-dark">${preco.toFixed(2)} €</span>`;
    }
    return precoHtml;
}
function auth(req, res, next) {
    if(req.session.user) {
        return next()
    }
    return res.redirect('/login')
}
function guest(req, res, next) {
    if(req.session.user) {
        return res.redirect('/dashboard')
    }
    return next()
}

app.get('/', (req, res) => {
    let utilizador = req.session.user;

    //Primeira visita ao sistema
    //Verificar se existe um utilizador com email josi@teste.com
    //Se não existe criar
    const utilizadorQuery = `SELECT * FROM utilizadores WHERE email_utilizador = ? LIMIT 1`;
    const adminNome = 'Josireth Rodriguez';
    const adminEmail = 'josi@teste.com';
    const adminPass = 'Pa$$w0rd!';
    db.query(utilizadorQuery, [adminEmail], (err, result) => {
        if(err) throw err;
        //Não existe o utilizador com o email josi@teste.com
        if (! result.length > 0) {
            const insertUtilizadorQuery = `INSERT INTO utilizadores (nome_utilizador, email_utilizador, palavra_passe_utilizador) VALUES (?, ?, SHA(?))`;
            db.query(insertUtilizadorQuery, [adminNome, adminEmail, adminPass], (err, result) => {
                if(err) throw err;
                if(result) {
                    console.log('Utilizador admin foi criado corretamente!')
                }
            })
        } else {
            console.log('Utilizador admin já existe na base de dados!')
        }
    })

    return res.render('inicio', {utilizador: utilizador})
})
app.get('/login', guest, (req, res) => {
    let message;

    if(req.session.flash_message) {
        message = req.session.flash_message[0];
        req.session.flash_message = '';
    }

    return res.render('login', {message: message})
})
app.post('/login', guest, (req, res) => {
    let message = [];
    if(req.body.email && req.body.password) {
        const loginQuery = `SELECT * FROM utilizadores WHERE email_utilizador = ? AND palavra_passe_utilizador = SHA(?) LIMIT 1`;
        db.query(loginQuery, [req.body.email, req.body.password], (err, result) => {
            if(err) {
                message.push({type: 'danger', text: err.sqlMessage})
                req.session.flash_message = message;
                return res.redirect('/login');
            }
            if(result.length > 0) {
                let utilizador = result[0];
                req.session.user = {id: utilizador.id_utilizador, nome: utilizador.nome_utilizador};
                return res.redirect('/dashboard')
            } else {
                message.push({type: 'danger', text: 'As credenciais não são corretas'})
                req.session.flash_message = message;
                return res.redirect('/login');
            }
        })
    } else {
        message.push({type: 'danger', text: 'Email e palavra-passe são requeridos'})
        req.session.flash_message = message;
        return res.redirect('/login');
    }
})
app.post('/fechar-sessao', auth, (req, res) => {
    req.session.user = '';
    return res.redirect('/');
})

app.get('/dashboard', auth, (req, res) => {
    let utilizador = req.session.user;

    const totalVendasQuery = 'SELECT SUM(subtotal_pedidos) as total_vendas FROM pedidos';
    const projetosDecorrer = `SELECT COUNT(id_projeto) AS projetos_decorrer FROM projetos WHERE estado_projeto = 'A Decorrer'`;
    const produtosDisponiveisQuery = `SELECT COUNT(id_produto) AS produtos_disponiveis FROM produtos WHERE estado_produto <> 'Indisponível'`;
    const proximosProjetosQuery = `SELECT nome_projeto, nome_cliente, data_fim_projeto FROM projetos INNER JOIN clientes 
                                                USING (id_cliente) WHERE estado_projeto = 'A Decorrer' ORDER BY data_fim_projeto LIMIT 3`;
    const melhoresClientesQuery = `SELECT c.id_cliente, c.nome_cliente, c.pais_cliente, SUM(p.subtotal_pedidos) AS total 
                                                FROM pedidos p INNER JOIN clientes c ON p.cliente_id = c.id_cliente GROUP BY c.id_cliente, c.nome_cliente, c.pais_cliente 
                                                ORDER BY total DESC LIMIT 3;`;

    const query = `${totalVendasQuery};${projetosDecorrer};${produtosDisponiveisQuery};${proximosProjetosQuery};${melhoresClientesQuery}`;

    db.query(query, (err, result) => {
        if (err) throw err;

        if(result) {
            const totalVendas = parseFloat(result[0][0].total_vendas ?? 0).toFixed(2);
            const projetosDecorrer =  result[1][0].projetos_decorrer;
            const produtosDisponiveis = result[2][0].produtos_disponiveis;
            const proximosProjetos = result[3];
            const melhoresClientes = result[4];

            return res.render('dashboard', {
                utilizador: utilizador,
                total_vendas: totalVendas,
                projetos_decorrer: projetosDecorrer,
                produtos_disponiveis: produtosDisponiveis,
                proximosProjetos: proximosProjetos,
                melhoresClientes: melhoresClientes
            });
        }
    })
});

/*** Rotas para gerir os produtos (CRUD) */
app.get('/products', auth, (req, res) => {
    let utilizador = req.session.user;
    const query = 'SELECT * FROM produtos';
    db.query(query, (err, result) => {
        if (err) {
            throw err;
        }

        let message = [];

        if(req.session.flash_message) {
            message = req.session.flash_message[0];
            req.session.flash_message = '';
        }

        if(result) {
            return res.render('products/index', {products: result, message: message, utilizador:utilizador})
        }
    })
})
app.get('/products/create', auth, (req, res) => {
    let utilizador = req.session.user;
    let message = [];

    if(req.session.flash_message) {
        message = req.session.flash_message[0];
        req.session.flash_message = '';
    }

    return res.render('products/create', {
        categoriasDoProduto: categoriasDoProduto,
        estadosDoProduto: estadosDoProduto,
        message: message,
        utilizador: utilizador
    });
})
app.post('/products', auth, (req, res) => {
    let message = [];

    //1. check for all required form fields
    if (req.body.nome_produto && req.body.categoria_produto && parseFloat(req.body.preco_produto) > 0.00
        && req.body.estado_produto) {

        //2. check if discount is > 0.00 when status is Em promoção
        if(req.body.estado_produto === 'Em promoção' && parseFloat(req.body.desconto_produto) === 0.00) {
            message.push({type: 'danger', text: 'Desconto é requerido se o estado é Em promoção'})
            req.session.flash_message = message;
            return res.redirect('/products/create');
        }

        const query = `INSERT INTO produtos (nome_produto, categoria_produto, preco_produto, estado_produto, desconto_produto) VALUES (?,?,?,?,?)`;

        const params = [
            req.body.nome_produto,
            req.body.categoria_produto,
            parseFloat(req.body.preco_produto),
            req.body.estado_produto,
            parseFloat(req.body.desconto_produto),
        ];

        db.query(query, params, (err, result) => {
            if(err) {
                message.push({type: 'danger', text: 'Erro na consulta SQL'})
                req.session.flash_message = message;
                return res.redirect('/products/create');
            }

            if(result) {
                const novoProdutoId = result.insertId;

                // If it has files
                if(req.files && req.files.imagem_produto) {
                    let filename = req.files.imagem_produto.name;
                    req.files.imagem_produto.mv(`public/uploads/${filename}`, (err) => {
                        if (err) {
                            message.push({type: 'danger', text: 'Erro no momento de mover o ficheiro'})
                            req.session.flash_message = message;
                            return res.redirect('/products/create');
                        } else {
                            const updateProductImage = `UPDATE produtos SET imagem_produto = ? WHERE id_produto = ?`;
                            db.query(updateProductImage, [filename, novoProdutoId], (err, result) => {
                                if (err) {
                                    console.error(err);
                                }
                            })
                        }
                    })
                }

                message.push({type: 'success', text: 'O produto foi criado corretamente'})
                req.session.flash_message = message;
                return res.redirect('/products');

            }

        })

    } else {
        message.push({type: 'danger', text: 'Nome, categoria, preço e estado são requeridos'})
        req.session.flash_message = message;
        return res.redirect('/products/create');
    }
})
app.get('/products/edit/:product_id', auth, (req, res) => {
    let utilizador = req.session.user;
    const productQuery = `SELECT * FROM produtos WHERE id_produto = ? LIMIT 1`;
    let message = [];
    if(req.session.flash_message) {
        message = req.session.flash_message[0];
        req.session.flash_message = '';
    }

    db.query(productQuery, [req.params.product_id],(err, result) => {
        if (err) throw err;
        if(result) {
            const produto = result[0];

            return res.render('products/edit', {
                categoriasDoProduto: categoriasDoProduto,
                estadosDoProduto: estadosDoProduto,
                produto: produto,
                message: message,
                utilizador: utilizador
            })
        }
    })
})
app.post('/products/update/:product_id', auth,(req, res) => {
    let message = [];
    const productId = req.params.product_id;

    //1. check for all required form fields
    if(req.body.nome_produto && req.body.categoria_produto && parseFloat(req.body.preco_produto) > 0.00
        && req.body.estado_produto) {

        //2. check if discount is > 0.00 when status is Em promoção
        if(req.body.estado_produto === 'Em promoção' && parseFloat(req.body.desconto_produto) === 0.00) {
            message.push({type: 'danger', text: 'Desconto é requerido se o estado é Em promoção'})
            req.session.flash_message = message;
            return res.redirect('/products/edit/'+productId);
        }

        //3. update products fields
        const query = `UPDATE produtos SET 
                nome_produto = ?, 
                categoria_produto = ?, 
                preco_produto = ?, 
                estado_produto = ?,
                desconto_produto = ?
                WHERE id_produto = ?`;

        const params = [
            req.body.nome_produto,
            req.body.categoria_produto,
            parseFloat(req.body.preco_produto),
            req.body.estado_produto,
            parseFloat(req.body.desconto_produto),
            productId
        ];

        //4. execute the query
        db.query(query, params,(err, result) => {
            if(err) {
                message.push({type: 'danger', text: 'Erro na consulta SQL'})
                req.session.flash_message = message;
                return res.redirect('/products/edit/'+productId);
            }

            // If it has files
            if(req.files && req.files.imagem_produto) {
                let filename = req.files.imagem_produto.name;
                req.files.imagem_produto.mv(`public/uploads/${filename}`, (err) => {
                    if (err) {
                        message.push({type: 'danger', text: 'Erro no momento de mover o ficheiro'})
                        req.session.flash_message = message;
                        return res.redirect('/products/edit/'+productId);
                    } else {
                        const updateProductImage = `UPDATE produtos SET imagem_produto = ? WHERE id_produto = ?`;
                        db.query(updateProductImage, [filename, productId], (err, result) => {
                            if (err) {
                                console.error(err);
                            }
                        })
                    }
                })
            }

            message.push({type: 'success', text: 'O produto foi atualizado corretamente'})
            req.session.flash_message = message;
            return res.redirect('/products');
        })

    } else {
        message.push({type: 'danger', text: 'Nome, categoria, preço e estado são requeridos'})
        req.session.flash_message = message;
        return res.redirect('/products/edit/'+productId);
    }

})
app.post('/products/delete/:product_id', auth,(req, res) => {
    if(req.params.product_id) {
        let message = [];
        const productId = req.params.product_id;
        //1 check for orders where product is present and delete
        const pedidosQuery = 'DELETE FROM pedido_produto WHERE id_produto = ?';
        db.query(pedidosQuery, [productId], (err, result) => {
            if(err) {
                message.push({type: 'danger', text: err.sqlMessage })
                req.session.flash_message = message;
                return res.redirect('/products');
            }

            //orders were removed and now perform remove on products
            if(result) {
                const productQuery = 'DELETE FROM produtos WHERE id_produto = ?'
                db.query(productQuery, [productId], (err, result) => {
                    if(err) {
                        message.push({type: 'danger', text: err.sqlMessage })
                        req.session.flash_message = message;
                        return res.redirect('/products');
                    }

                    message.push({type: 'success', text: 'Produto corretamente apagado da base de dados'})
                    req.session.flash_message = message;
                    return res.redirect('/products');
                })
            }
        })
    }
})
// +++++++++++++++++++++++++++++ FIM Rotas para gerir os produtos (CRUD)

/*** Rotas para gerir os funcionarios (CRUD) */
app.get('/funcionarios', auth, (req, res) => {
    let utilizador = req.session.user;
    let message = [];

    if(req.session.flash_message) {
        message = req.session.flash_message[0];
        req.session.flash_message = '';
    }

    const funcionariosQuery = 'SELECT * FROM funcionarios';
    db.query(funcionariosQuery, (err, result) => {
        if(err) {
            throw err;
        }

        if(result) {
            return res.render('funcionarios/index', {funcionarios: result, message: message, utilizador: utilizador})
        }
    })
})
app.get('/funcionarios/create', auth, (req, res) => {
    let utilizador = req.session.user;
    let message = [];
    if(req.session.flash_message) {
        message = req.session.flash_message[0];
        req.session.flash_message = '';
    }

    return res.render('funcionarios/create', {servicos: servicos, message: message, utilizador: utilizador})
});
app.post('/funcionarios', auth, async (req, res) => {
    let message = [];

    //check for all required fields to create a "funcionario"
    if (req.body.nome_funcionario && req.body.email_funcionario && req.body.servico_funcionario
        && req.body.salario_funcionario && req.body.regime_funcionario && req.body.data_nascimento_funcionario) {

        const funcionarioQuery = `INSERT INTO funcionarios (
                nome_funcionario, email_funcionario, servico_funcionario, salario_funcionario, regime_funcionario, data_nascimento_funcionario)
                VALUES (?, ?, ?, ?, ?, ?)`;

        const params = [
            req.body.nome_funcionario,
            req.body.email_funcionario,
            req.body.servico_funcionario,
            req.body.salario_funcionario,
            req.body.regime_funcionario,
            req.body.data_nascimento_funcionario,
        ];

        db.query(funcionarioQuery, params, (err, result) => {
            if(err) {
                throw err;
            }

            if(result.insertId) {
                message.push({type: 'success', text: 'O funcionario foi criado corretamente'})
                req.session.flash_message = message;
                return res.redirect('/funcionarios');
            }
        })


    } else {
        message.push({
            type: 'danger',
            text: 'Nome, email, serviço, salario, regime, data de nascimento'
        })
        req.session.flash_message = message;
        return res.redirect('/funcionarios/create');
    }
})
app.get('/funcionarios/edit/:funcionario_id', auth, (req, res) => {
    let utilizador = req.session.user;
    let message = [];
    if(req.session.flash_message) {
        message = req.session.flash_message[0];
        req.session.flash_message = '';
    }
    const funcionarioQuery = `SELECT * FROM funcionarios WHERE id_funcionario = ? LIMIT 1`;
    db.query(funcionarioQuery, [req.params.funcionario_id], (err, result) => {
        if(err) { throw err; }

        if(result) {
            let funcionario = result[0];
            funcionario.data_nascimento_funcionario = transformarDataParaInput(funcionario.data_nascimento_funcionario)

            return res.render('funcionarios/edit', {message: message, servicos: servicos, funcionario: funcionario, utilizador:utilizador})
        }
    })
})
app.post('/funcionarios/update/:funcionario_id', auth,(req, res) => {
    let message = [];

    //check for all required fields to create a "funcionario"
    if (req.params.funcionario_id && req.body.nome_funcionario && req.body.email_funcionario && req.body.servico_funcionario
        && req.body.salario_funcionario && req.body.regime_funcionario && req.body.data_nascimento_funcionario) {

        const funcionarioId = req.params.funcionario_id;

        const funcionarioQuery = `UPDATE funcionarios SET 
                nome_funcionario = ?, 
                email_funcionario = ?, 
                servico_funcionario = ?, 
                salario_funcionario = ?, 
                regime_funcionario = ?, 
                data_nascimento_funcionario = ?
                WHERE id_funcionario = ?`;

        const params = [
            req.body.nome_funcionario,
            req.body.email_funcionario,
            req.body.servico_funcionario,
            req.body.salario_funcionario,
            req.body.regime_funcionario,
            req.body.data_nascimento_funcionario,
            funcionarioId
        ];

        db.query(funcionarioQuery, params, (err, result) => {
            if(err) {
                message.push({type: 'danger', text: err.sqlMessage})
                req.session.flash_message = message;
                return res.redirect('/funcionarios/edit/'+funcionarioId);
            }

            message.push({type: 'success', text: 'O funcionario foi atualizado corretamente'})
            req.session.flash_message = message;
            return res.redirect('/funcionarios');
        })
    }
})
app.post('/funcionarios/delete/:funcionario_id', auth, (req, res) => {
    if(req.params.funcionario_id) {
        let message = [];
        const funcionarioId = req.params.funcionario_id;
        //1 check for projeects where "funcionario" is present and delete
        const funcionarioProjetosQuery = 'DELETE FROM funcionario_projetos WHERE id_funcionario = ?';
        db.query(funcionarioProjetosQuery, [funcionarioId], (err, result) => {
            if(err) {
                message.push({type: 'danger', text: err.sqlMessage })
                req.session.flash_message = message;
                return res.redirect('/funcionarios');
            }

            //projects were removed and now perform remove on "funcionarios"
            if(result) {
                const funcionarioQuery = 'DELETE FROM funcionarios WHERE id_funcionario = ?'
                db.query(funcionarioQuery, [funcionarioId], (err, result) => {
                    if(err) {
                        message.push({type: 'danger', text: err.sqlMessage })
                        req.session.flash_message = message;
                        return res.redirect('/funcionarios');
                    }

                    message.push({type: 'success', text: 'Funcionario corretamente apagado da base de dados'})
                    req.session.flash_message = message;
                    return res.redirect('/funcionarios');
                })
            }
        })
    }
})
// +++++++++++++++++++++++++++++  FIM Rotas para gerir os funcionarios (CRUD)

/*** Rotas para gerir os clientes (CRUD) */
app.get('/clientes', auth, (req, res) => {
    let utilizador = req.session.user;
    let message = [];

    if(req.session.flash_message) {
        message = req.session.flash_message[0];
        req.session.flash_message = '';
    }

    const clientesQuery = 'SELECT * FROM clientes';
    db.query(clientesQuery, (err, result) => {
        if(err) {
            throw err;
        }

        if(result) {
            return res.render('clientes/index', {clientes: result, message: message, utilizador:utilizador})
        }
    })
})
app.get('/clientes/create', auth, (req, res) => {
    let utilizador = req.session.user;
    let message = [];
    if(req.session.flash_message) {
        message = req.session.flash_message[0];
        req.session.flash_message = '';
    }

    return res.render('clientes/create', {message: message, utilizador:utilizador})
});
app.post('/clientes', auth, (req, res) => {
    let message = [];
    //check all required fields
    if(req.body.nome_cliente && req.body.email_cliente && req.body.morada_cliente
        && req.body.pais_cliente && req.body.cidade_cliente && req.body.telefone_cliente) {

        const query = `INSERT INTO clientes (nome_cliente, email_cliente, morada_cliente, pais_cliente, cidade_cliente, telefone_cliente) VALUES (?,?,?,?,?,?)`;

        const params = [
            req.body.nome_cliente,
            req.body.email_cliente,
            req.body.morada_cliente,
            req.body.pais_cliente,
            req.body.cidade_cliente,
            req.body.telefone_cliente
        ];

        db.query(query, params, (err, result) => {
            if(err) throw err;

            if(result) {
                message.push({type: 'success', text: 'O cliente foi criado corretamente'})
                req.session.flash_message = message;
                return res.redirect('/clientes');
            }
        })

    } else {
        message.push({
            type: 'danger',
            text: 'Nome, email, morada, pais, cidade, e telefone são requeridos'
        })
        req.session.flash_message = message;
        return res.redirect('/clientes/create');
    }
})
app.get('/clientes/edit/:cliente_id', auth, (req, res) => {
    let utilizador = req.session.user;
    let message = [];
    if(req.session.flash_message) {
        message = req.session.flash_message[0];
        req.session.flash_message = '';
    }
    const clienteQuery = `SELECT * FROM clientes WHERE id_cliente = ? LIMIT 1`;
    db.query(clienteQuery, [req.params.cliente_id], (err, result) => {
        if(err) { throw err; }

        if(result) {
            let cliente = result[0];
            return res.render('clientes/edit', {message: message, cliente: cliente, utilizador:utilizador})
        }
    })
})
app.post('/clientes/update/:cliente_id', auth, (req, res) => {
    let message = [];
    if(req.session.flash_message) {
        message = req.session.flash_message[0];
        req.session.flash_message = '';
    }
    if(req.params.cliente_id) {
        const clienteId = req.params.cliente_id;

        const clienteQuery = `UPDATE clientes SET 
            nome_cliente = ?,
            email_cliente = ?,
            morada_cliente = ?,
            pais_cliente = ?,
            cidade_cliente = ?,
            telefone_cliente = ? WHERE id_cliente = ?`;

        const params = [
            req.body.nome_cliente,
            req.body.email_cliente,
            req.body.morada_cliente,
            req.body.pais_cliente,
            req.body.cidade_cliente,
            req.body.telefone_cliente,
            clienteId
        ];

        db.query(clienteQuery, params, (err, result) => {
            if(err) { throw err; }

            if(result) {
                message.push({type: 'success', text: 'O cliente foi editado corretamente'})
                req.session.flash_message = message;
                return res.redirect('/clientes');
            }
        })
    }
})
app.post('/clientes/delete/:cliente_id', auth, (req, res) => {
    if(req.params.cliente_id) {
        let message = [];
        const clienteId = req.params.cliente_id;
        //1 check for projeects where "funcionario" is present and delete
        const clienteProjetosQuery = 'DELETE FROM projetos WHERE id_cliente = ?';
        db.query(clienteProjetosQuery, [clienteId], (err, result) => {
            if(err) {
                message.push({type: 'danger', text: err.sqlMessage })
                req.session.flash_message = message;
                return res.redirect('/clientes');
            }

            //projects were removed and now perform remove on "vendas"
            if(result) {
                const clienteVendasQuery = 'DELETE FROM pedidos WHERE cliente_id = ?'
                db.query(clienteVendasQuery, [clienteId], (err, result) => {
                    if(err) {
                        message.push({type: 'danger', text: err.sqlMessage })
                        req.session.flash_message = message;
                        return res.redirect('/clientes');
                    }

                    //vendas were removed and now perform remove on clientes
                    if(result) {
                        const clienteQuery = `DELETE FROM clientes WHERE id_cliente = ?`;
                        db.query(clienteQuery, [clienteId], (err, resul) => {
                            if(err) {
                                message.push({type: 'danger', text: err.sqlMessage })
                                req.session.flash_message = message;
                                return res.redirect('/clientes');
                            }

                            message.push({type: 'success', text: 'Cliente corretamente apagado da base de dados'})
                            req.session.flash_message = message;
                            return res.redirect('/clientes');
                        })
                    }
                })
            }
        })
    }
})
// +++++++++++++++++++++++++++++ FIM Rotas para gerir os clientes (CRUD)

/*** Rotas para gerir os projetos (CRUD) */
app.get('/projetos', auth, (req, res) => {
    let utilizador = req.session.user;
    let message = [];

    if(req.session.flash_message) {
        message = req.session.flash_message[0];
        req.session.flash_message = '';
    }

    const projetosQuery = `SELECT 
                            p.*,
                            c.nome_cliente,
                            GROUP_CONCAT(f.nome_funcionario SEPARATOR ',') AS funcionarios
                        FROM projetos p
                        LEFT JOIN clientes c ON p.id_cliente = c.id_cliente
                        LEFT JOIN funcionario_projetos fp ON p.id_projeto = fp.id_projeto
                        LEFT JOIN funcionarios f ON fp.id_funcionario = f.id_funcionario
                        GROUP BY p.id_projeto;`;


    db.query(projetosQuery, (err, projetos) => {
        if(err) {
            throw err;
        }
        if(projetos) {
            return res.render('projetos/index', {projetos: projetos, message: message, utilizador:utilizador})
        }
    })
})
app.get('/projetos/create', auth, (req, res) => {
    let utilizador = req.session.user;
    let message = [];
    if(req.session.flash_message) {
        message = req.session.flash_message[0];
        req.session.flash_message = '';
    }
    const clientesQuery = `SELECT id_cliente, nome_cliente FROM clientes`;
    db.query(clientesQuery, (err, result) => {
        if (err) throw err;
        if(result) {
            return res.render('projetos/create', {
                message: message,
                clientes: result,
                servicos: servicos,
                estadosDoProjeto: estadosDoProjeto,
                utilizador:utilizador
            })
        }
    })
})
app.post('/projetos', auth, (req, res) => {
    let message = [];
    //check for required fields
    if(req.body.nome_projeto && req.body.id_cliente && req.body.servico_projeto && req.body.data_inicio_projeto && req.body.preco_projeto) {
        const queryProjeto = `INSERT INTO projetos (nome_projeto, id_cliente, servico_projeto, data_inicio_projeto, preco_projeto, data_fim_projeto, estado_projeto) VALUES (?,?,?,?,?,?,?)`;

        const params = [
            req.body.nome_projeto,
            req.body.id_cliente,
            req.body.servico_projeto,
            req.body.data_inicio_projeto,
            req.body.preco_projeto,
            req.body.data_fim_projeto.length === 0 ? null : req.body.data_fim_projeto,
            req.body.estado_projeto ?? estadosDoProjeto[0]
        ];

        db.query(queryProjeto, params, (err, result) => {
            if(err) throw err;
            if (result) {
                message.push({type: 'success', text: 'O Projeto foi criado corretamente'})
                req.session.flash_message = message;
                return res.redirect('/projetos');
            }
        })
    } else {
        message.push({
            type: 'danger',
            text: 'Nome, cliente, serviço, data de inicio, e preço são requeridos'
        })
        req.session.flash_message = message;
        return res.redirect('/projetos/create');
    }

})
app.get('/projetos/edit/:projeto_id', auth, (req, res) => {
    let utilizador = req.session.user;
    let message = [];
    if(req.session.flash_message) {
        message = req.session.flash_message[0];
        req.session.flash_message = '';
    }
    const projetoQuery = `SELECT * FROM projetos WHERE id_projeto = ? LIMIT 1`;
    const clientesQuery = `SELECT id_cliente, nome_cliente FROM clientes`;
    db.query(`${projetoQuery};${clientesQuery}`, [req.params.projeto_id], (err, result) => {
        if(err) { throw err; }

        if(result) {
            let projeto = result[0][0];
            let clientes = result[1];

            projeto.data_inicio_projeto = transformarDataParaInput(projeto.data_inicio_projeto);
            projeto.data_fim_projeto = transformarDataParaInput(projeto.data_fim_projeto);

            return res.render('projetos/edit', {
                message: message,
                projeto: projeto,
                clientes: clientes,
                servicos: servicos,
                estadosDoProjeto: estadosDoProjeto,
                utilizador:utilizador
            })
        }
    })
})
app.post('/projetos/update/:projeto_id', auth,(req, res) => {
    let message = [];

    if(req.params.projeto_id && req.body.nome_projeto && req.body.id_cliente && req.body.servico_projeto && req.body.data_inicio_projeto && req.body.preco_projeto) {
        const query = `UPDATE projetos SET 
                            nome_projeto = ?, 
                            id_cliente = ?, 
                            servico_projeto = ?, 
                            data_inicio_projeto = ?, 
                            preco_projeto = ?, 
                            data_fim_projeto = ?, 
                            estado_projeto = ? 
                            WHERE id_projeto = ?`;

        const params = [
            req.body.nome_projeto,
            req.body.id_cliente,
            req.body.servico_projeto,
            req.body.data_inicio_projeto,
            req.body.preco_projeto,
            req.body.data_fim_projeto,
            req.body.estado_projeto,
            req.params.projeto_id
        ];

        db.query(query, params, (err, result) => {
            if(err) { throw err; }

            if(result) {
                message.push({type: 'success', text: 'O projeto foi editado corretamente'})
                req.session.flash_message = message;
                return res.redirect('/projetos');
            }
        })
    } else {
        message.push({
            type: 'danger',
            text: 'Nome, cliente, serviço, data de inicio, e preço são requeridos'
        })
        req.session.flash_message = message;
        return res.redirect('/projetos/create');
    }
})
app.get('/projetos/funcionarios/:projeto_id', auth, (req, res) => {
    let utilizador = req.session.user;
    let message = [];
    if(req.params.projeto_id) {

        if(req.session.flash_message) {
            message = req.session.flash_message[0];
            req.session.flash_message = '';
        }

        const projetoQuery = `SELECT id_projeto, servico_projeto FROM projetos WHERE id_projeto = ? LIMIT 1`;
        const funcionariosDoProjetoQuery = `SELECT id_funcionario FROM funcionario_projetos WHERE id_projeto = ?`;
        const query = `${projetoQuery};${funcionariosDoProjetoQuery}`;
        db.query(query, [req.params.projeto_id,req.params.projeto_id], (err, result) => {
            if (err) throw err;
            if(result) {

                const projeto = result[0][0];
                const servico = projeto.servico_projeto;
                const funcionariosDoProjeto = result[1].map(item => item.id_funcionario);

                const funcionariosQuery = `SELECT id_funcionario, nome_funcionario FROM funcionarios WHERE servico_funcionario = ?`;

                db.query(funcionariosQuery, [servico], (err, funcionarios) => {
                    if (err) throw err;
                    if(funcionarios) {
                        return res.render('projetos/funcionarios', {
                            projeto: projeto,
                            funcionarios: funcionarios,
                            funcionariosDoProjeto: funcionariosDoProjeto,
                            message: message,
                            utilizador:utilizador
                        })
                    }
                })
            }
        })
    }
})
app.post('/projetos/funcionarios/:projeto_id', auth, (req, res) => {
    let message = [];
    if(req.params.projeto_id) {
        const removeFuncionariosQuery = `DELETE FROM funcionario_projetos WHERE id_projeto = ?`;
        const funcionariosArray = req.body.projeto_funcionarios ?? [];
        db.query(removeFuncionariosQuery, [req.params.projeto_id], (err, result) => {
            if (err) throw err;

            if(result) {
                const projetoFuncionariosQuery = `INSERT INTO funcionario_projetos (id_funcionario, id_projeto) VALUES (?,?)`;
                funcionariosArray.forEach(funcionario => {
                    db.query(projetoFuncionariosQuery, [funcionario, req.params.projeto_id], (err, result) => {
                        if (err) throw err;
                    })
                })
                message.push({type: 'success', text: 'O Projeto foi atualizado corretamente'})
                req.session.flash_message = message;
                return res.redirect('/projetos');
            }
        })
    } else {
        message.push({
            type: 'danger',
            text: 'Escolher pelo menos um funcionario'
        })
        req.session.flash_message = message;
        return res.redirect('/projetos/funcionarios/'+req.params.projeto_id);
    }
})
app.post('/projetos/delete/:projeto_id', auth, (req, res) => {
    if(req.params.projeto_id) {
        let message = [];
        const projetoId = req.params.projeto_id;

        const funcionariosProjetoQuery = `DELETE FROM funcionario_projetos WHERE id_projeto = ?`;

        db.query(funcionariosProjetoQuery, [req.params.projeto_id], (err, result) => {
            if(err) {
                message.push({type: 'danger', text: err.sqlMessage })
                req.session.flash_message = message;
                return res.redirect('/projetos');
            }

            if(result) {
                const removeProjeto = `DELETE FROM projetos WHERE id_projeto = ?`;

                db.query(removeProjeto, [req.params.projeto_id], (err, result) => {
                    if(err) {
                        message.push({type: 'danger', text: err.sqlMessage })
                        req.session.flash_message = message;
                        return res.redirect('/projetos');
                    }

                    if(result) {
                        message.push({type: 'success', text: 'Projeto corretamente apagado da base de dados'})
                        req.session.flash_message = message;
                        return res.redirect('/projetos');
                    }
                })
            }
        })
    }
})
// +++++++++++++++++++++++++++++ FIM Rotas para gerir os projetos (CRUD)

/*** Rotas para gerir as vendas (CRUD) */
app.get('/vendas', auth, (req, res) => {
    let utilizador = req.session.user;
    let message = [];
    if(req.session.flash_message) {
        message = req.session.flash_message[0];
        req.session.flash_message = '';
    }
    const vendasQuery = `SELECT p.*, c.nome_cliente FROM pedidos as p LEFT JOIN clientes as c ON p.cliente_id = c.id_cliente`;
    db.query(vendasQuery, (err, vendas) => {
        if(err) { throw err; }
        if(vendas) {
            return res.render('vendas/index', {vendas: vendas, message: message, utilizador:utilizador})
        }
    })
})
app.get('/vendas/create', auth, (req, res) => {
    let utilizador = req.session.user;
    let message = [];
    if(req.session.flash_message) {
        message = req.session.flash_message[0];
        req.session.flash_message = '';
    }
    let clientes = [];
    let carrinho = req.session.carrinho ?? [];
    let subtotal = 0;
    let impostos = 0;
    let total = 0;

    const produtosQuery = `SELECT * FROM produtos WHERE estado_produto <> 'Indisponível'`;
    const clientesQuery = `SELECT id_cliente, nome_cliente FROM clientes`;
    const query = `${produtosQuery};${clientesQuery}`;
    db.query(query, (err, result) => {
        if (err) { throw err; }

        let produtos = result[0].map(produto => {
            return {
                ...produto,
                precoHtml: gerarPrecoHtmlComDesconto(produto)
            }
        })

        clientes = result[1];

        if(carrinho.length) {
            carrinho.forEach(produto => {
                subtotal += (produto.preco * produto.quantidade)
            })

            impostos = subtotal * 0.23;
            total = subtotal + impostos;
        }

        if(produtos) {
            return res.render('vendas/create', {
                produtos: produtos,
                clientes: clientes,
                message: message,
                carrinho: carrinho,
                subtotal: subtotal,
                impostos: impostos,
                total: total,
                utilizador:utilizador
            })
        }
    })
})
app.get('/vendas/create/adicionar-produto/:id_produto', auth, (req, res) => {
    let utilizador = req.session.user;
    let message = [];
    if(req.params.id_produto) {
        const produtoQuery = `SELECT * FROM produtos WHERE id_produto = ? AND estado_produto <> 'Indisponível' LIMIT 1`;
        db.query(produtoQuery, [req.params.id_produto], (err, result) => {
            if (err) { throw err; }
            if(result) {
                let produto = result[0];
                produto.preco = produto.desconto_produto ? (produto.preco_produto - (produto.preco_produto * (produto.desconto_produto / 100))).toFixed(2) : produto.preco_produto.toFixed(2);
                let carrinho = typeof req.session.carrinho === 'undefined' ? [] : req.session.carrinho;

                //1. Se existe no carrinho atualizar a quantidade
                if(carrinho && carrinho.some(obj => obj.id_produto === parseInt(req.params.id_produto))) {
                    let produtoNoCarrinho = carrinho.find(produto => produto.id_produto === parseInt(req.params.id_produto));
                    if(produtoNoCarrinho) {
                        produtoNoCarrinho.quantidade += 1;
                        message.push({type: 'success', text: 'Produto atualizado no carrinho!'})
                    }
                } else { // adicionar novo produto ao carrinho
                    produto.quantidade = 1;
                    carrinho.push(produto)
                    message.push({type: 'success', text: 'Produto adicionado ao carrinho!'})
                }

                req.session.carrinho = carrinho;
                req.session.flash_message = message;
                return res.redirect('/vendas/create');
            }
        })
    }
})
app.get('/vendas/create/remover-produto/:id_produto', auth, (req, res) => {
    let utilizador = req.session.user;
    let message = [];
    if(req.params.id_produto) {
        let carrinho = req.session.carrinho;
        req.session.carrinho = carrinho.filter(produto => produto.id_produto !== parseInt(req.params.id_produto));
        message.push({type: 'success', text: 'Produto removido do carrinho!'})
        req.session.flash_message = message;
    }
    return res.redirect('/vendas/create');
})
app.post('/vendas/finalizar-venda', auth,(req, res) => {
    let message = [];
    if(req.body.id_cliente && req.session.carrinho && req.body.metodo_pagamento) {
        let carrinho = req.session.carrinho;
        const vendaQuery = `INSERT INTO pedidos (data_pedido, hora_pedido, metodo_pagamento, cliente_id, subtotal_pedidos, imposto_pedidos) VALUES (?,?,?,?,?,?)`;

        let date = new Date();
        let dataCompra = transformarDataParaInput(date);
        let horaCompra = `${date.getHours()}:${date.getMinutes()}:${date.getSeconds()}`;
        let subtotal = 0;
        carrinho.forEach(produto => {
            subtotal += (produto.preco * produto.quantidade)
        })
        let impostos = subtotal * 0.23;

        const params = [
            dataCompra,
            horaCompra,
            req.body.metodo_pagamento,
            req.body.id_cliente,
            subtotal,
            impostos
        ];

        db.query(vendaQuery, params, (err, venda) => {
            if (err) {
                message.push({type: 'danger', text: err.sqlMessage})
                req.session.flash_message = message;
                return res.redirect('/vendas/create');
            }
            if(venda) {
                let id_pedido = venda.insertId;
                const vendaProdutosQuery = `INSERT INTO pedido_produto (id_pedido, id_produto, cantidade_produto, preco_produto) VALUES (?,?,?,?)`;
                carrinho.forEach(produto => {
                    let params = [
                        id_pedido,
                        produto.id_produto,
                        produto.quantidade,
                        produto.preco
                    ];
                    db.query(vendaProdutosQuery, params, (err, result) => {
                        if (err) {
                            message.push({type: 'danger', text: err.sqlMessage})
                            req.session.flash_message = message;
                            return res.redirect('/vendas/create');
                        }
                    })
                })
                req.session.carrinho = '';
                message.push({type: 'success', text: 'Venda registada com sucesso'})
                req.session.flash_message = message;
                return res.redirect('/vendas');
            }
        })

    } else {
        message.push({type: 'danger', text: 'Deve escolher um cliente'})
        req.session.flash_message = message;
        return res.redirect('/vendas/create');
    }
})
app.get('/vendas/ver/:id_pedido', auth, (req, res) => {
    let utilizador = req.session.user;
    let message = [];
    if(req.params.id_pedido) {
        const vendaQuery = `SELECT * FROM pedidos WHERE id_pedido = ? LIMIT 1`;
        const vendaProdutosQuery = `SELECT pp.*, p.nome_produto, p.categoria_produto, p.imagem_produto FROM pedido_produto as pp INNER JOIN produtos p on p.id_produto = pp.id_produto WHERE id_pedido = ?`
        const query = `${vendaQuery};${vendaProdutosQuery}`;
        db.query(query, [req.params.id_pedido, req.params.id_pedido], (err, result) => {
            if (err) {
                message.push({type: 'danger', text: err.sqlMessage})
                req.session.flash_message = message;
                return res.redirect('/vendas');
            }
            if(result) {
                let venda = result[0][0];
                let produtos = result[1];

                const clienteQuery = `SELECT * FROM clientes WHERE id_cliente = ? LIMIT 1`;
                db.query(clienteQuery, [venda.cliente_id], (err, cliente) => {
                    if (err) {
                        message.push({type: 'danger', text: err.sqlMessage})
                        req.session.flash_message = message;
                        return res.redirect('/vendas', {utilizador: utilizador});
                    }
                    if(cliente) {
                        return res.render('vendas/show', {venda: venda, produtos: produtos, cliente: cliente[0], utilizador:utilizador})
                    }
                })
            }
        })
    }
})
// +++++++++++++++++++++++++++++ FIM Rotas para gerir as vendas (CRUD)

app.get('*', function (req, res) {
    let utilizador = req.session.user;
    res.render('404', {utilizador: utilizador});
});
