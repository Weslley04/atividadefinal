const express = require('express');
const Sequelize = require('sequelize');
const bcrypt = require('bcrypt');
const session = require('express-session');
const path = require('path'); 
const app = express();
const port = 3000;


app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'ejs');

app.use('/css', express.static(path.join(__dirname, 'css')));


const sequelize = new Sequelize('backatividade', 'root', '400289', {
  host: 'localhost',
  dialect: 'mysql',
});

const Usuario = sequelize.define('Usuario', {
  login: Sequelize.STRING,
  nome: Sequelize.STRING,
  senha: Sequelize.STRING,
  perfil: Sequelize.STRING,
});

app.use(express.urlencoded({ extended: true }));
app.use(session({
  secret: 'sua_chave_secreta',
  resave: false,
  saveUninitialized: true,
}));




//Autenticação
app.use((req, res, next) => {
   
    if (req.session.usuario || req.path === '/login' || req.path === '/cadastro' || req.path.startsWith('/alteracao') || req.path.startsWith('/exclusao')) {
   
      next();
    } else {
   
      res.redirect('/cadastro');
    }
  });
  
// página de cadastro
app.get('/', (req, res) => {
  res.redirect('/cadastro');
});

app.get('/cadastro', (req, res) => {
    res.render('cadastroUsuario');
  });
  
  app.post('/cadastro', async (req, res) => {
    try {
      const { login, nome, senha, perfil } = req.body;
      const hashedPassword = await bcrypt.hash(senha, 10);
  
      await Usuario.create({ login, nome, senha: hashedPassword, perfil });
  
      res.redirect('/login');
    } catch (error) {
      console.error(error);
      res.status(500).send('Erro interno do servidor');
    }
  });
  



//formulário de busca
app.get('/busca', (req, res) => {
    res.render('buscaUsuario');
  });
  
 // busca e exibir o resultado
app.post('/resultadoBusca', async (req, res) => {
  const { login } = req.body;

  try {
      const encontrado = await Usuario.findOne({ where: { login } });
      res.render('resultadoBusca', { usuario: encontrado });
  } catch (error) {
      console.error(error);
      res.status(500).send('Erro interno do servidor');
  }
});


app.get('/alteracao/:id', async (req, res) => {
  const { id } = req.params;

  try {
    const usuario = await Usuario.findByPk(id);
    res.render('alteracaoUsuario', { usuario });
  } catch (error) {
    console.error(error);
    res.status(500).send('Erro interno do servidor');
  }
});

app.post('/alteracao/:id', async (req, res) => {
  const { id } = req.params;
  const { nome, senha, perfil } = req.body;

  try {
    const hashedPassword = await bcrypt.hash(senha, 10);
    await Usuario.update({ nome, senha: hashedPassword, perfil }, { where: { id } });
    res.redirect('/busca');
  } catch (error) {
    console.error(error);
    res.status(500).send('Erro interno do servidor');
  }
});

app.get('/exclusao/:id', async (req, res) => {
  const { id } = req.params;

  try {
    const usuario = await Usuario.findByPk(id);
    res.render('excluirUsuario', { usuario });
  } catch (error) {
    console.error(error);
    res.status(500).send('Erro interno do servidor');
  }
});

app.post('/exclusao/:id', async (req, res) => {
  const { id } = req.params;

  try {
    await Usuario.destroy({ where: { id } });
    res.redirect('/busca');
  } catch (error) {
    console.error(error);
    res.status(500).send('Erro interno do servidor');
  }
});

// login
app.get('/login', (req, res) => {
  res.render('loginUsuario', { erro: req.session.erro }); 
});

app.post('/login', async (req, res) => {
  const { login, senha } = req.body;

  try {
    const usuario = await Usuario.findOne({ where: { login } });

    if (usuario && (await bcrypt.compare(senha, usuario.senha))) {

      req.session.usuario = {
        id: usuario.id,
        login: usuario.login,
        nome: usuario.nome,
        perfil: usuario.perfil,
      };

      res.redirect('/index');
    } else {
      req.session.erro = 'Credenciais inválidas'; 
      res.redirect('/loginUsuario');
    }
  } catch (error) {
    console.error(error);
    res.status(500).send('Erro interno do servidor');
  }
});


// caso o usuario esta autenticando vai para tela home
app.get('/index', (req, res) => {
  if (req.session.usuario) {
    res.render('index', { usuario: req.session.usuario });
  } else {
    res.redirect('/loginUsuario');
  }
});

sequelize
  .sync()
  .then(() => {
    app.listen(port, () => {
      console.log(`Servidor rodando em http://localhost:${port}`);
    });
  })
  .catch((error) => {
    console.error('Erro ao sincronizar com o banco de dados:', error);
  });
