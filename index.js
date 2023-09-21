'use strict'
const {get} = require('axios')
class Handler {
  constructor({rekoSvc, translatorSvc}) {
    this.rekoSvc = rekoSvc
    this.translatorSvc = translatorSvc
  }

  async translateText(text) {
    const params = { // params de acordo com contrato do traslator da aws
      SourceLanguageCode: 'en',
      TargetLanguageCode: 'pt',
      Text: text
    }

    const {TranslatedText} = await this.translatorSvc.translateText(params).promise()
    return TranslatedText.split(' e ')
  }

  async detectImageLabels(buffer) { 
    const result = await this.rekoSvc.detectLabels({
      Image: {
        Bytes: buffer
      }
    }).promise()
  

    const workingItems = result.Labels
    .filter(({Confidence}) => Confidence > 80)

    const names = workingItems.map(({Name}) => Name)
    .join(' and ')
    // console.log(workingItems)
    return {
      names,
      workingItems
    }
  }


  formatTextResults(texts, workingItems) {
    const finalText = []
    for(const indexText in texts) {
      const nameInPortugues = texts[indexText]
      const confidence = workingItems[indexText].Confidence
      finalText.push(` ${confidence.toFixed(2)}% de ser do tipo ${nameInPortugues}`)
    }

    return finalText.join('\n')
  }

  async getImageBuffer(imageUrl) {
    const response = await get(imageUrl, {
      responseType: 'arraybuffer'
    })
    
    const buffer = Buffer.from(response.data, 'base64')
    return buffer
  }
  
  async main(event) {
    try {
      const {imageUrl} = event.queryStringParameters
      // const imgBuffer = await readFile('./images/cat.jpeg')
      console.log("donwload image...")
      const buffer = await this.getImageBuffer(imageUrl)
      console.log('***Detectiong lables...')
      const {names, workingItems} = await this.detectImageLabels(buffer)
      const texts = await this.translateText(names)
      console.log('translate labes...')
      // console.log({names, workingItems} )
      console.log('handling final object...')
      const finalText = this.formatTextResults(texts, workingItems)
      console.log('finishing...')
      return {
        statusCode: 200,
        body: `A imagem tem \n`.concat(finalText)
      }

    } catch (error) {
      console.log('Error***', error.stack)
      return {
        statusCode: 500,
        body: 'Internal server error!'
      }
    }
  }
}
//factory
const aws = require('aws-sdk')
const reko = new aws.Rekognition()
const translator = new aws.Translate()
const handler = new Handler({
  rekoSvc: reko,
  translatorSvc: translator
})

module.exports.main = handler.main.bind(handler)
/* 
bind() -> dependendo do que veio e dependendo quem chamou nossa função main ela pode alterar 
o contexto this da função e pode se perder uando o .bind ignora tudo que veio nessa requisição
e quero que vc usa as variavies dessa propria instancia.
*/