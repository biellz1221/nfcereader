// const catchAsync = require('../utils/catchAsync');
const { parse } = require('node-html-parser');
const puppeteer = require('puppeteer');
const { genericService } = require('../services');

const puppeteerGet = async (url) => {
  try {
    const browser = await puppeteer.launch({ headless: 'new' });
    const [page] = await browser.pages();

    await page.goto(url, { waitUntil: 'networkidle0' });
    const data = await page.evaluate(() => document.querySelector('*').outerHTML);

    await browser.close();

    return data;
  } catch (err) {
    console.error(err);
    throw new Error(err);
  }
};

const getNfe = async (req, res) => {
  const bd = req.body;
  // const nfehtml = await genericService.getNfeHtml(bd.nfeurl);
  try {
    const nfehtml = await puppeteerGet(bd.nfeurl.replace('http://', 'https://'));
    const parsed = parse(nfehtml);
    const itemsList = parsed.querySelectorAll('*[id^="Item +"]');

    const formattedItemsList = [];
    let valorTotalDaCompra = 0;
    let qtdItens = 0;

    itemsList.forEach((elem) => {
      const itemName = parse(elem).querySelector('td[valign=top] > .txtTit').text;
      const itemQtd = parseInt(parse(elem).querySelector('td[valign=top] > .Rqtd').text.split('Qtde.:')[1]);
      const itemValorUnit = parse(elem).querySelector('td[valign=top] > .RvlUnit').text.split('Vl. Unit.:')[1];

      const findItem = formattedItemsList.findIndex((item) => item.name === itemName);
      const floatValorUnit = parseFloat(itemValorUnit.trim().replace(',', '.'));

      if (findItem >= 0) {
        formattedItemsList[findItem].qtd += itemQtd;
        formattedItemsList[findItem].valorTotal += floatValorUnit;
      } else {
        let valorTotal = floatValorUnit;

        if (itemQtd > 1) {
          valorTotal = floatValorUnit * itemQtd;
        }

        const itemData = {
          name: itemName,
          qtd: itemQtd,
          valorUnit: floatValorUnit,
          valorTotal,
        };
        formattedItemsList.push(itemData);
      }

      valorTotalDaCompra += floatValorUnit;
      qtdItens += parseInt(itemQtd);
    });

    const nomeEstabelecimento = parse(parsed).querySelector('.txtCenter > .txtTopo').text;
    const cnpjEstabelecimento = parse(parsed)
      .querySelector('.txtCenter .text:not(:last-child)')
      .text.split('CNPJ:')[1]
      .trim();
    const endereco = parse(parsed)
      .querySelector('.txtCenter .text:last-child')
      .text.split('CNPJ:')[0]
      .replace(/\t+/g, ' ')
      .replace(/\n+/g, '')
      .trim();

    const tributos = parse(parsed).querySelector('.spcTop span.totalNumb');
    let tributosTotais = 'não informado';
    if (tributos) {
      tributosTotais = parseFloat(parse(parsed).querySelector('.spcTop span.totalNumb').text.trim().replace(',', '.'));
    }
    const chaveNFE = parse(parsed).querySelector('.chave').text.trim();

    const dataHoraEmissao = parse(parsed).querySelector('#infos ul li').rawText.split('- Via ')[0].split(' Emissão: ')[1];

    // console.log(dataHoraEmissao);

    const dataEmissao = dataHoraEmissao.split(' ')[0];
    const horaEmissao = dataHoraEmissao.split(' ')[1].substring(0, 8);
    const fusoEmissao = `GMT ${dataHoraEmissao.split(' ')[1].substring(8).trim()}`;

    const finalJson = {
      chaveNFE,
      estabelecimento: {
        nome: nomeEstabelecimento,
        cnpj: cnpjEstabelecimento,
      },
      dataEmissao: {
        dia: dataEmissao,
        hora: horaEmissao,
        fuso: fusoEmissao,
      },
      endereco,
      qtdItens,
      valorTotal: valorTotalDaCompra.toFixed(2),
      tributosTotais,
      items: formattedItemsList,
    };

    // console.log(finalJson);

    // res.send(nfehtml);
    res.send(finalJson);
  } catch (error) {
    console.error(error);
    res.send(error);
  }
};

module.exports = {
  getNfe,
};
