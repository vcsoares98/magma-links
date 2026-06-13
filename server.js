const express = require("express");
const fs = require("fs");
const QRCode = require("qrcode");

const app = express();

app.use(express.json());
app.use(express.static("public"));

function gerarCodigo() {
  const caracteres = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
  let codigo = "";

  for (let i = 0; i < 6; i++) {
    codigo += caracteres.charAt(
      Math.floor(Math.random() * caracteres.length)
    );
  }

  return codigo;
}

function carregarLinks() {
  try {
    const conteudo = fs.readFileSync(
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
    JSON.stringify(links, null, 2)
  );
}

// Criar link curto
app.post("/encurtar", async (req, res) => {

  let url = req.body.url;

  if (!url) {
    return res.status(400).json({
      erro: "URL obrigatória"
    });
  }

  if (
    !url.startsWith("http://") &&
    !url.startsWith("https://")
  ) {
    url = "https://" + url;
  }

  const alias = req.body.alias;

  let codigo;

  if (alias && alias.trim() !== "") {
    codigo = alias.trim();
  } else {
    codigo = gerarCodigo();
  }

  const links = carregarLinks();

  if (links[codigo]) {
    return res.status(400).json({
      erro: "Esse alias já existe"
    });
  }

  links[codigo] = url;

  salvarLinks(links);

  // ALTERE AQUI QUANDO CONFIGURAR O DOMÍNIO
  const linkCurto =
    "https://magma-links.onrender.com/" + codigo;

  try {

    const qrCode = await QRCode.toDataURL(
      linkCurto
    );

    res.json({
      link: linkCurto,
      qr: qrCode
    });

  } catch {

    res.status(500).json({
      erro: "Erro ao gerar QR Code"
    });

  }

});

// Redirecionar
app.get("/:codigo", (req, res) => {

  const codigo = req.params.codigo;

  const links = carregarLinks();

  const urlOriginal = links[codigo];

  if (urlOriginal) {

    res.redirect(urlOriginal);

  } else {

    res.status(404).send(
      "Link não encontrado"
    );

  }

});

const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
  console.log(
    `Servidor rodando na porta ${PORT}`
  );
});