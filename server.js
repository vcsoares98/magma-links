const express = require("express");
const fs = require("fs");
const QRCode = require("qrcode");

const app = express();

app.use(express.json());

// ====================================
// LOGIN
// ====================================

const usuario = "magma";
const senha = "Mox6h27n#";

// ====================================
// AUTENTICAÇÃO
// ====================================

function proteger(req, res, next) {

  const authHeader = req.headers.authorization;

  if (!authHeader) {

    res.setHeader(
      "WWW-Authenticate",
      'Basic realm="Magma Links"'
    );

    return res
      .status(401)
      .send("Autenticação necessária");
  }

  const base64 =
    authHeader.split(" ")[1];

  const credenciais =
    Buffer.from(base64, "base64")
      .toString();

  const [user, pass] =
    credenciais.split(":");

  if (
    user === usuario &&
    pass === senha
  ) {
    return next();
  }

  res.setHeader(
    "WWW-Authenticate",
    'Basic realm="Magma Links"'
  );

  return res
    .status(401)
    .send("Usuário ou senha inválidos");
}

// ====================================
// ARQUIVOS ESTÁTICOS
// ====================================

app.use("/images", express.static("public/images"));
app.use("/style.css", express.static("public/style.css"));

// ====================================
// FUNÇÕES
// ====================================

function gerarCodigo() {

  const caracteres =
    "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";

  let codigo = "";

  for (let i = 0; i < 6; i++) {

    codigo += caracteres.charAt(
      Math.floor(
        Math.random() *
        caracteres.length
      )
    );

  }

  return codigo;

}

function carregarLinks() {

  try {

    const conteudo =
      fs.readFileSync(
        "links.json",
        "utf8"
      );

    return conteudo
      ? JSON.parse(conteudo)
      : {};

  } catch {

    return {};

  }

}

function salvarLinks(links) {

  fs.writeFileSync(
    "links.json",
    JSON.stringify(
      links,
      null,
      2
    )
  );

}

// ====================================
// PÁGINA INICIAL PROTEGIDA
// ====================================

app.get("/", proteger, (req, res) => {

  res.sendFile(
    __dirname +
    "/public/index.html"
  );

});

// ====================================
// ADMIN PROTEGIDO
// ====================================

app.get(
  "/admin.html",
  proteger,
  (req, res) => {

    res.sendFile(
      __dirname +
      "/public/admin.html"
    );

  }
);

// ====================================
// CRIAR LINK
// ====================================

app.post(
  "/encurtar",
  proteger,
  async (req, res) => {

    let url = req.body.url;

    if (!url) {

      return res
        .status(400)
        .json({
          erro:
            "URL obrigatória"
        });

    }

    if (
      !url.startsWith(
        "http://"
      ) &&
      !url.startsWith(
        "https://"
      )
    ) {

      url =
        "https://" + url;

    }

    const alias =
      req.body.alias;

    let codigo;

    if (
      alias &&
      alias.trim() !== ""
    ) {

      codigo =
        alias.trim();

    } else {

      codigo =
        gerarCodigo();

    }

    const links =
      carregarLinks();

    if (links[codigo]) {

      return res
        .status(400)
        .json({
          erro:
            "Esse alias já existe"
        });

    }

    links[codigo] = url;

    salvarLinks(links);

    const linkCurto =
      "https://links.magmafilms.com.br/" +
      codigo;

    try {

      const qrCode =
        await QRCode.toDataURL(
          linkCurto
        );

      res.json({
        link:
          linkCurto,
        qr:
          qrCode
      });

    } catch {

      res
        .status(500)
        .json({
          erro:
            "Erro ao gerar QR Code"
        });

    }

  }
);

// ====================================
// LISTAR LINKS
// ====================================

app.get(
  "/api/links",
  proteger,
  (req, res) => {

    const links =
      carregarLinks();

    res.json(links);

  }
);

// ====================================
// EXCLUIR LINK
// ====================================

app.delete(
  "/api/links/:codigo",
  proteger,
  (req, res) => {

    const codigo =
      req.params.codigo;

    const links =
      carregarLinks();

    delete links[codigo];

    salvarLinks(links);

    res.json({
      sucesso: true
    });

  }
);

// ====================================
// REDIRECIONAMENTO PÚBLICO
// ====================================

app.get(
  "/:codigo",
  (req, res) => {

    const codigo =
      req.params.codigo;

    const links =
      carregarLinks();

    const urlOriginal =
      links[codigo];

    if (urlOriginal) {

      res.redirect(
        urlOriginal
      );

    } else {

      res
        .status(404)
        .send(
          "Link não encontrado"
        );

    }

  }
);

// ====================================
// SERVIDOR
// ====================================

const PORT =
  process.env.PORT ||
  3000;

app.listen(PORT, () => {

  console.log(
    `Servidor rodando na porta ${PORT}`
  );

});