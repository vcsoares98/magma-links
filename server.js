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

// Criar link curto
app.post("/encurtar", (req, res) => {

  let url = req.body.url;

  if (
    !url.startsWith("http://") &&
    !url.startsWith("https://")
  ) {
    url = "https://" + url;
  }

  const alias = req.body.alias;

  let codigo;

  if (alias) {
    codigo = alias;
  } else {
    codigo = gerarCodigo();
  }

  const links = JSON.parse(
    fs.readFileSync("links.json")
  );

  if (links[codigo]) {
    return res.send("Esse alias já existe");
  }

  links[codigo] = url;

  fs.writeFileSync(
    "links.json",
    JSON.stringify(links, null, 2)
  );

  const linkCurto =
    "https://magmafilms.com.br/" + codigo

  QRCode.toDataURL(linkCurto, (err, qrCode) => {

    res.json({
      link: linkCurto,
      qr: qrCode
    });

  });

});   // ← ESSA CHAVE ESTAVA FALTANDO

// Redirecionar
app.get("/:codigo", (req, res) => {

  const codigo = req.params.codigo;

  const links = JSON.parse(
    fs.readFileSync("links.json")
  );

  const urlOriginal = links[codigo];

  if (urlOriginal) {
    res.redirect(urlOriginal);
  } else {
    res.send("Link não encontrado");
  }

});

const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
  console.log(`Servidor rodando na porta ${PORT}`);
});