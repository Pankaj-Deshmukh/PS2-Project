const cheerio = require('cheerio');
const axios = require('axios');
const fs = require("fs");

const URL = 'https://www.licpremiumcalculator.in/calc/calc914.php'
let headers={
  "Content-Type": "application/x-www-form-urlencoded; charset=UTF-8"
}
let train_data = []

const fetchHtml = async()=>{
  let z = 0;
  for(let x=12;x<=35;x++){
    if(x>20){ z++; }
    for(let y=8;y<=55-z;y++){
      try {
        let Payload ={
          table: 914,
          sa: 500000,
          age: y,
          term: x,
          dab: 'Y'
        }
        const response = await axios.post(URL,Payload,{
          headers
        })
        const html = response.data
        const $ = cheerio.load(html);

        const input = {
          "Basic Sum Assured": parseInt($('td:contains("Basic Sum Assured")').next().text()),
          "Age": parseInt($('td:contains("Age")').next().text()),
          "Policy Term": parseInt($('td:contains("Policy Term")').next().text())
        };

        const death = {
          "Death Sum Assured": parseInt($('td:contains("Death Sum Assured")').next().text()),
          "Accidental Rider Sum Assured": parseInt($('td:contains("Accidental Rider Sum Assured")').next().text()),
          "Term Rider Sum Assured": parseInt($('td:contains("Term Rider Sum Assured")').next().text())
        };

        const firstYearPremium = {};
        $('th:contains("First Year Premium")').closest('table').find('tr').each((i, el) => {
          const cells = $(el).find('td');
          if (cells.length === 4) {
            const mode = $(cells[0]).text().trim();
            if (mode !== "Mode") {
              firstYearPremium[mode] = {
                "Premium": parseInt($(cells[1]).text()),
                "GST": parseInt($(cells[2]).text()),
                "Total Premium": parseInt($(cells[3]).text())
              };
            }
          }
        });

        const secondYearOnwardPremium = {};
        $('th:contains("Second Year Onward Premium")').closest('table').find('tr').each((i, el) => {
          const cells = $(el).find('td');
          if (cells.length === 4) {
            const mode = $(cells[0]).text().trim();
            if (mode !== "Mode") {
              secondYearOnwardPremium[mode] = {
                "Premium": parseInt($(cells[1]).text()),
                "GST": parseInt($(cells[2]).text()),
                "Total Premium": parseInt($(cells[3]).text())
              };
            }
          }
        });

        const maturityBenefits = {};
        const table = $('div.ajdiv table');
        table.find('tr').slice(1).each(function (i, row) {
          const strongText = $(row).find('strong').text().trim();
          const valueText = $(row).find('td').eq(1).text().trim();
          maturityBenefits[strongText] = valueText;
        });

        const output = {
          death,
          "First Year Premium": firstYearPremium,
          "Second Year Onward Premium": secondYearOnwardPremium,
          "Maturity Benefits" : maturityBenefits
        };

        const result = {
          input,
          output
        };

        train_data.push(result)
        console.log(result.input.Age,result.input['Policy Term'])

      }
      catch(error){
        console.log('error occured ...!\n',error.message)
      }
    }
  }
}
fetchHtml().then(()=>{
  const path = "./meta_data.json";
    const string = JSON.stringify(train_data,null,2)
    fs.writeFile(path,string,(err)=>{
      if (err) console.log(err)
      else console.log("success")
    })
})